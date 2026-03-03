import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from './Category';

export interface IFlashcard extends Document {
  question: string;
  answer: string;
  category: ICategory['_id'];
  nextReviewDate: Date; // ✨ 核心：下次需要复习的精确时间
  interval: number;     // ✨ 核心：当前处于记忆的第几个阶段
  createdAt: Date;
}

const FlashcardSchema: Schema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  nextReviewDate: { type: Date, default: Date.now }, // 默认：立刻需要复习
  interval: { type: Number, default: 0 },            // 默认：第0阶段（还没记住）
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);