import jwt from "jsonwebtoken";

export const authenticate = async (req,res,next) =>{

    try{

    const authHeaders = req.headers.authorization;

    if(!authHeaders || !authHeaders.startsWith("Bearer "))
    {
        return res.status(401).json({message: "Denied authentication - Token missing"});
    }


    const token = authHeaders.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user= decoded;

      next();

}


catch(error)
{
   return res.status(500).json({message: "Invalid or expired token", error});
} 

}