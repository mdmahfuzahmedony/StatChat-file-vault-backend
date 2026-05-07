
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors"; // নিশ্চিত হও এই লাইনটি আছে
import fs from "fs";
import path from "path";
import fileRoutes from "./routes/fileRoutes";

const app: Application = express();

// --- CORS সেটআপ (সবার উপরে থাকতে হবে) ---
app.use(cors({
  origin: "*", // এটি সব কানেকশন এলাউ করবে
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// --- রাউটস ---
app.use("/files", fileRoutes);

const MONGO_URI = process.env.MONGO_URI as string;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected (TS)"))
  .catch((err) => console.log("❌ DB Error:", err));

app.get("/", (req: Request, res: Response) => {
  res.send("File Vault API is running...");
});

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const PORT = 20012;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


export default app;