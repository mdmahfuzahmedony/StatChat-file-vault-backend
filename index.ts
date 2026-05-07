import express, { Application, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import fileRoutes from "./routes/fileRoutes";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/files", fileRoutes);

const MONGO_URI = process.env.MONGO_URI || "";

// MongoDB Connection
if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.log("❌ DB Error:", err));
}

app.get("/", (req: Request, res: Response) => {
  res.send("VaultFlow API is running smoothly!");
});

// For Local Development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 20012;
  app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
}

// Vercel এর জন্য এক্সপোর্ট
export default app;