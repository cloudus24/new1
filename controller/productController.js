const { getEnabledCategories } = require("trace_events");
const { Product, Category, User } = require("../model/index.model")
const { rendomId } = require("../utils/function")
const mongoose = require('mongoose');

exports.addProduct = async (req, res) => {
    try {
        const { productNo, productName, productPrice, categoryId } = req.body;


        if (!productName || !productPrice || !categoryId) {
            return res.status(401).json({
                status: false,
                message: 'Invalid fields'
            });
        }
    
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).json({
                status: false,
                message: 'Category not found'
            });
        }

        const product = new Product();

        product.productNo = productNo || rendomId(6);
        product.productName = productName;
        product.productPrice = productPrice;
        product.categoryId = categoryId;
        product.productImage = req.file.path;

        await product.save();

        res.status(201).json({
            status: true,
            message: 'Product created successfully',
            product: {
                ...product.toObject(),
                categoryName: category.categoryName
            },
        });

    } catch (error) {
        console.log('error', error);
        return res.status(500).json({
            status: false,
            message: 'Internal server error !!'
        });
    }
};

exports.productGet = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 32;
        const skip = page * limit;
        const search = req.query.search || '';

        const fieldsToSearch = [
            'productNo',
            'productName',
            'productPrice',
            "categoryName",
            'createdAt',
            "updatedAt",
            "deletedAt"

        ];

        const matchQuery = {
            $or: fieldsToSearch.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            })),
        };

        const commonPipeline = [
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
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
                    productNo: 1,
                    productName: 1,
                    productImage: 1,
                    productPrice: 1,
                    categoryId: 1,
                    isTrending: 1,
                    category: "$category.categoryName",
                    createdAt: 1
                }
            }
        ];

        const paginationPipeline = [
            ...commonPipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const countPipeline = [...commonPipeline, { $count: 'totalCount' }];

        const totalCountResult = await Product.aggregate(countPipeline);
        const total = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0 ;

        const product = await Product.aggregate(paginationPipeline);
        res.status(200).json({
            status: true,
            message: "Product retrieved successfully",
            product,
            productTotal: total
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.query
        const { productName, productPrice, categoryId } = req.body

        const product = await Product.findById(productId)

        if (!product) {
            res.status(401).json({
                status: false,
                message: "invalid product Id"
            })
        }

        product.productName = productName || product.productName
        product.productPrice = productPrice || product.productPrice
        product.categoryId = categoryId || product.categoryId
        product.productImage = req?.file?.path || product.productImage

        await product.save()

        return res.status(200).json({
            status: true,
            message: "product updated successfully",
            product
        })

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

exports.productDelete = async (req, res) => {
    try {

        const { productId } = req.query

        const product = await Product.findById(productId)

        if (!product) {
            res.status(401).json({
                status: false,
                message: "invalid product Id"
            })
        }

        await product.deleteOne()

        return res.status(200).json({
            status: true,
            message: "product deleted"
        })

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

exports.singleProduct = async (req, res) => {
    try {
        const { productId } = req.query

        const product = await Product.findById(productId)

        if (!product) {
            res.status(401).json({
                status: false,
                message: "invalid product Id"
            })
        }

        return res.status(200).json({
            status: true,
            message: "product retrieved successfully",
            product
        })
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

exports.getProductByCategory = async (req, res) => {
    try {
        const { categoryId } = req.query;
        
        if (!categoryId) {
            return res.status(401).json({
                status: false,
                message: "Invalid fields"
            });
        }

        const products = await Product.aggregate([
            {
                $match: { categoryId: new mongoose.Types.ObjectId(categoryId) }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: {
                    path: "$categoryDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    productNo: 1,
                    productName: 1,
                    productPrice: 1,
                    productImage: 1,
                    categoryId: 1,
                    categoryName: "$categoryDetails.categoryName"
                }
            }
        ]);
 
        if (!products || products.length === 0) {
            return res.status(401).json({
                status: false,
                message: "No products found for this category",
                products
            });
        }

        return res.status(200).json({
            status: true,
            message: "Products retrieved successfully",
            products
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
}

exports.pendingOrder = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 32;
        const skip = page * limit;
        const search = req.query.search || '';

        const fieldsToSearch = ['productNo', 'productName', 'productPrice', 'categoryName'];

        const matchQuery = {
            $or: fieldsToSearch.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            })),
            orderStatus: 'pending'
        };

        const commonPipeline = [
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
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
                    productNo: 1,
                    productName: 1,
                    productImage: 1,
                    productPrice: 1,
                    categoryId: 1,
                    category: "$category.categoryName"
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


        const totalCountResult = await Product.aggregate(countPipeline);
        const total = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

        if (total === 0) {
            res.status(200).json({
                status: true,
                message: "No pending orders found",
                products: null,
                productTotal: 0
            });
        } else {
            const products = await Product.aggregate(paginationPipeline);

            res.status(200).json({
                status: true,
                message: "Pending orders retrieved successfully",
                products,
                productTotal: total
            });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

exports.globalSearch = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const skip = page * limit;

        const search = req.query.search || '';

        const userFields = ['userName', 'email', 'createdAt'];
        const productFields = ['name', 'description', 'price', 'createdAt'];
        const userMatchQuery = {
            $or: userFields.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }))
        };


        const productMatchQuery = {
            $or: productFields.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }))
        };
        const buildPipeline = (matchQuery) => [
            { $match: matchQuery },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const buildCountPipeline = (matchQuery) => [
            { $match: matchQuery },
            { $count: 'totalCount' }
        ];

        const userPipeline = buildPipeline(userMatchQuery);
        const productPipeline = buildPipeline(productMatchQuery);

        const userCountPipeline = buildCountPipeline(userMatchQuery);
        const productCountPipeline = buildCountPipeline(productMatchQuery);
        const [users, products, totalUserCount, totalProductCount] = await Promise.all([
            User.aggregate(userPipeline),
            Product.aggregate(productPipeline),
            User.aggregate(userCountPipeline),
            Product.aggregate(productCountPipeline)
        ]);

        const userTotal = totalUserCount.length > 0 ? totalUserCount[0].totalCount : 0;
        const productTotal = totalProductCount.length > 0 ? totalProductCount[0].totalCount : 0;
        res.status(200).json({
            status: true,
            message: 'Global search results retrieved successfully',
            data: {
                users,
                products
            },
            totals: {
                users: userTotal,
                products: productTotal
            }
        });
    } catch (error) {
        console.error('Error fetching global search results:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

exports.isTrending = async (req, res) => {
    try {
        const { isTrending, productId } = req.query;

        if (!productId) {
            return res.status(400).json({
                status: false,
                message: "Product ID is required"
            });
        }

        const isTrendingBoolean = isTrending === 'true';

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: false,
                message: "Product not found"
            });
        }

        product.isTrending = isTrendingBoolean;

        await product.save();

        return res.status(200).json({
            status: true,
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        console.error('Error updating product', error);
        return res.status(500).json({
            status: false,                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          //@ts-ignore
            message: "Internal server error"
        });
    }
};

exports.productGetInWeb = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 32;
        const skip = page * limit;
        const search = req.query.search || '';

        const fieldsToSearch = [
            'productNo',
            'productName',
            'productPrice',
            'categoryName',
            'createdAt',
            'updatedAt',
            'deletedAt'
        ];

        const matchQuery = {
            $and: [
                { isTrending: true },
                {
                    $or: fieldsToSearch.map(field => ({
                        [field]: { $regex: search, $options: 'i' }
                    }))
                }
            ]
        };

        const commonPipeline = [
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
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
                    productNo: 1,
                    productName: 1,
                    productImage: 1,
                    productPrice: 1,
                    categoryId: 1,
                    isTrending: 1,
                    category: "$category.categoryName",
                    createdAt: 1
                }
            }
        ];

        const paginationPipeline = [
            ...commonPipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const countPipeline = [...commonPipeline, { $count: 'totalCount' }];

        const totalCountResult = await Product.aggregate(countPipeline);
        const total = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

        const products = await Product.aggregate(paginationPipeline);
        res.status(200).json({
            status: true,
            message: "Product retrieved successfully",
            products,
            productTotal: total
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

exports.newData=async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 32;
        const skip = page * limit;
        const search = req.query.search || '';
        const fieldsToSearch = [
            'productNo',
            'productName',
            'productPrice',
            'categoryName',
            'createdAt',
            'updatedAt',
            'deletedAt' 
        ];
        const matchQuery = {
            $or: fieldsToSearch.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }))
        };
        const commonPipeline = [
            {
                $match: matchQuery
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryId",
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
                    productNo: 1,
                    productName: 1,
                    productImage: 1,
                    productPrice: 1,
                    categoryId: 1,
                    isTrending: 1,
                    category: "$category.categoryName",
                    createdAt: 1
                }
            }
        ];
        const paginationPipeline = [
            ...commonPipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ];

        const countPipeline = [...commonPipeline, { $count: 'totalCount' }];
        const totalCountResult = await Product.aggregate(countPipeline);

        const total = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;
        const products = await Product.aggregate(paginationPipeline);

        res.status(200).json({
            status: true,
            message: "Product retrieved successfully",
            products,
            productTotal: total
        });
        
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: `internal server error !!!`,
        })
    }
}


