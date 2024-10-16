const mongoose = require("mongoose")
const locationSchema = new mongoose.Schema({
    name:String,
    latitude:String,
    longitude:String,
    image:String
})

module.exports= new mongoose.model("loction",locationSchema)