const express=require("express")
const upload=require("../utils/multer")
const route=express.Router()
const adminController=require("../controller/admincontroller")
const {checkAccess}=require("../utils/checkAccessKey")
const {authenticateToken}=require("../middlewere/adminAuth")

route.post("/add",adminController.register)
route.post("/login",checkAccess,adminController.login)
route.put("/updateImage",upload.single('image'),adminController.updateImage)
route.patch("/updatePassword",adminController.updateAdminPassword)
route.patch("/updateProfile",upload.single('image'),adminController.updateAdmin)


module.exports=route