import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { getAnalytics } from "../controllers/analytics.controller.js";

export const analyticsRoute = express.Router();

analyticsRoute.get("/", authenticate, getAnalytics);
