import bcrypt from "bcrypt";
import { supabase } from "../configs/supabase.js";
import jwt from "jsonwebtoken";
export const signup = async (req, res) => {
  try {
    const { name, email, password} = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });

    }
    if (password.length < 6) {
  return res.status(400).json({ message: "Password must be at least 6 characters" })
}
    const {data: existing} = await supabase.from("users")
                                                 .select()
                                                 .eq("email", email)
                                                 .maybeSingle();

    if(existing)
    {
        return res.status(409).json({message: "Invalid credentials"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const default_language_id = 'cf3e8ef4-aa84-476f-9d46-1080ce7f5d56'

    const {data,error} = await supabase.from("users")
                                       .insert([{name, email, password:hashedPassword,
                                                 language_id : default_language_id
                                       }])
                                       .select()
                                       .maybeSingle();
    if(error)
    {
        return res.status(500).json({error: error.message});
    }

    res.status(201).json({
        status: true,
        message:"User signup successful",
        data: {
            name: data.name, 
             email:  data.email,
             }
              })

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {

    const { email, password} = req.body;

    if(!email || !password)
    {
        return res.status(400).json({message: "Valid input fields required"})
    }


    const {data: existing,error} = await supabase.from("users")
                                                 .select()
                                                 .eq("email", email)
                                                 .maybeSingle();
    if(error || !existing)
    {
        return res.status(401).json({message: "Invalid credentials"});
    }

    const isMatch = await bcrypt.compare(password, existing.password);

    if(!isMatch)
    {
         return res.status(401).json({message: "Invalid credentials"});
    }

    const token = jwt.sign(
        {id: existing.id , email:existing.email},
        process.env.JWT_SECRET,
        {expiresIn: "1d"}
    )

    return res.status(200).json({message: "Log in successful", 
                                 token: token,
                                user: {
                                  id: existing.id,
                                  name: existing.name,
                                  email:existing.email}
                              });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message});
  }
};
