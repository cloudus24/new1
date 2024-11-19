const jwt = require("jsonwebtoken")
const { Admin } = require("../model/index.model")
const { deleteFile } = require("../utils/deleteFile")
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const { image } = req.file.path

        const hash = await bcrypt.hash(password, 10);
        const admin = new Admin()

        admin.name = name,
        admin.email = email,
        admin.password = hash,
        admin.image = image
        
        await admin.save();

        return res.status(201).json({
            status: true,
            message: "admin created successfully",
            admin
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({
                status: false,
                message: 'Admin not found',
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            image: admin.image,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });


        res.cookie('authToken', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === 'production',
        });

        return res.status(200).json({
            status: true,
            message: 'Admin logged in successfully',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Server error',
        });
    }
};


exports.updateImage = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id);

        console.log('req.file :>> ', req.file);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        if (req.file) {
            deleteFile(admin.image)
            admin.image = req.file.path;
        }

        await admin.save();

        const payload = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            image: admin.image
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        return res.status(200).json({
            status: true,
            message: "Image updated successfully",
            token,
        });
    } catch (error) {
        
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.updateAdminPassword = async (req, res) => {
    try {

        const { oldPassword, newPassword } = req.body;

        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, admin.password);

        if (!isMatch) {
            return res.status(400).json({
                status: false,
                message: "Old password is incorrect"
            });
        }

        const hash = await bcrypt.hash(newPassword, 10);
        admin.password = hash;

        await admin.save();

        const payload = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            image: admin.image
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        return res.status(200).json({
            message: "Password updated successfully",
            token
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
}

exports.updateAdmin = async (req, res) => {
    try {

        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({
                status: false,
                message: "Admin not found"
            });
        }

        admin.name = req.body.name
        admin.email = req.body.email

        await admin.save();

        const payload = {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            image: admin.image
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        return res.status(200).json({
            status: true,
            message: "Admin updated successfully",
            token
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
}

exports.logout = async (req, res) => {
    try {
        return res.status(200).json({
            status: true,
            message: "Admin logged out successfully"
        });
    } catch (error) {
        console.log('error :>> ', error);
        return res.status(500).json({
            status: false,
            message: `internal server error !!!`
        })
    }
}

exports.getAdmin = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({
                status: false,
                message: "Admin not found"
            });
        }
        return res.status(200).json({
            status: true,
            message: "Admin fetched successfully",
            admin

        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
}