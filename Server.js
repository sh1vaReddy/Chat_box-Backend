import express from "express";
import UseRouter from "./routes/Users.js";
import dotenv from "dotenv";
import connectdb from "./config/db.js";
import { errormidddleware } from "./middleware/error.js";
import cookieParser from "cookie-parser";
import { v4 as uuid } from "uuid";
import { createServer } from "http";
import ChatRouter from "./routes/Chat.js";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { Server } from "socket.io";
import { socketAuthenticator } from "./middleware/auth.js";
import {
  CHAT_EXIT,
  CHAT_JOINED,
  NEW_MESSAGE,
  New_Message_Alert,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
} from "./constants/events.js";
import { getSocket } from "./lib/helper.js";
import { Message } from "./Models/Message.js";

const Port = process.env.PORT || 5000;

dotenv.config();

cloudinary.config({
  cloud_name: process.env.Cloudinary_Clound_Name,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_KEY_SCERET,
});

const corsoption = {
  origin: [process.env.CLIENT_URL],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};
const server = express();
server.use(cors(corsoption));
const app = createServer(server);
const io = new Server(app, {
  cors: corsoption,
});

server.set("io", io);
server.use(express.json());
server.use(cookieParser());

connectdb();

const userSocketIDs = new Map();
const onlineusers = new Set();

server.use("/api/v1", UseRouter, ChatRouter);

io.use((socket, next) => {
  cookieParser()(socket.request, socket.request.res, async (err) => await socketAuthenticator(err, socket, next));
});

io.on("connection", (socket) => {
  const user = socket.user;

  userSocketIDs.set(user._id.toString(), socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      cretedAt: new Date().toISOString(),
    };
    const messageDB = {
      content: message,
      sender: user._id,
      chatId: chatId,
    };

    const usersockets = getSocket(members);
    io.to(usersockets).emit(NEW_MESSAGE, {
      chatId,
      message: messageRealTime,
    });
    io.to(usersockets).emit(New_Message_Alert, {
      chatId,
    });
    try {
      await Message.create(messageDB);
    } catch (error) {
      throw new Error(error);
    }
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineusers.add(userId.toString());
    const memberSocket = getSocket(members);
    io.to(memberSocket).emit(ONLINE_USERS, Array.from(onlineusers));
  });

  socket.on(CHAT_EXIT, ({ userId, members }) => {
    onlineusers.delete(userId.toString());
    const memberSocket = getSocket(members);
    io.to(memberSocket).emit(ONLINE_USERS, Array.from(onlineusers));
  });

  socket.on(START_TYPING, ({ members, chatId }) => {
    const memberSocket = getSocket(members);
    socket.to(memberSocket).emit(START_TYPING, { chatId });
  });

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const memberSocket = getSocket(members);
    socket.to(memberSocket).emit(STOP_TYPING, { chatId });
  });

  socket.on("disconnect", () => {
    userSocketIDs.delete(user._id.toString());
    onlineusers.delete(user._id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineusers));
  });
});

server.use(errormidddleware);

app.listen(Port, () => {
  console.log(`Server is running ${Port}`);
});

export { userSocketIDs };
export default corsoption;
