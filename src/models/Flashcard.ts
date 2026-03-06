import mongoose, { Document, Schema } from 'mongoose';
import { ICategory } from './Category'; // 👈 没错！把你这句保留在这里！

// ✨ TypeScript 接口定义
export interface IFlashcard extends Document {
    question: string;
    answer: string;
    // 👇 核心优化：告诉 TS，这个字段既可以是 ObjectId，也可以是 Populate 之后的完整分类对象
    category: mongoose.Types.ObjectId | ICategory; 
    
    // 艾宾浩斯核心
    nextReviewDate: Date;
    interval: number;
    easeFactor: number;
    
    // 瀑布流打怪核心
    stage: number;               
    consecutiveCorrect: number;  
    
    createdAt: Date;
}

// 🗄️ 数据库 Schema 结构 (保持不变)
const FlashcardSchema: Schema = new Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    
    nextReviewDate: { type: Date, default: Date.now },
    interval: { type: Number, default: 0 },
    easeFactor: { type: Number, default: 2.5 },
    stage: { type: Number, default: 0 },              
    consecutiveCorrect: { type: Number, default: 0 }, 
    
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);