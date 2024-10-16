const express = require("express");
const router = express.Router();
const categoryController = require("../controller/categoryController");
const upload = require("../utils/multer"); 

router.get("/show", categoryController.getCategory);
router.post("/create", upload.single("categoryImage"), categoryController.addCategory);
router.patch("/update", upload.single("categoryImage"), categoryController.updateCategory);
router.delete("/delete",categoryController.deleteCategory)

module.exports = router;
