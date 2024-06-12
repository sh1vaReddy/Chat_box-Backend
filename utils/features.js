import {v4 as uuid} from 'uuid';
import {v2 as cloudinary}  from 'cloudinary';
import { getBase64 } from '../lib/helper.js';

const emitevent = (req,event,users,data)=>{
    console.log("Emitting event",event)

}



const uploadFlieonCloundinary= async (files=[])=>{

    const uploadpromise=files.map((file)=>{
        return new Promise((resolve,reject)=>{
            cloudinary.uploader.upload(
                getBase64(file),{
                resource_type:"auto",
                public_id:uuid(),
            },(error,result)=>{
                if(error) return reject(error);
                resolve(result)
            })
        })

    })

    try{
        const result=await Promise.all(uploadpromise);

        const formattedResults=result.map((result)=>({
            public_id:result.public_id,
            url:result.url,
    }))
     return formattedResults;
    }
    catch(error)
    {
       throw new Error("Error uploading files to cloudinary",error)
    }

}

export {emitevent,uploadFlieonCloundinary}