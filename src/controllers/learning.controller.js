import { supabase } from "../configs/supabase.js";

export const getLanguages = async(req,res) =>{
    try {
        
    const {data,error} = await supabase.from("languages")
                                       .select();
                                       
    if(error)
    {
        return res.status(500).json({error: error.message});
    }

    return res.status(200).json({
         message: "All languages fetched",
         status: true,
         data
        });        
    } 
    catch (error) 
    {
        return res.status(500).json({error: error.message});
        
    }

}

export const getModulesByLangId = async(req,res) =>{

    try {

    const langId = req.params.langId;
  
    const {data,error} = await supabase.from("modules")  
                                       .select()                                     
                                       .eq("language_id", langId);
                                      
    if(error)
    {
        return res.status(500).json({error: error.message});
    }

    return res.status(200).json({message: "All modules for the particular language",
                                 status:  true,
                                 data
    });   

        
    } catch (error) 
    {

        return res.status(500).json({error: error.message});
        
    }
}


export const getModulesForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Get user's language
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("language_id")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return res.status(500).json({ message: "User language not found" });
    }

    const languageId = userData.language_id;

    // 2️⃣ Get modules ordered properly
    const { data: modules, error: moduleError } = await supabase
      .from("modules")
      .select("*")
      .eq("language_id", languageId)
      .order("display_order", { ascending: true });

    if (moduleError) {
      return res.status(500).json({ message: moduleError.message });
    }

    const moduleIds = modules.map(m => m.id);

    // 3️⃣ Get lessons for those modules
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, module_id")
      .in("module_id", moduleIds);

    // 4️⃣ Get completed lessons
    const { data: completedLessons } = await supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("completed", true);

    const completedIds = completedLessons.map(l => l.lesson_id);

    // 5️⃣ Calculate progress per module
    const modulesWithProgress = modules.map(module => {
      const moduleLessons = lessons.filter(
        lesson => lesson.module_id === module.id
      );

      const total = moduleLessons.length;

      const completed = moduleLessons.filter(
        lesson => completedIds.includes(lesson.id)
      ).length;

      const progress =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        ...module,
        progress
      };
    });

    // 6️⃣ Add locking logic
    const modulesWithLock = modulesWithProgress.map((module, index) => {
      if (index === 0) {
        return {
          ...module,
          locked: false
        };
      }

      const previousModule = modulesWithProgress[index - 1];

      return {
        ...module,
        locked: previousModule.progress < 100
      };
    });

    return res.status(200).json({
      success: true,
      modules: modulesWithLock
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLessonsByModuleId = async (req, res) => {
  try {
    const userId = req.user.id;
    const { moduleId } = req.params;

    // 1️⃣ Get user's language
    const { data: userData } = await supabase
      .from("users")
      .select("language_id")
      .eq("id", userId)
      .single();

    const languageId = userData.language_id;

    // 2️⃣ Get all modules ordered
    const { data: modules } = await supabase
      .from("modules")
      .select("*")
      .eq("language_id", languageId)
      .order("display_order", { ascending: true });

    const currentModuleIndex = modules.findIndex(m => m.id === moduleId);

    if (currentModuleIndex === -1) {
      return res.status(404).json({ message: "Module not found" });
    }

    // 3️⃣ Get lessons of ALL modules
    const moduleIds = modules.map(m => m.id);

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, module_id")
      .in("module_id", moduleIds);

    // 4️⃣ Get completed lessons
    const { data: completedLessons } = await supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("completed", true);

    const completedIds = completedLessons.map(l => l.lesson_id);

    // 5️⃣ Calculate progress per module
    const modulesWithProgress = modules.map(module => {
      const moduleLessons = lessons.filter(
        lesson => lesson.module_id === module.id
      );

      const total = moduleLessons.length;

      const completed = moduleLessons.filter(
        lesson => completedIds.includes(lesson.id)
      ).length;

      const progress =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        ...module,
        progress
      };
    });

    // 6️⃣ Check if module is locked
    if (currentModuleIndex !== 0) {
      const previousModule = modulesWithProgress[currentModuleIndex - 1];

      if (previousModule.progress < 100) {
        return res.status(403).json({
          message: "Module is locked. Complete previous module first."
        });
      }
    }

    // 7️⃣ Now fetch lessons of requested module
    const { data: moduleLessons, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("module_id", moduleId)
      .order("order", { ascending: true });

    if (error) throw error;

    // 8️⃣ Apply lesson-level locking (your existing logic)
    const lessonsWithLock = moduleLessons.map((lesson, index) => {
      if (index === 0) {
        return { ...lesson, locked: false };
      }

      const previousLesson = moduleLessons[index - 1];
      const isPreviousCompleted = completedIds.includes(previousLesson.id);

      return {
        ...lesson,
        locked: !isPreviousCompleted
      };
    });

    return res.status(200).json({
      success: true,
      data: lessonsWithLock
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export const getQuestionsByLessonId = async(req, res) => {
  try {
    const userId = req.user.id;
    const {lessonId} = req.params;

    const {data:lesson, error: lessonError} = await supabase.from("lessons")
                                                               .select("*")
                                                               .eq("id", lessonId)
                                                               .single();

    if (lessonError || !lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const {data:lessons} = await supabase.from("lessons")
                                            .select("*")
                                            .eq("module_id", lesson.module_id)
                                            .order("order", { ascending: true });

   
    const {data:progress} = await supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("completed", true);

    const completedLessonIds = progress.map(p => p.lesson_id);

    let isLocked = true;

    for (let i=0; i<lessons.length;i++) {
      if (lessons[i].id === lessonId) {
        if (i===0) {
          isLocked = false;
        } else {
          const previousLesson = lessons[i - 1];
          if (completedLessonIds.includes(previousLesson.id)) {
            isLocked = false;
          }
        }
        break;
      }
    }

    if (isLocked) {
      return res.status(403).json({message: "Lesson is locked"});
    }

    const {data:questions, error:questionError} = await supabase.from("questions")
                                                                  .select("*")
                                                                  .eq("lesson_id", lessonId);

    if (questionError) throw questionError;

    res.status(200).json({
                         success: true,
                         lesson,
                         questions
                         });

  } catch (error) {
    return res.status(500).json({message : error.message});
  }
};

   

