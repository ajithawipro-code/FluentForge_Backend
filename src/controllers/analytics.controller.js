import { supabase } from "../configs/supabase.js";

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Get user aggregate data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("total_xp, streak_count")
      .eq("id", userId)
      .single();

    if (userError) {
      return res.status(500).json({ message: userError.message });
    }

    // 2️⃣ Get completed lessons ordered by completion time
    const { data: progress, error: progressError } = await supabase
      .from("user_progress")
      .select("lesson_id, completed_at")
      .eq("user_id", userId)
      .eq("completed", true)
      .order("completed_at", { ascending: true });

    if (progressError) {
      return res.status(500).json({ message: progressError.message });
    }

    const lessonsCompleted = progress.length;

    // If no lessons completed, return minimal snapshot
    if (lessonsCompleted === 0) {
      return res.status(200).json({
        totalXp: user.total_xp,
        streak: user.streak_count,
        lessonsCompleted: 0,
        timeline: []
      });
    }

    // 3️⃣ Fetch XP values for those completed lessons
    const lessonIds = progress.map(p => p.lesson_id);

    const { data: lessons, error: lessonError } = await supabase
      .from("lessons")
      .select("id, xp")
      .in("id", lessonIds);

    if (lessonError) {
      return res.status(500).json({ message: lessonError.message });
    }

    // 4️⃣ Create lessonId → xp map
    const xpMap = {};
    lessons.forEach(lesson => {
      xpMap[lesson.id] = lesson.xp || 0;
    });

    // 5️⃣ Build cumulative XP timeline
 


const dailyXpMap = {};

progress.forEach(entry => {
 const date = new Date(entry.completed_at)
  .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const xpEarned = xpMap[entry.lesson_id] || 0;

  if (!dailyXpMap[date]) {
    dailyXpMap[date] = 0;
  }

  dailyXpMap[date] += xpEarned;
});

const timeline = Object.keys(dailyXpMap).map(date => ({
  date,
  xp: dailyXpMap[date]
}));

    // 6️⃣ Return analytics snapshot
    return res.status(200).json({
      totalXp: user.total_xp,
      streak: user.streak_count,
      lessonsCompleted,
      timeline
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};