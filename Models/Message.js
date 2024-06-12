import { model,Schema, Types } from "mongoose";


const MessageScehma=new Schema({
    content:{
        type:String, 
    },
    attachements:[
        {
            public_id:{
                type:String,
                required:true
            },
            url:{
                type:String,
                required:true
            }
        }
    ],
    sender:{
        type:Types.ObjectId,
        ref:"User",
        required:true,
    },
    chatId:{
        type:Types.ObjectId,
        ref:"Chat",
        required:true,
    },   
},
{
    timestamps:true
}
)

export const Message=model.Message ||   model("Message",MessageScehma)