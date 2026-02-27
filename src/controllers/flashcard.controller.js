import { supabase } from "../configs/supabase.js";

export const getFlashcardsByLessonId = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const { data, error } = await supabase
      .from("flashcards")
      .select("id, front_text, back_text, difficulty_level")
      .eq("lesson_id", lessonId);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};