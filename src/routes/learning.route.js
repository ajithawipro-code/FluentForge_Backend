import express from "express";
import { getLanguages, getModulesForUser,getModulesByLangId, getLessonsByModuleId, getQuestionsByLessonId} from "../controllers/learning.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";


export const learningRoute = express.Router();

learningRoute.get ("/getLanguages", authenticate, getLanguages);
learningRoute.get("/modules", authenticate, getModulesForUser);
learningRoute.get("/modules/:langId", authenticate, getModulesByLangId);
learningRoute.get("/lessons/:moduleId", authenticate, getLessonsByModuleId);
learningRoute.get("/questions/:lessonId", authenticate, getQuestionsByLessonId);
