import {trycatchmethod} from './error.js' 
import {ErrorHandler} from '../utils/ErrorHandler.js'
import jwt from 'jsonwebtoken';
import { User } from '../Models/User.js';

const isAuthenticated=trycatchmethod(async(req,res,next)=>{
    const token=req.cookies["chat_token"]
    if(!token)  
    return next(new ErrorHandler("please login to   aceess this route",401))

    const decode=jwt.verify(token,process.env.JWT_SECRET)
    req.user=decode._id
    next()
})



const socketAuthenticator = async (err, socket, next) => {

  try {
    if (err) return next(err);

    const authToken = socket.request.cookies["chat_token"];
    

    if (!authToken)
      return next(new ErrorHandler("Please login to access this route", 401));

    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

    const user = await User.findById(decodedData._id);


    if (!user)
      return next(new ErrorHandler("Please login to access this route", 401));

    socket.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Please login to access this route", 401));
  }
};

export {isAuthenticated,socketAuthenticator}