import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { dbCheck } from "./src/utils/dbHealthcheck.js";
import { authRoute } from "./src/routes/auth.route.js";
import { learningRoute } from "./src/routes/learning.route.js";
import { progressRoute } from "./src/routes/progress.route.js";
import { flashRoute } from "./src/routes/flashcard.route.js";
import { analyticsRoute } from "./src/routes/analytics.route.js";


dotenv.config();
const app=express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://timely-cat-2e2a41.netlify.app"
  ],
  credentials: true
}))

app.use(express.json())

app.use("/auth",authRoute);
app.use("/learning", learningRoute);
app.use("/progress", progressRoute);
app.use("/flashcard", flashRoute);
app.use("/analytics", analyticsRoute)

const PORT = process.env.PORT || 5000;

app.listen(PORT, async ()=>{

     try {

    await dbCheck();
    console.log(`Server running on PORT ${PORT}`);
        
     } catch (error) {

        console.log("Error inside catch block of server is", error);
        
     }
   

})