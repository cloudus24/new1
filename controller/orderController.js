const { Order, Cart } = require("../model/index.model")
const mongoose = require('mongoose');

exports.addOrder = async (req, res) => {
    try {
        const { paymentMethod, paymentId, address, cart } = req.body;

        if (!paymentMethod || !cart || !cart.items) {
            return res.status(400).json({
                status: false,
                message: "Invalid data"
            });
        }

        if (!cart.items || cart.items.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No items in cart"
            });
        }

        const orders = await Promise.all(
            cart.items.map(async (item) => {
                const order = new Order({
                    userId: item.userId,
                    productId: item.productId,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    paymentMethod: paymentMethod,
                    paymentId: paymentId,
                    address: address,
                });

                await order.save();

                await Cart.findByIdAndDelete(item._id);

                return order;
            })
        );
        return res.status(201).json({
            status: true,
            message: "Orders created and cart deleted successfully",
            orders
        });
    } catch (error) {
        console.error('Error creating orders:', error.message);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

exports.getOrders = async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({
                status: false,
                message: "Invalid fields"
            });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);

        const pipeline = [
            {
                $match: {
                    userId: userObjectId
                }
            },
            {
                $lookup:
                {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "result"
                }
            },
            {
                $unwind: {
                    path: '$result',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    productId: 1,
                    quantity: 1,
                    totalPrice: 1,
                    address: 1,
                    paymentMethod: 1,
                    orderStatus: 1,
                    productName: "$result.productName",
                    productImage: "$result.productImage"
                }
            }
        ];

        const orders = await Order.aggregate(pipeline);

        if (!orders || orders.length === 0) {
            return res.status(404).json({ status: false, message: "Orders not found" });
        }

        return res.status(200).json({ status: true, message: "Orders retrieved successfully", orders });
    } catch (error) {
        console.error('Error in getOrders function:', error.message);
        return res.status(500).json({ status: false, message: error.message });
    }
}

exports.pendingOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 32;
        const skip = page * limit;

        const search = req.query.search || '';

        const fieldsToSearch = ['orderNo', 'productName', 'productPrice', 'categoryName'];

        const matchQuery = {
            $or: fieldsToSearch.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            })),
            orderStatus: "pending"
        };

        const commonPipeline = [
            { $match: matchQuery },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: {
                    path: "$product",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "product.categoryId",
                    foreignField: "_id",
                    as: "category"
                }
            },
            {
                $unwind: {
                    path: "$category",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    orderNo: 1,
                    productId: 1,
                    productName: "$product.productName",
                    productImage: "$product.productImage",
                    productPrice: "$product.productPrice",
                    categoryName: "$category.categoryName",
                    quantity: 1,
                    totalPrice: 1,
                    paymentMethod: 1,
                    address: 1,
                    orderStatus: 1
                }
            }
        ];

        const paginationPipeline = [
            ...commonPipeline,
            { $skip: skip },
            { $limit: limit },
            { $sort: { createdAt: -1 } }
        ];

        const countPipeline = [
            ...commonPipeline,
            { $count: 'totalCount' }
        ];

        const totalCountResult = await Order.aggregate(countPipeline);
        const total = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

        if (total === 0) {
            res.status(200).json({
                status: true,
                message: "No pending orders found",
                orders: null,
                orderTotal: 0
            });
        } else {
            const orders = await Order.aggregate(paginationPipeline);

            console.log('Orders Retrieved:', orders);

            res.status(200).json({
                status: true,
                message: "Pending orders get successfully",
                orders,
                orderTotal: total
            });
        }
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        console.error('Stack Trace:', error.stack);

        res.status(500).json({ status: false, message: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {

        const {orderId,orderStatus}=req.body
        if (!orderId||!orderStatus) {
            return res.status(400).json({
                status:false,
                message: "Invalid data"
            })
        }

    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json
            ({
                status: false,
                message: error.message
            })
    }
}