import mongoose, { Schema, Document } from 'mongoose';

// ১. TypeScript এর জন্য ইন্টারফেস (Interface)
export interface IFile extends Document {
  name: string;
  size: number;
  type: string;
  sha256: string;
  occurrenceCount: number;
  uploadDate: Date;
  filePath: string;
}

// ২. MongoDB এর জন্য স্কিমা (Schema)
const FileSchema: Schema = new Schema({
  name: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true },
  sha256: { type: String, required: true, index: true }, // ডুপ্লিকেট খোঁজার জন্য ইনডেক্স
  occurrenceCount: { type: Number, default: 1 },         // ডুপ্লিকেট হলে এটি বাড়বে
  uploadDate: { type: Date, default: Date.now },
  filePath: { type: String, required: true }             // ফাইলটি আসলে পিসিতে কোথায় আছে
});

// ৩. মডেল এক্সপোর্ট করা
export default mongoose.model<IFile>('File', FileSchema);