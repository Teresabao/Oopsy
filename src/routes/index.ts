import { Router } from 'express';
import { 
  createCategory, 
  getCategories, 
  createFlashcard, 
  getFlashcards,
  updateFlashcard,
  deleteFlashcard,
  recordReview, // 👈 1. 引入新方法
  createFlashcardsBatch,
  deleteCategory,
  updateCategory
} from '../controllers'; 

const router = Router();

router.post('/categories', createCategory);
router.get('/categories', getCategories);

router.post('/flashcards', createFlashcard);
router.get('/flashcards', getFlashcards);
router.put('/flashcards/:id', updateFlashcard);
router.delete('/flashcards/:id', deleteFlashcard);
// 确保顶部引入了 updateCategory
// 加上这行 PUT 路由：
router.put('/categories/:id', updateCategory); // 路径视你原本的写法而定
// 👇 2. 新增专属通道：专门用来更新掌握状态
router.patch('/flashcards/:id/review', recordReview);
// 👇 2. 在闪卡路由区域，加上这个批量导入的专属通道
router.post('/flashcards/batch', createFlashcardsBatch);
router.delete('/categories/:id', deleteCategory);

export default router;