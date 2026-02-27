import express from "express";
import { getFlashcardsByLessonId } from "../controllers/flashcard.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export const flashRoute = express.Router();

flashRoute.get("/flashcards/:lessonId", authenticate , getFlashcardsByLessonId);