exports.getNewdData=async (req,res)=>{
    try {
        const product = await Product.find()
        res.status(200).json({status:true,product})
        
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: `internal server error !!!`,
        })
    }
}


// new  

exports.addAddProduct= async(req,res)=>{
    try {
        const {productName ,categoryId,productPrice ,productNo} =req.body
       
        if (!productName||!categoryId ||!productPrice||!productNo) {
            return res.status(401).json({
                status :false,
                message:"some fields are missing ! missing fields required"
            })
        }

        const product = await Product()
        
        product.productName= productName
        product. categoryId = categoryId
        product.productprice = productPrice
        product.productno = productNo

        await product.save()

        return res.status(200).json({status:true,message:"product added successfully",product})

        
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({status:false,message:"Internal server error"})
    }
}


exports.getProdtr= async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 0
        const limit = parseInt(req.query.limit) || 10
        const skip = page * limit
        const search = req.query.search || ''
        const fieldsToSearch = ['productNo','productName','productPrice','categoryName','createdAt','updatedAt','deletedAt']
   
        const matchQuery = {
            $or : fieldsToSearch.map(field => ({
                [field]:{$regex:search ,$options:'i'}
            }))
        }

        const commonPipeline = [
            {
                $match : matchQuery
            },
            {
                $lookup : {
                    from:'categories',
                    localField:'categoryId',
                    foreignField:'_id',
                    as:'category'
                }
            },
            {
                $unwind : {
                    path:'$category',
                    preserveNullAndEmptyArrays:true
                }
            },
            {
                $project:{
                    _id:1,
                    productNo:1,
                    productName:1,
                    productImage:1,
                    productPrice:1,
                    categoryId:1,
                    isTrending:1,
                    category:'$category.categoryName',
                    createdAt:1
                }
            }
        ]

        const countPipeline = [
            ...commonPipeline,
            {$count:'totalUser'}
        ]

        const paginationPipeline = [
            ...commonPipeline,
            {$limit:limit},
            {$skip:skip},
            {$sort:{createdAt:-1}}
        ]

        const totalCountResult = await Product.aggregate(countPipeline)
        const total = totalCountResult.length > 0 ? totalCountResult[0].totalUser : 0
        const products = await Product.aggregate(paginationPipeline)
        res.status(200).json({status:true,products,total})

    } catch (error) {
        console.log('error', error)
        return res.status(500).json({
            status:false,
            message:"Internal Server Error !!"
        })
    }
}