const errormidddleware=(err,req,res,next)=>{

    err.message ||= "Internal Server Error";
    err.statusCode ||= 500;

    return res.status(err.statusCode).json({
        sucess:false,
        message:err.message
    })
}

const trycatchmethod=(passedfun)=>async(req,res,next)=>{
    try{
        await passedfun(req,res,next)

    }
    catch(error)
    {
        next(error)
    }

}

export {errormidddleware,trycatchmethod};