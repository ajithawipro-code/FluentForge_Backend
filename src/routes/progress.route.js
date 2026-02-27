import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { submitProgress , getUserProgress, getDashboardData} from "../controllers/progress.controller.js";

export const progressRoute = express.Router();

progressRoute.post("/submitProgress", authenticate, submitProgress);
progressRoute.get("/userProgress", authenticate, getUserProgress);
progressRoute.get("/dashboard", authenticate, getDashboardData);