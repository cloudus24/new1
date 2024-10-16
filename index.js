const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieparser = require("cookie-parser");
require("dotenv").config({ path: ".env" });
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
}));
app.use(cookieparser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;
app.use(express.static(path.join(__dirname, "public")));
app.use("/storage", express.static(path.join(__dirname, "storage")));
const Route = require("./route/index.route");

app.use("/", Route);

mongoose.set("strictQuery", true);
mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;
db.on("error", (error) => {
  console.log(error);
});
db.once("open", () => {
  console.log("Database connected");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3002"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("joinRoom", (userId) => {
    socket.join(userId);
    console.log(`User with ID: ${userId} joined their room`);
  });

 socket.on("sendMessage", (messageData) => {
    console.log('Received message:', messageData);

    const Message = require("./model/message.model");
    const message = new Message({
      sender: messageData.sender,
      text: messageData.text,
      userId: messageData.userId,
    });

    message.save()
      .then(() => {
        console.log("Message saved to database");
        io.to(messageData.userId).emit("receiveMessage", messageData);
      })
      .catch((error) => {
        console.error("Error saving message:", error);
      });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
