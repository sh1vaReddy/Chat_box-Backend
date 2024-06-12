import { userSocketIDs } from "../Server.js"

const getOtherMember=(memebers,userId)=>
{
   
   return  memebers.find((member)=>member._id.toString() !==
    userId.toString())
   
} 


const otherMember=(memebers,userId)=>{
    return  memebers.find((member)=>member._id.toString() !==
    userId.toString())
}

const getBase64=(file)=>
{

    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`

}


const getSocket=(users=[])=>{
    const sockets=users.map((user)=>userSocketIDs.get(user.toString()));

    return sockets;
}

export {getOtherMember,getBase64,getSocket,otherMember};