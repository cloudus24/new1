const express = require("express");
const router = express.Router();
const cartController = require("../controller/cartController");
const upload = require("../utils/multer"); 

router.get("/show", cartController.getUserCart);
router.post("/create",  cartController.addCart);
router.patch("/updateQuantity",cartController.cartUpdate);
router.delete("/delete",cartController.cartDelete)

module.exports = router;