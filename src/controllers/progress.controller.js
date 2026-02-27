import { supabase } from "../configs/supabase.js";

export const submitProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {lessonId,answers} = req.body;

    if(!lessonId || !answers || !Array.isArray(answers)){
      return res.status(400).json({message:"Invalid request data"});
    }

    const {data:questions,error:questionError} = await supabase.from("questions")
                                                               .select("id,correct_answer")
                                                               .eq("lesson_id",lessonId);

    if(questionError){
      return res.status(500).json({message:questionError.message});
    }

    let score = 0;

    for(let q of questions){
      const userAnswer = answers.find(a=>a.questionId===q.id);
      if(userAnswer && userAnswer.selected===q.correct_answer){
        score++;
      }
    }

const {error:progressError} = await supabase.from("user_progress")
                                            .upsert({
                                              user_id: userId,
                                              lesson_id: lessonId,
                                              completed: true,
                                              score: score,
                                              completed_at: new Date().toISOString() 
                                              },{
                                                 onConflict: "user_id,lesson_id"
                                                });

    if(progressError){
      return res.status(500).json({message:progressError.message});
    }
    // 🔥 Get lesson XP
const { data: lessonData, error: lessonXpError } = await supabase
  .from("lessons")
  .select("xp")
  .eq("id", lessonId)
  .single();

if (lessonXpError || !lessonData) {
  return res.status(500).json({ message: "Lesson XP not found" });
}

const xpEarned = lessonData.xp;

    // const xpEarned = score*10;

    const {data:userData,error:userError} = await supabase.from("users")
                                                          .select("total_xp,streak_count,last_active_date")
                                                          .eq("id",userId)
                                                          .single();

    if(userError){
      return res.status(500).json({message:userError.message});
    }

    const newTotalXp = (userData.total_xp||0)+xpEarned;

    const today = new Date();
    const todayDate = today.toISOString().split("T")[0];

    let newStreak = 1;

    if(userData.last_active_date){
      const lastDate = new Date(userData.last_active_date);
      const diffTime = today-lastDate;
      const diffDays = Math.floor(diffTime/(1000*60*60*24));

      if(diffDays===1){
        newStreak = (userData.streak_count||0)+1;
      }
      else if(diffDays===0){
        newStreak = userData.streak_count;
      }
      else{
        newStreak = 1;
      }
    }

    const {error:updateUserError} = await supabase.from("users")
                                                  .update({
                                                    total_xp:newTotalXp,
                                                    streak_count:newStreak,
                                                    last_active_date:todayDate
                                                  })
                                                  .eq("id",userId);

    if(updateUserError){
      return res.status(500).json({message:updateUserError.message});
    }

    return res.status(200).json({
      message:"Progress saved successfully",
      score,
      xpEarned,
      totalXp:newTotalXp,
      streak:newStreak
    });

  }catch(error){
    return res.status(500).json({message:error.message});
  }
};


