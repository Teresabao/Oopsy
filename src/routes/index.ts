import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import Flashcard from '../models/Flashcard'; 
import Category from '../models/Category';
import { 
  createCategory, 
  getCategories, 
  createFlashcard, 
  getFlashcards,
  updateFlashcard,
  deleteFlashcard,
  recordReview, 
  createFlashcardsBatch,
  deleteCategory,
  updateCategory
} from '../controllers'; 

const router = Router();

// ==========================================
// 📁 分类 (Category) 接口
// ==========================================
// 📁 修改分类创建路由
router.post('/categories', requireAuth, async (req: AuthRequest, res) => {
    // 📢 1. 一进门就打印，看看前端到底发了啥
    console.log('📬 [后端收包] Body 内容:', req.body);
    console.log('👤 [后端查人] 用户 ID:', req.user?.id || req.user?._id);

    try {

        await Category.collection.dropIndex('name_1').catch(err => console.log('索引可能已经删了'));
        const { name, type, parentId } = req.body;
        const userId = req.user.id || req.user._id;

        if (!userId) throw new Error('没有获取到有效用户ID');

        // 🌟 核心修复：极其严格的 parentId 清理
        // 只有当它确实是 24 位 ID 时才保留，否则一律给 null
        const finalParentId = (parentId && parentId.length === 24) ? parentId : null;

        const newCategory = new Category({
            name,
            type: type || 'vocabulary',
            parentId: finalParentId,
            userId: userId
        });

        console.log('⚙️ [数据库] 准备保存的数据:', newCategory);

        await newCategory.save();
        console.log('✅ [数据库] 保存成功！');
        res.status(201).json(newCategory);

    } catch (error: any) {
        // 🚨 这一行是灵魂：它会把真正的死因吐在终端里
        console.error('💥 [核心报错] 存入数据库失败:', error.message);
        res.status(500).json({ 
            error: '服务器内部错误', 
            details: error.message 
        });
    }
});

router.get('/categories', requireAuth, async (req: AuthRequest, res) => {
    try {
        const userId = req.user.id; 
        const categories = await Category.find({ userId: userId }); 
        res.json(categories);
    } catch (error) {
        // 🚨 加上这句监控代码！让后端大声喊出到底错在哪了！
        console.error('💥 获取分类时后端崩溃啦，真实原因是：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/categories/:id', requireAuth, updateCategory);
router.delete('/categories/:id', requireAuth, deleteCategory);

// ==========================================
// 🗂️ 闪卡 (Flashcard) 接口 - 🚨 已全部加上保安！
// ==========================================
router.post('/flashcards', requireAuth, createFlashcard);
router.get('/flashcards', requireAuth, getFlashcards);
router.put('/flashcards/:id', requireAuth, updateFlashcard);
router.delete('/flashcards/:id', requireAuth, deleteFlashcard);
router.post('/flashcards/batch', requireAuth, createFlashcardsBatch);
router.patch('/flashcards/:id/review', requireAuth, recordReview);

// ==========================================
// ⭐ 星标收藏接口 (Inline 逻辑修复)
// ==========================================
router.patch('/flashcards/:id/star', requireAuth, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id; // 拿到当前用户的 ID

        // 🚨 核心隔离：查找这块卡片时，不仅要匹配 id，还要匹配 userId！
        const card = await Flashcard.findOne({ _id: id, userId: userId }); 
        
        if (!card) return res.status(404).json({ message: '找不到卡片，或该卡片不属于你！' });

        card.isStarred = !card.isStarred;
        await card.save();
        res.json({ success: true, isStarred: card.isStarred });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

