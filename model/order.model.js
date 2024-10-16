const mongoose=require("mongoose")

const addressSchema= new mongoose.Schema({
    address:String,
    city:String,
    state:String,
    pincode:String
  },
  {
      timestamps:true,
      versionKey:false
  })

  const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,    
    totalPrice: Number,
    address: [addressSchema],
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    orderStatus: {
        type: String,
        enum: ["pending", "completed", "cancelled"],
        default: "pending"
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports= new mongoose.model("order",orderSchema)