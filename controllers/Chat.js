import { trycatchmethod } from "../middleware/error.js";
import { Chat } from "../Models/Chat.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { emitevent } from "../utils/features.js";
import {
  Alert,
  New_Attachments,
  New_Message_Alert,
  Refetch_Chats,
} from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { User } from "../Models/User.js";
import { Message } from "../Models/Message.js";

const creatgroupchat = trycatchmethod(async (req, res) => {
  const { name, members } = req.body;
  if (members.lenght < 1)
    return next(
      new ErrorHandler("Group chat must have at least 3 members", 400)
    );
  const allmemebers = [...members, req.user];

  await Chat.create({
    name,
    groupchat: true,
    creator: req.user,
    members: allmemebers,
  });
  emitevent(req, Alert, allmemebers, `Welcome to ${name} Group Chat`);
  emitevent(req, Refetch_Chats, members);

  return res.status(201).json({
    sucess: true,
    message: "Group Created",
  });
});

const getGroupchat = trycatchmethod(async (req, res, next) => {
  const chats = await Chat.find({ members: req.user }).populate(
    "members",
    "name avatar"
  );



  const transformChats = chats.map(({ _id, name, members, groupchat }) => {
    const otherMember = getOtherMember(members, req.user);
    return {
      _id,
      groupchat,
      avatar: groupchat
        ? members.slice(0, 3).map(member => member.avatar?.url)
        : [otherMember?.avatar?.url],
      Name: groupchat ? name : otherMember?.name,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  return res.status(200).json({
    success: true,
    Chats: transformChats,
  });
});

const getMyGroups = trycatchmethod(async (req, res) => {
  const chats = await Chat.find({
    members: req.user,
    groupchat: true,
    creator: req.user,
  }).populate("members", "Name avatar");

  const groups = chats.map(({ members, _id, groupchat,  name}) => ({
    _id,
    groupchat,
    name,
    avatar: members.slice(0, 3).map(({ avatar }) => avatar.url),
  }));

  return res.status(200).json({
    success: true,
    groups,
  });
});

const Addmembers = trycatchmethod(async (req, res, next) => {
  const { chatId, members } = req.body;
  const chat = await Chat.findById(chatId);

  if (!members || members.lenght < 1)
    return next(new ErrorHandler("please provide vaild members"));

  if (!chat) return next(new ErrorHandler("Chat Not Found", 404));

  if (!chat.groupchat)
    return next(new ErrorHandler("This Not A group Chat", 400));

  if (chat.creator.toString() !== req.user.toString())
    return next(new ErrorHandler("You are not allowed to add members"), 403);

  const allNewMembersPromise = members.map((i) => User.findById(i, "name"));

  const allNewMembers = await Promise.all(allNewMembersPromise);

  if (chat.members.lenght > 50)
    return next(new ErrorHandler("Group Memebers Limit Reaced"), 400);

  const uniquemember = allNewMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);

  chat.members.push(...uniquemember);

  await chat.save();

  const alluserName = allNewMembers.map((i) => i.name).join(",");

  emitevent(
    req,
    Alert,
    chat.members,
    `You haven been added to to ${chat.name} by ${req.user.name}`
  );

  emitevent(req, Refetch_Chats, alluserName );

  return res.status(200).json({
    sucess: true,
    meesage: "Members Added Sucessfully",
  });
});

const removeMembers = trycatchmethod(async (req, res, next) => {
  const { userId, chatId } = req.body;

  const [chat, userThatWillBeRemove] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId, "name"),
  ]);

  if (!chat) return next(new ErrorHandler("Chat not found", 404));

  if (!chat.groupchat)
    return next(new ErrorHandler("This is not a group chat", 400));
 

  if (chat.creator.toString() !== req.user.toString())
    return next(new ErrorHandler("You are Not Allowed to add members", 403));

  const allchatMembers=chat.members.map((i)=>i.toString());

  /*if (chat.members.length <= 3)
    return next(new ErrorHandler("Group must have at least 3 members", 400));*/

  chat.members = chat.members.filter(
    (member) => member.toString() !== userId.toString()
  );
  await chat.save();

  emitevent(
    req,
    Alert,
    chat.members,
    {message:`${userThatWillBeRemove.name} has been removed from the group`,chatId}
  );
  emitevent(req, Refetch_Chats,allchatMembers);

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
});

const leavegroup = trycatchmethod(async (req, res, next) => {
  const chatId = req.params.chatId;

  const chat = await Chat.findById(chatId);

  if (!chat) return next(new ErrorHandler("Chat Not Found"), 404);

  if (!chat.groupchat)
    return next(new ErrorHandler("this is not a group chat"), 404);

  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== req.user.toString()
  );
  if (chat.creator.toString() === req.user.toString()) {
    const randomNumber = Math.floor(Math.random() * remainingMembers.length);
    const newCreaator = remainingMembers[randomNumber];
    chat.creator = newCreaator;
  }
  chat.members = remainingMembers;
  const [user] = await Promise.all([User.findById(req.user), chat.save()]);
  emitevent(req, Alert, chat.members, {chatId,message:`User ${user.name} has left the Group`});
  return res.status(200).json({
    sucess: true,
    meesage: "Members Leaved Sucessfully",
  });
});

