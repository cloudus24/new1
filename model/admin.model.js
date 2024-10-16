const mongoose=require("mongoose")

const adminSchema= new mongoose.Schema({
    name:String,
    password:String,
    email:String,
    image:String
},
{
    timestamps:true,
    versionKey:false
})

module.exports= new mongoose.model("admin",adminSchema)