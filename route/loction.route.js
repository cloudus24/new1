
const express = require("express");
const router = express.Router();
const loctionController = require("../controller/loctionController");
const upload = require("../utils/multer"); 

router.get("/show", loctionController.getAllLocations);
router.post("/create", upload.single("image"), loctionController.addLocation);


module.exports = router;
