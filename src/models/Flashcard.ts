import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from './Category';

export interface IFlashcard extends Document {
  question: string;
  answer: string;
  category: ICategory['_id'];
  isMastered: boolean; // ✨ 新增：记录是否已掌握
  createdAt: Date;
}

const FlashcardSchema: Schema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  isMastered: { type: Boolean, default: false }, // ✨ 默认是 false（未掌握）
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);