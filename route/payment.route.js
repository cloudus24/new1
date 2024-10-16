const express=require("express")
const route=express.Router()
const paymentController=require("../controller/paymentController")

route.post("/add",paymentController.createStripePayment)
route.post("/create",paymentController.createPayPalPayment)
// route.get("/show",paymentController.getPayments)
route.post("/verifyPayment",paymentController.verifyPayPalPayment)
route.get("/key",paymentController.getKey)


module.exports=route