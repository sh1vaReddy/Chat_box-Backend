import { model,Schema, Types } from "mongoose";

const  ChatScehma=new Schema({
    name:{
        type:String,
        required:true
    },
    groupchat:{
        type:Boolean,
        default:false
    },
    creator:{
        type:Types.ObjectId,
        ref:"User"
    },
    members:[{
        type:Types.ObjectId,
        ref:"User"
    }]
},
{
    timestamps:true
});

export const Chat=model.Chat || model("Chat",ChatScehma)