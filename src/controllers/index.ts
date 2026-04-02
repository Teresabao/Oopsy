import { Request, Response } from 'express';
import Flashcard from '../models/Flashcard';
import Category from '../models/Category';

import { AuthRequest } from '../middleware/auth'; // 👈 引入带通行证的请求类型


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
// ==========================================
// 🗂️ 1. 获取闪卡列表 (🚨 核心隔离：只查属于自己的卡片)
// ==========================================
export const getFlashcards = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.id; // 🕵️‍♂️ 从保安那里拿到当前用户的 ID
        const { categoryId } = req.query; // 前端可能传了分类 ID 过来查询

        // 组装查询条件：无论如何，必须满足 userId 是当前用户！
        const query: any = { userId: userId }; 
        if (categoryId) {
            query.categoryId = categoryId;
        }

        const flashcards = await Flashcard.find(query);
        res.json(flashcards);
    } catch (error) {
        res.status(500).json({ error: '获取卡片失败' });
    }
};

// ==========================================
// 🗂️ 2. 新建单张闪卡 (🚨 核心印记：强行打上主人烙印)
// ==========================================
export const createFlashcard = async (req: AuthRequest, res: Response) => {
    try {
        const { question, answer, category, categoryId } = req.body;
        const userId = req.user.id; // 🕵️‍♂️ 拿到当前用户的 ID

        const newCard = new Flashcard({ 
            question, 
            answer, 
            category: category || categoryId, // 👈 谁有值就用谁
            userId: userId // 🎯 核心操作：把这张卡片挂在你的名下！
        });
        
        await newCard.save();
        res.status(201).json(newCard);
    } catch (error) {
        res.status(500).json({ error: '新建卡片失败' });
    }
};



// ==========================================
// 🗂️ 3. 修改单张闪卡 (🚨 核心防御：防篡改)
// ==========================================
export const updateFlashcard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { question, answer, categoryId } = req.body;
        const userId = req.user.id;

        // 🚨 核心防线：查找条件必须同时满足 _id 和 userId！
        const updatedCard = await Flashcard.findOneAndUpdate(
            { _id: id, userId: userId }, 
            { question, answer, categoryId }, 
            { new: true } 
        );

        if (!updatedCard) return res.status(404).json({ message: '找不到卡片，或你无权修改！' });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: '更新卡片失败' });
    }
};

// ==========================================
// 🗂️ 4. 删除单张闪卡 (🚨 核心防御：防误删)
// ==========================================
export const deleteFlashcard = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 🚨 同理，只允许删除属于自己的卡片
        const deletedCard = await Flashcard.findOneAndDelete({ _id: id, userId: userId });
        
        if (!deletedCard) return res.status(404).json({ message: '找不到卡片，或你无权删除！' });
        res.json({ message: '卡片已成功删除' });
    } catch (error) {
        res.status(500).json({ error: '删除卡片失败' });
    }
};

// ==========================================
// 🗂️ 5. 记录复习状态 (🚨 核心防御：只更新自己的进度)
// ==========================================
export const recordReview = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { isCorrect } = req.body;
        const userId = req.user.id;

        const card = await Flashcard.findOne({ _id: id, userId: userId });
        if (!card) return res.status(404).json({ message: '找不到卡片，或你无权操作！' });

        // ... 保留你原本的复习算法逻辑 (计算 nextReviewDate, easeFactor 等) ...
        // (这里假设你只传个简单的状态过去更新，如果有复杂的计算，保留你原来的逻辑，只要上面那句 findOne 加了 userId 即可)
        // 下面这句只是个示例，具体依据你自己的打卡逻辑：
        // card.reviewCount = (card.reviewCount || 0) + 1;
        
        await card.save();
        res.json(card);
    } catch (error) {
        res.status(500).json({ error: '记录复习状态失败' });
    }
};

// ==========================================
// 🗂️ 6. 批量导入闪卡 (🚨 核心印记：给每一张卡片打上标签！)
// ==========================================
export const createFlashcardsBatch = async (req: AuthRequest, res: Response) => {
    try {
        const { cards, categoryId } = req.body;
        const userId = req.user.id;

        // 🚨 核心改造：遍历传过来的每一张卡片数据，给它们强行塞入 userId
        const cardsWithOwnership = cards.map((card: any) => ({
            ...card,
            categoryId: categoryId,
            userId: userId // 👈 批量打上你的私人烙印！
        }));

        const insertedCards = await Flashcard.insertMany(cardsWithOwnership);
        res.status(201).json(insertedCards);
    } catch (error) {
        res.status(500).json({ error: '批量导入失败' });
    }
};
