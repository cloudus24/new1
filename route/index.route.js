const express=require("express")
const route=express.Router()


const productRoute=require("./product.route")
route.use("/product",productRoute)

const adminRoute=require("./admin.route")
route.use("/admin",adminRoute)


const userRoute=require("./user.route")
route.use("/user",userRoute)


const categoryRoute=require("./category.route")
route.use("/category",categoryRoute)


const cartRoute=require("./cart.route")
route.use("/cart",cartRoute)


const orderRoute=require("./order.route")
route.use("/order",orderRoute)


const paymentRoute=require("./payment.route")
route.use("/payment",paymentRoute)


const reviewRoute=require("./review.route")
route.use("/review",reviewRoute)

const chatRoute=require("./chatRoutes")
route.use("/chat",chatRoute)

module.exports=route