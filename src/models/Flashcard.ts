import mongoose, { Schema, Document } from 'mongoose';
import { ICategory } from './Category';


// 1. Define the TypeScript interface
export interface IFlashcard extends Document {
  question: string;
  answer: string;
  category: mongoose.Types.ObjectId | ICategory; // Links to the Category model
  isMastered: boolean; // Great for your future "Study Mode" algorithm!
}

// 2. Define the Mongoose Schema
const FlashcardSchema: Schema = new Schema({
  question: { 
    type: String, 
    required: [true, 'Question cannot be empty'],
    trim: true 
  },
  answer: { 
    type: String, 
    required: [true, 'Answer cannot be empty'],
    trim: true 
  },
  category: { 
    type: Schema.Types.ObjectId, 
    ref: 'Category', // This EXACTLY matches the name we exported in Category.ts
    required: true 
  },
  isMastered: {
    type: Boolean,
    default: false // Cards start as unmastered
  }
}, { 
  timestamps: true 
});

// 3. Export the model
export default mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);