const sendAttachments = trycatchmethod(async (req, res, next) =>  {
  const { chatId } = req.body;

  const [chat, me] = await Promise.all([
    Chat.findById(chatId),
    User.findById(req.user, "name avatar"),
  ]);

  if (!chat) return next(new ErrorHandler("Chat Not Found"), 404);

  const files = req.files || [];

  if (files.length < 1)
    return next(new ErrorHandler("Please Provide Vaild Attachments", 400));

  // Upload files here
  const attachments = [
    {
      public_id: "1234",
      url: "C:\\Users\\shiva\\chat_app\\backend\\Profile_pic.png",
    },
  ];

  const messageForDB = {
    content: "",
    attachments,
    sender: me._id,
    chatId,
  };

  const messageForRealTime = {
    ...messageForDB,
    sender: {
      _id: me._id,
      name: me.name,
      avatar: me.avatar.url,
    },
  };

  const message = await Message.create(messageForDB);

  emitevent(req, New_Attachments, chat.members, {
    message: messageForRealTime,
    chatId,
  });

  emitevent(req, New_Message_Alert, chat.members, {
    chatId,
  });

  res.status(200).json({
    success: true,
    message,
  });
});

const getMessage = trycatchmethod(async (req, res,next) => {
  
  if(req.query.populate==="true")
  {
    const chat=await Chat.findById(req.params.chatId).populate("members","name avatar").lean();

    if(!chat)
    return next(new ErrorHandler("Chat Not Found",404));
    chat.member=chat.members.map(({_id,name,avatar})=>({
      _id,
      name,
      avatar:avatar
    }))

   

    return res.status(200).json({
      sucess:true,
      chat
    })
  }
  else{
    const chat=await Chat.findById(req.params.chatId);
    if(!chat)
    return next(new ErrorHandler("chat not found",404))
    return res.status(200).json({
      sucess:true,
      chat
    })
  }
});

const updateGroupName = trycatchmethod(async (req, res,next) => {
  const chatId=req.params.chatId;
  const {name}=req.body;

  const chat = await Chat.findById(chatId);
  if(!chat)
    return next(new ErrorHandler("Chat Not Found",404));
  if(!chat.groupchat)
  return next(new ErrorHandler("This is not a group caht"),400)

  if(chat.creator.toString()!==req.user.toString())
  return next (new ErrorHandler("Only  Admin can rename the group",403))

  chat.name=name;

  await chat.save()

  emitevent(req,Refetch_Chats,chat.member);
   return res.status(200).json({
    success:true,
    message:"group renamed sucessfully"
   })

});

const deleteMessage = trycatchmethod(async (req, res, next) => {

  const  chatId = req.params.chatId;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ErrorHandler("Chat not found", 404));
  }

  const members = chat.members;

  if (chat.groupchat && chat.creator.toString() !== req.user.toString()) {
    return next(new ErrorHandler("You are not allowed to delete the group", 403));
  }

  if (!chat.groupchat && !chat.members.includes(req.user.toString())) {
    return next(new ErrorHandler("You are not allowed to delete the chat", 403));
  }

  const messagesWithAttachments = await Message.find({ chat: chatId, attachments: { $exists: true, $ne: [] } });

  const publicIds = [];
  messagesWithAttachments.forEach(({ attachments }) => {
    attachments.forEach(({ public_id }) => publicIds.push(public_id));
  });

  const h=await Promise.all([
    chat.deleteOne(),
    Message.deleteMany({ chat: chatId }),
  ]);

  console.log(h)

  emitevent(req, Refetch_Chats, members);
  return res.status(200).json({
    success: true,
    message: "Chat deleted successfully"
  });
});
;

const getChatDetails=trycatchmethod(async(req,res)=>{
  const ChatId=req.params.id;
  const{page=1}=req.query;
  const limit=20
  const skip=(page-1)*limit;

  const [messages,totalMessagesCount]=await Promise.all([
  Message.find({chatId:ChatId})
  .sort({createdAt:-1})
  .skip(skip)
  .limit(limit)
  .populate("sender","name avatar")
  .lean(),
  Message.countDocuments({chatId:ChatId})
  ])

  const totalPages=Math.ceil(totalMessagesCount/limit)

  return res.status(200).json({
    success:true,
    messages:messages.reverse(),
    totalPages
  })
})



export {
  creatgroupchat,
  getGroupchat,
  getMyGroups,
  Addmembers,
  removeMembers,
  leavegroup,
  sendAttachments,
  getMessage,
  updateGroupName,
  deleteMessage,
  getChatDetails
};
