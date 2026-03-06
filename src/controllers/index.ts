import { Request, Response } from 'express';
import Flashcard from '../models/Flashcard';
import Category from '../models/Category';

// ==========================================
// 🗂️ CATEGORY (DECK) CONTROLLERS 
// ==========================================

// 1. Create a new Category (V2.0 升级：支持父级目录和卡包类型)
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, parentId, type } = req.body;
    
    // 融合了你的 description，以及 V2.0 的 parentId 和 type
    const newCategory = await Category.create({ 
        name, 
        description,
        parentId: parentId || null, 
        type: type || 'vocabulary' 
    });
    
    res.status(201).json(newCategory);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create category', details: error.message });
  }
};

// 2. Get all Categories (保留了你的倒序排列)
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// ✨ V2.0 核心新增：一站式更新分类（改名/搬家/切模式）
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, parentId, type } = req.body;
        // 如果前端传了空字符串作为 parentId，我们把它转成 null 以成为顶级目录
        const newParentId = parentId ? parentId : null;
        
        const updated = await Category.findByIdAndUpdate(
            id, 
            { name, parentId: newParentId, type }, 
            { new: true }
        );
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: '更新分类失败' });
    }
};

// ✨ V2.0 核心修改：安全删除（卡片进孤儿院，子文件夹提拔）
export const deleteCategory = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        
        // 1. 保护弱小：把这个文件夹下的所有子分类提拔为“顶级目录”
        await Category.updateMany({ parentId: id }, { parentId: null });
        
        // 2. 保护卡片：不删卡片！只把属于这个分类的卡片的 category 设为 null (进孤儿院)
        await Flashcard.updateMany({ category: id }, { category: null });
        
        // 3. 最后，才删掉这个空壳文件夹
        await Category.findByIdAndDelete(id);
        
        res.json({ message: '分类已删除，所属卡片已安全移至“未分类”' });
    } catch (error) {
        res.status(500).json({ error: '删除分类失败' });
    }
};

// ==========================================
// 🃏 FLASHCARD CONTROLLERS
// ==========================================

// 1. Create a new Flashcard (保留了你优秀的分类存在性校验)
export const createFlashcard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { question, answer, categoryId } = req.body;

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      res.status(404).json({ error: 'Category not found. Please provide a valid categoryId.' });
      return;
    }

    const newCard = await Flashcard.create({ question, answer, category: categoryId });
    res.status(201).json(newCard);
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to create flashcard', details: error.message });
  }
};

// 2. Get all Flashcards (保留了你的 populate 选择字段和排序)
export const getFlashcards = async (req: Request, res: Response): Promise<void> => {
  try {
    const cards = await Flashcard.find()
      .populate('category', 'name description type') // V2.0 顺便把 type 也查出来
      .sort({ createdAt: -1 });
      
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
};

// 3. Update Flashcard
export const updateFlashcard = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { question, answer, categoryId } = req.body;
        
        const updatedCard = await Flashcard.findByIdAndUpdate(
            id, 
            { question, answer, category: categoryId },
            { new: true } 
        );
        
        if (!updatedCard) return res.status(404).json({ error: '找不到该卡片' });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
};

// 4. Delete Flashcard
export const deleteFlashcard = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        await Flashcard.findByIdAndDelete(id);
        res.json({ message: '删除成功' });
    } catch (error) {
        res.status(500).json({ error: '删除失败' });
    }
};

// 5. Batch Import (保留了你完整的验证和命名)
export const createFlashcardsBatch = async (req: any, res: any) => {
    try {
        const { cards, categoryId } = req.body; 
        
        if (!cards || cards.length === 0 || !categoryId) {
            return res.status(400).json({ error: '数据不完整' });
        }

        const cardsToInsert = cards.map((card: any) => ({
            question: card.question,
            answer: card.answer,
            category: categoryId
        }));

        const insertedCards = await Flashcard.insertMany(cardsToInsert);
        res.status(201).json({ message: `成功导入 ${insertedCards.length} 张卡片!`, data: insertedCards });
    } catch (error) {
        res.status(500).json({ error: '批量导入失败' });
    }
};

// ==========================================
// 🧠 核心发电机：瀑布流记忆引擎 (V2.0 完全重构版)
// ==========================================
export const recordReview = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { isKnown } = req.body; 
        
        const card = await Flashcard.findById(id);
        if (!card) return res.status(404).json({ error: '找不到该卡片' });

        if (isKnown) {
            // ✅ 答对了！
            card.consecutiveCorrect += 1; // 连对次数 +1
            
            // ✨ 瀑布流打怪：连对 1 次，立刻解锁默写模式！
            if (card.consecutiveCorrect >= 1 && card.stage === 0) {
                card.stage = 1; 
            }

            // 艾宾浩斯记忆曲线：拉长下次复习的间隔
            if (card.interval === 0) {
                card.interval = 1;
            } else if (card.interval === 1) {
                card.interval = 6;
            } else {
                card.interval = Math.round(card.interval * card.easeFactor);
            }
            card.easeFactor = Math.min(card.easeFactor + 0.1, 3.0); 

        } else {
            // ❌ 答错了！
            card.consecutiveCorrect = 0; // 连对记录清零
            
            // ✨ 惩罚机制：如果在默写阶段拼错，瞬间降级回背诵阶段找语感！
            if (card.stage === 1) {
                card.stage = 0;
            }

            // 今天必须重背，且因子降低（底线 1.3）
            card.interval = 0;
            card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
        }

        // 计算下一次要复习的具体日期
        const nextDate = new Date();
        if (card.interval > 0) {
            nextDate.setDate(nextDate.getDate() + card.interval);
        }
        card.nextReviewDate = nextDate;

        await card.save();
        res.json(card);

    } catch (error) {
        res.status(500).json({ error: '更新记忆曲线失败' });
    }
};
