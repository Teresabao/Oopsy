import { Request, Response } from 'express';
import Flashcard from '../models/Flashcard';
import Category from '../models/Category';

// ==========================================
// CATEGORY (DECK) CONTROLLERS
// ==========================================

// 1. Create a new Category (Deck)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;
    
    // Mongoose makes creating data this easy:
    const newCategory = await Category.create({ name, description });
    
    res.status(201).json(newCategory);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create category', details: error.message });
  }
};

// 2. Get all Categories
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};


// ==========================================
// FLASHCARD CONTROLLERS
// ==========================================

// 1. Create a new Flashcard
export const createFlashcard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, categoryId } = req.body;

    // Check if the category exists before creating the card
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      res.status(404).json({ error: 'Category (Deck) not found. Please provide a valid categoryId.' });
      return;
    }

    const newCard = await Flashcard.create({ 
      question, 
      answer, 
      category: categoryId 
    });
    
    res.status(201).json(newCard);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create flashcard', details: error.message });
  }
};

// 2. Get all Flashcards (The Magic of Mongoose Populate!)
export const getFlashcards = async (req: Request, res: Response): Promise<void> => {
  try {
    // .populate() replaces the 'category' ID with the actual Category name!
    const cards = await Flashcard.find()
      .populate('category', 'name description') 
      .sort({ createdAt: -1 });
      
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
};

// ==========================================
// 更新闪卡 (Update Flashcard)
// ==========================================
export const updateFlashcard = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { question, answer, categoryId } = req.body;
        
        // 告诉 Mongoose 找到这个 ID 的卡片并更新它的内容
        const updatedCard = await Flashcard.findByIdAndUpdate(
            id, 
            { question, answer, category: categoryId },
            { new: true } // 返回更新后的数据
        );
        
        if (!updatedCard) return res.status(404).json({ error: '找不到该卡片' });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
};

// ==========================================
// 删除闪卡 (Delete Flashcard)
// ==========================================
export const deleteFlashcard = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        await Flashcard.findByIdAndDelete(id);
        res.json({ message: '删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除失败' });
    }
};

// ==========================================
// 标记闪卡为已掌握 (Mark as Mastered)
// ==========================================
// ==========================================
// 艾宾浩斯记忆算法：记录复习结果
// ==========================================
export const recordReview = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { isKnown } = req.body; // 前端传过来：认识(true) 还是 忘了(false)
        
        const card = await Flashcard.findById(id);
        if (!card) return res.status(404).json({ error: '找不到该卡片' });

        let newInterval = card.interval;
        let nextDate = new Date(); // 获取当前时间

        if (isKnown) {
            // 如果记住了，复习间隔呈指数级拉长（1天, 3天, 7天, 15天, 30天）
            if (newInterval === 0) nextDate.setDate(nextDate.getDate() + 1);
            else if (newInterval === 1) nextDate.setDate(nextDate.getDate() + 3);
            else if (newInterval === 2) nextDate.setDate(nextDate.getDate() + 7);
            else if (newInterval === 3) nextDate.setDate(nextDate.getDate() + 15);
            else nextDate.setDate(nextDate.getDate() + 30); // 彻底印在脑子里了
            
            newInterval += 1; // 进入下一个记忆阶段
        } else {
            // 如果忘了，立刻打回原形
            newInterval = 0; 
            // nextDate 保持为当前时间，意味着今天必须再背一遍
        }

        const updatedCard = await Flashcard.findByIdAndUpdate(
            id, 
            { interval: newInterval, nextReviewDate: nextDate },
            { new: true }
        );
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: '更新记忆曲线失败' });
    }
};