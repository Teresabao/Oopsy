import { Router } from 'express';
import { 
  createCategory, 
  getCategories, 
  createFlashcard, 
  getFlashcards,
  updateFlashcard,
  deleteFlashcard,
  markAsMastered // 👈 1. 引入新方法
} from '../controllers'; 

const router = Router();

router.post('/categories', createCategory);
router.get('/categories', getCategories);

router.post('/flashcards', createFlashcard);
router.get('/flashcards', getFlashcards);
router.put('/flashcards/:id', updateFlashcard);
router.delete('/flashcards/:id', deleteFlashcard);

// 👇 2. 新增专属通道：专门用来更新掌握状态
router.patch('/flashcards/:id/master', markAsMastered);

export default router;