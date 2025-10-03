import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { emailQueue } from "./queue.js";
import { connection } from "./redisConnection.js";
import User from "./src/users/userModal.js";
import AppError from "./utils/AppError.js";
import { errorHandler } from "./utils/errorHandler.js";

dotenv.config();

const app = express();
app.use(express.json());

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// POST /register
app.post("/register", async (req, res) => {
  const { email, name } = req.body;
  if (!email) return next(new AppError("Email is required", 400));

  try {
    const existing = await User.findOne({ email });
    if (existing) return next(new AppError("Email already exists", 409));

    const user = await User.create({ email, name });

    // enqueue welcome email
    await emailQueue.add("sendWelcomeEmail", { email });

    // invalidate cached user list in Redis
    await connection.del("userList");

    res.json({ message: "User registered and email queued!", user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /users → with Redis caching
app.get("/users", async (req, res) => {
  try {
    // Check Redis cache first
    const cached = await connection.get("userList");
    if (cached) {
      console.log("get data from reids catch....");
      return res.json({ source: "cache", users: JSON.parse(cached) });
    }

    // Fetch from MongoDB
    const users = await User.find().sort({ createdAt: -1 });
    if (!users || users.length === 0) {
      return next(new AppError("No users found", 404));
    }
    // Cache in Redis for 30 seconds
    await connection.set("userList", JSON.stringify(users), "EX", 30);

    res.json({ source: "mongodb", users });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Fallback route (404)
app.all("*", (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
