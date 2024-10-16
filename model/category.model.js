const mongoose=require("mongoose")

const categoryScehma= new mongoose.Schema({
    categoryName:String,
    categoryImage:String
},{
    timestamps:true,
    versionKey:false
})

module.exports= new mongoose.model("category",categoryScehma)