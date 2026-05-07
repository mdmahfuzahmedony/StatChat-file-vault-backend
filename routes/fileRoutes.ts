import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import File from '../models/File';

const router: Router = express.Router();

// Multer সেটআপ (ফাইল মেমোরিতে সাময়িকভাবে রাখার জন্য)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// SHA-256 হ্যাশ জেনারেট করার ফাংশন
const generateHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// ১. ফাইল আপলোড (POST /files)
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileBuffer = req.file.buffer;
    const sha256 = generateHash(fileBuffer);

    // ডুপ্লিকেট চেক (একই হ্যাশ আছে কি না)
    const existingFile = await File.findOne({ sha256 });

    if (existingFile) {
      existingFile.occurrenceCount += 1;
      await existingFile.save();
      return res.status(200).json({ 
        message: 'Duplicate detected, incremented occurrence count', 
        file: existingFile 
      });
    }

    // যদি নতুন ফাইল হয়, তবে 'uploads' ফোল্ডারে সেভ করো
    const fileName = `${Date.now()}-${req.file.originalname}`;
    const uploadPath = path.join(__dirname, '../uploads', fileName);
    
    fs.writeFileSync(uploadPath, fileBuffer);

    const newFile = new File({
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      sha256: sha256,
      filePath: uploadPath,
      occurrenceCount: 1
    });

    await newFile.save();
    res.status(201).json({ message: 'File uploaded successfully', file: newFile });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ২. ফাইলের লিস্ট দেখা (GET /files)
router.get('/', async (req: Request, res: Response) => {
  try {
    const files = await File.find();
    
    // শুধু ইউনিক ফাইলের সাইজ যোগ করে টোটাল সাইজ বের করা
    const totalOccupiedSize = files.reduce((acc, file) => acc + file.size, 0);

    res.json({ files, totalOccupiedSize });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ৩. ফাইল ডিলিট (DELETE /files/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    if (file.occurrenceCount > 1) {
      file.occurrenceCount -= 1;
      await file.save();
      return res.json({ message: 'Occurrence count decremented', file });
    } else {
      // যদি কাউন্ট ১ হয়, তবে ফিজিক্যাল ফাইল এবং ডিবি এন্ট্রি ডিলিট করো
      if (fs.existsSync(file.filePath)) {
        fs.unlinkSync(file.filePath);
      }
      await File.findByIdAndDelete(req.params.id);
      res.json({ message: 'File deleted completely from system' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;