export const getUserProgress = async(req,res) =>{

    try {

        const id= req.user.id;

        const{data,error} = await supabase.from("user_progress")
                                          .select()
                                          .eq("user_id",id);
        if(error)
        {
            return res.status(400).json({error: error.message});
        }

        return res.status(200).json({
            message: "User progress fetched successfully",
            status: true,
            data
        })
        
    } catch (error) {

        return res.status(500).json({error: error.message});
        
    }


}

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const {data:userInfo,error:userInfoError} = await supabase.from("users")
                                                              .select("total_xp,streak_count,daily_goal")
                                                              .eq("id",userId)
                                                              .single();

    if(userInfoError)
      return res.status(500).json({message:userInfoError.message});

    const {count:totalLessons,error:totalLessonsError} = await supabase.from("lessons")
                                                                       .select("*",{count:"exact",head:true});

    if(totalLessonsError)
      return res.status(500).json({message:totalLessonsError.message});

    const {data:completedData,error:completedError} = await supabase.from("user_progress")
                                                                    .select("lesson_id,score,completed,completed_at")
                                                                    .eq("user_id",userId)
                                                                    .eq("completed",true);

    if(completedError)
      return res.status(500).json({message:completedError.message});

    const completedLessons = completedData.length;
    const remainingLessons = totalLessons-completedLessons;
    const completionPercentage = totalLessons===0 ? 0 : Math.round((completedLessons/totalLessons)*100);

    const totalScore = completedData.reduce((acc,item)=>acc+(item.score||0),0);
    const averageScore = completedLessons===0 ? 0 : Math.round(totalScore/completedLessons);

    let strongestLesson = null;
    let weakestLesson = null;

    if(completedLessons>0){
      const sorted = [...completedData].sort((a,b)=>b.score-a.score);
      strongestLesson = sorted[0];
      weakestLesson = sorted[sorted.length-1];
    }

    const today = new Date().toISOString().split("T")[0];

    const lessonsCompletedToday = completedData.filter(item=>{
      return item.completed_at && item.completed_at.startsWith(today);
    }).length;

    const dailyGoal = userInfo.daily_goal||1;
    const dailyProgressPercentage = dailyGoal===0 ? 0 : Math.min(100,Math.round((lessonsCompletedToday/dailyGoal)*100));

    const {data:modules,error:moduleError} = await supabase.from("modules")
                                                           .select("id,title");

    if(moduleError)
      return res.status(500).json({message:moduleError.message});

    const moduleBreakdown = [];

    for(let module of modules){
      const {data:lessons} = await supabase.from("lessons")
                                           .select("id,title")
                                           .eq("module_id",module.id);

      const lessonIds = lessons.map(l=>l.id);

      const completedInModule = completedData.filter(item=>lessonIds.includes(item.lesson_id)).length;

      const percentage = lessonIds.length===0 ? 0 : Math.round((completedInModule/lessonIds.length)*100);

      moduleBreakdown.push({
        moduleId:module.id,
        moduleTitle:module.title,
        totalLessons:lessonIds.length,
        completedLessons:completedInModule,
        percentage
      });
    }

    const {data:allLessons,error:lessonFetchError} = await supabase.from("lessons")
                                                                   .select("id,title");

    if(lessonFetchError)
      return res.status(500).json({message:lessonFetchError.message});

    const completedLessonIds = completedData.map(item=>item.lesson_id);
    const nextLesson = allLessons.find(lesson=>!completedLessonIds.includes(lesson.id))||null;

    const reviewLesson = weakestLesson ? {
      lesson_id:weakestLesson.lesson_id,
      score:weakestLesson.score
    } : null;

    const achievements = [];

    const totalXp = userInfo.total_xp||0;
    const streak = userInfo.streak_count||0;

    if(totalXp>=50) achievements.push("⭐ 50 XP Earned");
    if(totalXp>=100) achievements.push("🔥 100 XP Master");
    if(totalXp>=300) achievements.push("🏆 Learning Champion");

    if(streak>=3) achievements.push("🔥 3 Day Streak");
    if(streak>=7) achievements.push("🔥 7 Day Streak");
    if(streak>=30) achievements.push("🔥 30 Day Legend");

    if(completionPercentage>=50) achievements.push("📘 Halfway There");
    if(completionPercentage===100) achievements.push("🎓 Course Completed");

    return res.status(200).json({
      overview:{
        totalLessons,
        completedLessons,
        remainingLessons,
        completionPercentage
      },
      performance:{
        totalScore,
        averageScore,
        strongestLesson,
        weakestLesson
      },
      gamification:{
        totalXp,
        streak,
        dailyGoal,
        lessonsCompletedToday,
        dailyProgressPercentage
      },
      recommendations:{
        nextLesson,
        reviewLesson
      },
      achievements,
      modules:moduleBreakdown
    });

  }catch(error){
    return res.status(500).json({message:error.message});
  }
};