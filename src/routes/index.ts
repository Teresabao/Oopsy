import { Router } from 'express';
import { 
  createCategory, 
  getCategories, 
  createFlashcard, 
  getFlashcards,
  updateFlashcard, // 👈 新引入的更新功能
  deleteFlashcard  // 👈 新引入的删除功能
} from '../controllers'; 

const router = Router();

// Category Routes (分类接口)
router.post('/categories', createCategory);
router.get('/categories', getCategories);

// Flashcard Routes (闪卡接口)
router.post('/flashcards', createFlashcard);
router.get('/flashcards', getFlashcards);
// 👇 新增的两个通道
router.put('/flashcards/:id', updateFlashcard);
router.delete('/flashcards/:id', deleteFlashcard);

export default router;