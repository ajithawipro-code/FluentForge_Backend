import { supabase } from "../configs/supabase.js"

export const dbCheck=async ()=>{

    try{

         const {error} = await supabase.from("users").select().limit(1);

         if(error)
         {
            console.log("DB Connection Failed", error);
            process.exit(1);
         }

         console.log("DB Connected Successfully");

    }

    catch(error){

        console.log("Error in catch block",error);
        process.exit(1);

    }
   
}