const mongoose=require("mongoose")

const cartSchema= new mongoose.Schema({
    userId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity:Number,    
    totalPrice:Number,
    
},{
    timestamps:true,
    versionKey:false
})

module.exports=mongoose.model("cart",cartSchema)