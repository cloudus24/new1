const { Category } = require("../model/index.model")

exports.addCategory = async (req, res) => {
    try {
        const { categoryName } = req.body

        if (!categoryName) {
            return res.status(401).json({
                status: false,
                message: "invalid fields"
            })
        }

        const category = new Category()

        category.categoryName = categoryName
        category.categoryImage = req.file.path

        await category.save()

        return res.status(201).json({
            status: true,
            message: "category created successfully",
            category
        })
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({ status: false, message: "internal server error" })
    }
}

exports.getCategory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 10;
        const skip = page * limit;
        const search= req.query.search || '';
        const fieldsToSearch = ['categoryName','createdAt'];

        const matchQuery = {
            $or: fieldsToSearch.map(field => ({
                [field]: { $regex: search, $options: 'i' }
            }))
        };

        const commonPipeline = [
            {
                $match: matchQuery
            },
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

        const totalCountResult = await Category.aggregate(countPipeline);
        const totalcategory = totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

        const category = await Category.aggregate(paginationPipeline);

        if (!category) {
            return res.status(401).json({
                status: false,
                message: "invalid category Id"
            })
        }

        res.status(200).json({
            status: true,
            message: "Categories retrieved successfully",
            category,
            totalcategory
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ status: false, message: error.message });
    }
};


exports.getSingleCategory=async(req,res)=>{
    try {
        
    } catch (error) {
        console.log('error :>> ', error);
        return res.status (500).json({ status: false, message: "internal server error" })
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const { categoryName } = req.body
        const {id} = req.query
        if (!id) {
            return res.status(401).json({
                status: false,
                message: "invalid fields"
            })
        }

        const category = await Category.findById(id)

        if (!category) {
            res.status(401).json({
                status: false,
                message: "invalid category Id"
            })
        }

        category.categoryName = categoryName || category.categoryName
        category.categoryImage = req?.file?.path || category.categoryImage

        await category.save()

        return res.status(200).json({
            status: true,
            message: "category updated successfully",
            category
        })

    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: "internal server error"
        })
    }
}

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.query
        if (!id) {
            return res.status(401).json({
                status: false,
                message: "invalid fields"
            })
        }

        const category = await Category.findById(id)

        await category.deleteOne()

        if (!category) {
            res.status(401).json({
                status: false,
                message: "invalid category Id"
            })
        }

        return res.status(200).json({
            status: true,
            message: "category deleted successfully"
        })

    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: "internal server error"
        })
    }
}

exports.getSingleCategory=async(req,res)=>{
    try {
        const {categoryId}=req.query
    
        if (!categoryId) {
            return res.status(401).json({status:false,message:"invalis fileds"})
        }

        const category=await Category.findById(categoryId)

        await category.save()

        return res.status(200).json({status:true,message:"category fetched successfully",category})
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: "internal server error"
        })
    }
}