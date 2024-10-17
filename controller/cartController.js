const { Product, Cart } = require('../model/index.model');
const mongoose = require('mongoose');

exports.addCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || isNaN(quantity)) {
            return res.status(400).json({
                status: false,
                message: "Invalid fields"
            });
        }

        const parsedQuantity = parseInt(quantity, 10);

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        const productPrice = parseFloat(product.productPrice);
        if (isNaN(productPrice)) {
            return res.status(500).json({
                status: false,
                message: "Product price is invalid"
            });
        }

        let cart = await Cart.findOne({ productId: productId, userId: userId });

        if (cart) {
            const updatedQuantity = cart.quantity + parsedQuantity;
            cart.quantity = updatedQuantity;
            cart.totalPrice = updatedQuantity * productPrice;

            await cart.save();
            return res.status(200).json({
                status: true,
                message: "Cart updated successfully",
                cart
            });
        } else {
            cart = new Cart({
                userId: userId,
                productId: productId,
                quantity: parsedQuantity || 1,
                totalPrice: (parsedQuantity || 1) * productPrice
            });

            await cart.save();
            return res.status(201).json({
                status: true,
                message: "Cart created successfully",
                cart
            });
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

exports.getUserCart = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                status: false,
                message: "Invalid fields",
            });
        }
        const cartData = await Cart.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            {
                $unwind: {
                    path: "$productDetails",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    productId: 1,
                    quantity: 1,
                    totalPrice: {
                        $multiply: [
                            "$quantity",
                            { $toDouble: "$productDetails.productPrice" },
                        ],
                    },
                    productName: "$productDetails.productName",
                    productPrice: { $toDouble: "$productDetails.productPrice" },
                    productImage: "$productDetails.productImage",
                },
            },
            {
                $group: {
                    _id: "$userId",
                    items: { $push: "$$ROOT" },
                    totalQuantity: { $sum: 1 },
                    totalPrice: { $sum: "$totalPrice" },
                },
            },
        ]);

        if (!cartData || cartData.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Cart not found",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cart retrieved successfully",
            cart: cartData[0],
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

exports.cartUpdate = async (req, res) => {
    try {
        const { action, productId, userId } = req.query;
        console.log("req.query :>> ", req.query);

        if (!action || !productId || !userId) {
            return res.status(400).json({
                status: false,
                message: "Invalid fields",
            });
        }

        const cart = await Cart.findOne({ productId: productId, userId: userId });
        console.log("cart :>> ", cart);

        if (!cart) {
            return res.status(404).json({
                status: false,
                message: "Cart not found",
            });
        }

        if (action === "true") {
            cart.quantity = cart.quantity + 1;
        } else if (action === "false") {
            cart.quantity = Math.max(cart.quantity - 1, 0);
        }

        await cart.save();

        console.log("cart :>> ", cart);
        return res.status(200).json({
            status: true,
            message: "Cart updated successfully",
            cart,
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

exports.cartDelete = async (req, res) => {
    try {
        const { productId, userId } = req.query;

        console.log("req.query :>> ", req.query);

        if (!productId || !userId) {
            return res.status(400).json({
                status: false,
                message: "Invalid fields",
            });
        }

        const result = await Cart.deleteOne({ productId, userId });

        console.log("delete cart result :>> ", result);

        if (result.deletedCount === 0) {
            return res.status(404).json({
                status: false,
                message: "Cart item not found or already deleted",
            });
        }

        return res.status(200).json({
            status: true,
            message: "Cart deleted successfully",
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
