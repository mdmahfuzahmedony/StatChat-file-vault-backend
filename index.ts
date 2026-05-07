import express, { Application, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fileRoutes from './routes/fileRoutes';


dotenv.config();
const app: Application = express();

// ১. আগে গ্লোবাল মিডলওয়্যার সেট করো
app.use(cors());
app.use(express.json());

// ২. তারপর রাউট সেট করো
app.use('/files', fileRoutes);

const MONGO_URI = process.env.MONGO_URI as string;

// MongoDB কানেকশন
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected (TS)'))
  .catch(err => console.log('❌ DB Error:', err));

// বেসিক টেস্ট রাউট
app.get('/', (req: Request, res: Response) => {
  res.send('File Vault API is running...');
});

// আপলোড ফোল্ডার চেক ও তৈরি
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});