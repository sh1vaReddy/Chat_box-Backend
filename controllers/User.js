import { compare } from 'bcrypt';
import  { User} from '../Models/User.js';
import { sendToken,cookieOptions} from '../utils/SendToken.js';
import {trycatchmethod} from '../middleware/error.js';
import {ErrorHandler} from '../utils/ErrorHandler.js'
import {Chat} from '../Models/Chat.js'
import {Request} from '../Models/Request.js'
import { emitevent, uploadFlieonCloundinary } from "../utils/features.js";
import { New_Request, Refetch_Chats } from '../constants/events.js';
import { getOtherMember, otherMember } from '../lib/helper.js';


const Register = trycatchmethod(async (req, res, next) => {
  const { name,bio, username, password, } = req.body;
   
  //const file = req.file;
  //console.log(file)

  //if (!file) return next(new ErrorHandler("Please Upload Avatar"));

 // const result = await uploadFlieonCloundinary([file]);

  /*const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };*/

  const user = await User.create({
    name,
    bio,
    username,
    password,
    //avatar,
  });
 

  sendToken(res, user, 201, "User created");
});

const Login = trycatchmethod(
  async(req,res,next)=>
{
  
    const {username,password}=req.body;
     
    if(!username || !password)
    {
      res.send("All Fileds Mandatory")
    }

    const user=await User.findOne({username:username}).select("+password")

    if(!user) return next(new ErrorHandler("Invaild  Username Or Password",404))

    const isMatch=await compare(password,user.password)

    if(!isMatch)  return next(new ErrorHandler("Invaild  Credentials",404))
    

    sendToken(res,user,201,"User Created")
  }
)


const getmyprofile=trycatchmethod(async(req,res)=>
{
  const user= await User.findById(req.user)
  if(!user)
    return next(new ErrorHandler("User not found",404))
 return res.status(200).json({
  sucess:true,
  data:user
 })
})


const logout=trycatchmethod(async(req,res)=>{
  return res.status(200).cookie("chat_token","",{...cookieOptions,maxAge:0}).json({
    sucess:true,
    message:"Logout successfully"
  })
})

const SerachUser = trycatchmethod(async (req, res) => {
  const { name = "" } = req.query;
  const loggedInUserId = req.user;


  const myChats = await Chat.find({ groupChat: false, members: req.user });

 
  const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: [...allUsersFromMyChats,loggedInUserId] },
    name: { $regex: name, $options: "i" },
  });
  const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));



  return res.status(200).json({
    success: true,
    users,
  });
});


const SendRequest=trycatchmethod(async(req,res,next)=>{
  const {UserId}=req.body

  const request=await Request.findOne({
    $or:[
      {
        sender:req.user ,receiver:UserId
      },
      {
        sender:UserId,receiver:req.user
      }
    ]

  });

  if(request)
  {
    return next(new ErrorHandler("Request Alredy Send",400))
  }
  await  Request.create({
    sender:req.user,
    receiver:UserId,
  })


  emitevent(req,New_Request,[UserId],)

  return res.status(200).json({
    success:true,
    message:"Friend request Sent Sucesfully"
  })
})


const AcceptRequest=trycatchmethod(async(req,res,next)=>{
  const { requestId, accept } = req.body;


  const request=await Request.findById(requestId).populate("sender","name").populate("receiver","name")

   

  if (!request) return next(new ErrorHandler("Request not found", 404));

  if (request.receiver._id.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not authorized to accept this request", 401)
    );

  if (!accept) {
    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Friend Request Rejected",
    });
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);

  emitevent(req,Refetch_Chats, members);

  return res.status(200).json({
    success: true,
    message: "Friend Request Accepted",
    senderId: request.sender._id,
  });
})

const getAllNotification=trycatchmethod(async(req,res)=>{
  const request=await Request.find({receiver:req.user}).populate("sender","name avatar")
  const allrequset=request.map(({_id,sender})=>({
    _id,
    sender:{
      _id:sender._id,
      name:sender.name,
      avatar:sender.avatar.url
    }

  }));
  return res.status(200).json({
    sucess:true,
      request:allrequset
  })
})

const getmyfriendlist= trycatchmethod(async (req, res) => {
  const chatId = req.query.chatId;

  const chats = await Chat.find({
    members: req.user,
    groupchat: false,
  }).populate("members", "name avatar");


  const friends = chats.map(({ members }) => {
    const otherUser = otherMember(members,req.user);
    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar.url,
    };
   
  });

 

  if (chatId) {
    const chat = await Chat.findById(chatId);

    const availableFriends = friends.filter(
      (friend) => !chat.members.includes(friend._id)
    );

    return res.status(200).json({
      success: true,
      friends: availableFriends,
    });
  } else {
    return res.status(200).json({
      success: true,
      friends,
    });
  }
});
export {Register,Login,getmyprofile,logout,SerachUser,SendRequest,AcceptRequest,getAllNotification,getmyfriendlist};