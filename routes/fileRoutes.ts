import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import File from '../models/File';

const router: Router = express.Router();

// মেমোরিতে ফাইল রাখার জন্য (Vercel-এ এটিই কাজ করে)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// SHA-256 জেনারেটর
const generateHash = (buffer: Buffer): string => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// ১. ফাইল আপলোড (POST /files)
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const fileBuffer = req.file.buffer;
    const sha256 = generateHash(fileBuffer);

    // ডুপ্লিকেট চেক (হাশ দিয়ে)
    const existingFile = await File.findOne({ sha256 });

    if (existingFile) {
      existingFile.occurrenceCount += 1;
      await existingFile.save();
      return res.status(200).json({ message: 'Duplicate detected', file: existingFile });
    }

    // নতুন ফাইল মেটাডেটা সেভ করা (Vercel-এ ফাইল রাইট করা যায় না, তাই শুধু তথ্য রাখছি)
    const virtualFileName = `${Date.now()}-${req.file.originalname}`;

    const newFile = new File({
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      sha256: sha256,
      filePath: virtualFileName, 
      occurrenceCount: 1
    });

    await newFile.save();
    res.status(201).json({ message: 'File added to vault (Metadata)', file: newFile });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// ২. লিস্ট দেখা (GET /files)
router.get('/', async (req: Request, res: Response) => {
    try {
      const files = await File.find().sort({ uploadDate: -1 });
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
        return res.json({ message: 'Occurrence count reduced' });
      } else {
        await File.findByIdAndDelete(req.params.id);
        res.json({ message: 'File removed from vault' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
});

export default router;