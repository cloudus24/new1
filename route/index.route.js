const express=require("express")
const route=express.Router()
const authenticateToken=require("../middlewere/adminAuth")

const adminRoute=require("./admin.route")
route.use("/admin",adminRoute)


const userRoute=require("./user.route")
route.use("/user",userRoute)

const chatRoute=require("./chatRoutes")
route.use("/chat",chatRoute)

module.exports=route