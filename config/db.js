import  mongoose from 'mongoose'


const connectdb=()=>{
    try{
        mongoose.connect(process.env.DB_Url)
        console.log("Database is connected sucesully")
    }
   catch(error)
   {
    console.log("Error:",error.message)
   }
}



export default connectdb;