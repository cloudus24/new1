const { Review } = require("../model/index.model")

exports.addReview = async (req, res) => {
    try {
        const { userId, productId, rating } = req.body
        if (!userId || !productId || !rating) {
            return res.status(400).json({
                status: false,
                message: "Invalid fields !!"
            })
        }

        const review = new Review()

        review.userId = userId
        review.productId = productId
        review.rating = rating

        await review.save()

        return res.status(201).json({
            status: true,
            message: "Review added successfully",
            review
        })

    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        })
    }
}


exports.getReview = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0
        const limit = parseInt(req.query.limit) || 10
        const skip = page * limit
        const search = req.query.search || ``

        const fieldsToSearch = [`userId`, `productId`, `rating`]

        const matchQuery = {
            $or: fieldsToSearch.map(field => ({
                [field]: { $regex: search, $options: `i` }
            }))
        };

        const commonPipeline = [
            {
                $match: matchQuery
            },
        ]

        const paginationPipeline = [
            ...commonPipeline,
            { $skip: skip },
            { $limit: limit },
            { $sort: { createdAt: -1 } }
        ];

        const countPipeline = [
            ...commonPipeline,
            { $count: `totalCount` }
        ];

        const userCount = await Review.aggregate(countPipeline);
        const totalReviews = userCount.length > 0 ? userCount[0].totalCount : 0;

        const reviews = await Review.aggregate(paginationPipeline);

        return res.status(200).json({
            status: true,   
            message: "Reviews fetched successfully",
            reviews,
            totalReviews
        })
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        })
    }
}

exports.updateReview=async(req,res)=>{
    try {

        const {reviewId}=req.query

        if(!reviewId){
            return res.status(400).json({
                status: false,
                message: "Invalid fields !!"
            })
        }

        const review = await Review.findById(reviewId)

        if(!review){
            return res.status(404).json({
                status: false,
                message: "Review not found"
            })
        }
        review.status = !review.status
        await review.save()
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({

        })
    }
}

exports.deleteReview=async(req,res)=>{
    try {

        const {reviewId}=req.query

        if(!reviewId){
            return res.status(400).json({
                status: false,
                message: "Invalid fields !!"
            })
        }

        const review = await Review.findById(reviewId)

        await review.deleteOne()
        
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status:false,
            message:"Internal server error"
        })
    }
}

exports.getNewReviews=async(req,res)=>{
    try {
        
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            
        })
    }
}