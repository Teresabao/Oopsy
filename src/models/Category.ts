import mongoose, { Schema, Document } from 'mongoose';

// 1. Define the TypeScript interface for type checking
export interface ICategory extends Document {
  name: string;
  parentId?: mongoose.Types.ObjectId | null; // 👈 核心：记录它的上一级是谁（Null代表它是最顶层文件夹）
  type: 'vocabulary' | 'notes';              // 👈 核心：区分是“词汇”还是“笔记”
  description?: string; // Optional: A short description of the deck
  createdAt: Date;
}

// 2. Define the Mongoose Schema
const CategorySchema: Schema = new Schema({
    name: { type: String, required: true },
    
    // 如果没有 parentId，说明它是一个独立的大文件夹（比如“雅思”）
    // 如果有 parentId，说明它是某个文件夹下的子卡包（比如“雅思”下面的“阅读词汇”）
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    
    // 默认创建的都是词汇卡包，前端也可以传 'notes' 过来
    type: { type: String, enum: ['vocabulary', 'notes'], default: 'vocabulary' },
    
    createdAt: { type: Date, default: Date.now }
});

// 3. Export the model
export default mongoose.model<ICategory>('Category', CategorySchema);