import mongoose, { Schema, Document } from 'mongoose';

// 1. Define the TypeScript interface for type checking
export interface ICategory extends Document {
  name: string;
  description?: string; // Optional: A short description of the deck
  createdAt: Date;
}

// 2. Define the Mongoose Schema
const CategorySchema: Schema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Category name is required'],
    trim: true,
    unique: true // Prevents duplicate deck names
  },
  description: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true // Automatically manages createdAt and updatedAt!
});

// 3. Export the model
export default mongoose.model<ICategory>('Category', CategorySchema);