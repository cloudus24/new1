const express=require("express")
const route=express.Router()
const orderController=require("../controller/orderController")

route.post("/add",orderController.addOrder)
route.get("/show",orderController.getOrders)
route.get("/pendingStatus",orderController.pendingOrder)


module.exports=route