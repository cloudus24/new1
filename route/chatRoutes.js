    const express = require("express");
    const router = express.Router();
    const { getMessages, sendMessage } = require("../controller/chatController");

    // Route to get all chat messages
    router.get("/get", getMessages);

    // Route to send a new message
    router.post("/send", sendMessage);

    module.exports = router;
