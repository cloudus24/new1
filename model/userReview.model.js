const mongoose = require("mongoose")

const reviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    rating: {
        type: Number,
        default: 0
    }
},
    {
        timestamps: true,
        versionKey: false
    }
)

module.exports=mongoose.model("review",reviewSchema)