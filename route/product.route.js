const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const upload = require("../utils/multer"); 

router.get("/show", productController.productGet);
router.get("/singleProduct", productController.singleProduct);
router.get("/getProductByCategory", productController.getProductByCategory);
router.post("/create", upload.single("productImage"), productController.addProduct);
router.patch("/update", upload.single("productImage"), productController.updateProduct);
router.delete("/delete",productController.productDelete)
router.get("/globalSearch", productController.globalSearch);
router.put("/isTrending", productController.isTrending);
router.get("/isTrendingProduct", productController.productGetInWeb);

module.exports = router;
