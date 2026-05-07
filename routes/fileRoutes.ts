import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import File from '../models/File';

const router: Router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// SHA-256 জেনারেটর
const generateHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// ১. ফাইল আপলোড (POST /files)
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<any> => {
  console.log("📥 Request received for file:", req.file?.originalname);
  
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileBuffer = req.file.buffer;
    const sha256 = generateHash(fileBuffer);

    // ডুপ্লিকেট চেক
    const existingFile = await File.findOne({ sha256 });

    if (existingFile) {
      console.log("🔄 Duplicate found. Increasing count.");
      existingFile.occurrenceCount += 1;
      await existingFile.save();
      return res.status(200).json({ message: 'Duplicate detected', file: existingFile });
    }

    // নতুন ফাইল সেভ করার নিয়ম
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const uploadDir = path.join(process.cwd(), 'uploads');
    const fullPath = path.join(uploadDir, fileName);

    fs.writeFileSync(fullPath, fileBuffer);

    const newFile = new File({
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      sha256: sha256,
      filePath: fileName, // এখানে শুধু নাম সেভ করছি (Best Practice)
      occurrenceCount: 1
    });

    await newFile.save();
    console.log("✅ New file saved to vault.");
    res.status(201).json({ message: 'File uploaded successfully', file: newFile });

  } catch (error) {
    console.error("🔥 Error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// ২. লিস্ট দেখা (GET /files)
router.get('/', async (req: Request, res: Response) => {
    try {
      const files = await File.find();
      const totalOccupiedSize = files.reduce((acc, file) => acc + file.size, 0);
      res.json({ files, totalOccupiedSize });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
});

// ৩. ডিলিট করা (DELETE /files/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
    try {
      const file = await File.findById(req.params.id);
      if (!file) return res.status(404).json({ message: 'File not found' });
  
      if (file.occurrenceCount > 1) {
        file.occurrenceCount -= 1;
        await file.save();
        return res.json({ message: 'Occurrence count decremented', file });
      } else {
        // ফাইল পুরোপুরি ডিলিট করা
        const fullPath = path.join(process.cwd(), 'uploads', file.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
        await File.findByIdAndDelete(req.params.id);
        res.json({ message: 'File deleted completely from vault' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
});

export default router;