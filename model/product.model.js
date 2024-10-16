const mongoose=require("mongoose")

const productSchema=new mongoose.Schema({
    productNo:String,
    productName:String,
    productPrice:String,
    productImage:String,
    categoryId:{ type: mongoose.Schema.Types.ObjectId, ref: 'category' },
    isTrending:{
        type:Boolean,
        default:false
    }
},{
    timestamps:true,
    versionKey:false
})

module.exports=mongoose.model("product",productSchema)