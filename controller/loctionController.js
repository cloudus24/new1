const { Loction } = require('../model/index.model');

exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Loction.find();
        res.json({ locations });
    } catch (err) {
        console.error("Failed to fetch locations:", err);
        res.status(500).json({ error: "Failed to fetch locations" });
    }
};

exports.addLocation = async (req, res) => {
    try {

        const {latitude,name,longitude}=req.body
        console.log('req.body :>> ', req.body);
        const {image}=req.file.path
        console.log('req.file :>> ', req.file);

        const location = await Loction()

        location.latitude = latitude
        location.name = name
        location.longitude = longitude
        location.image = image
      
        res.status(201).json({ message: "Location added successfully", location });
    } catch (err) {
        console.error("Failed to add location:", err);
        res.status(500).json({ error: "Failed to add location" });
    }
};

