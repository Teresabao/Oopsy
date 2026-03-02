import { Express, Request, Response } from 'express';
// import mongoose from 'mongoose'; 

// // 临时数据存储（后续可以换成数据库）
interface Flashcard {
  id: number;
  question: string;
  answer: string;
  createdAt: Date;
}

// const flashcardSchema = new mongoose.Schema({
//     question: { type: String, required: true },
//     answer: { type: String, required: true },
//     createdAt: { type: Date, default: Date.now }
// });

// const Flashcard = mongoose.model('Flashcard', flashcardSchema);
let flashcards: any[] = [];
let nextId = 1;

export const setRoutes = (app: Express) => {
  // ==================== MongoDB版本 ====================
    // 1. 获取所有闪卡
//   app.get('/api/flashcards', async (req: Request, res: Response) => {
//     try {
//         const flashcards = await Flashcard.find().sort({ createdAt: -1 });
//         res.json({ success: true, data: flashcards });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : '未知错误';
//         res.status(500).json({ success: false, message: '获取闪卡失败', error: errorMessage });
//     }
// });

//   // 2. 创建新闪卡
//   app.post('/api/flashcards', async (req: Request, res: Response) => {
//     try {
//         const { question, answer } = req.body;
//         if (!question || !answer) {
//             return res.status(400).json({ success: false, message: '问题和答案不能为空' });
//         }

//         const newFlashcard = new Flashcard({ question, answer });
//         await newFlashcard.save();

//         res.status(201).json({ success: true, data: newFlashcard, message: '闪卡创建成功' });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : '未知错误';
//         res.status(500).json({ success: false, message: '创建闪卡失败', error: errorMessage });
//     }
// });

//   // 3. 获取单个闪卡
 
// // 替换原来的 app.get('/api/flashcards/:id', ...)
// app.get('/api/flashcards/:id', async (req: Request, res: Response) => {
//     try {
//         // 使用MongoDB的findById方法
//         const flashcard = await Flashcard.findById(req.params.id);
        
//         if (!flashcard) {
//             return res.status(404).json({
//                 success: false,
//                 message: '闪卡不存在'
//             });
//         }

//         res.json({
//             success: true,
//             data: flashcard
//         });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : '未知错误';
//         res.status(500).json({
//             success: false,
//             message: '获取闪卡失败',
//             error: errorMessage
//         });
//     }
// });

//   // 4. 更新闪卡
//   // 替换原来的 app.put('/api/flashcards/:id', ...)
// app.put('/api/flashcards/:id', async (req: Request, res: Response) => {
//     try {
//         const { question, answer } = req.body;
        
//         // 使用findByIdAndUpdate更新闪卡
//         const updatedFlashcard = await Flashcard.findByIdAndUpdate(
//             req.params.id,          // 要更新的文档ID
//             { 
//                 question: question?.trim(), 
//                 answer: answer?.trim(),
//                 updatedAt: new Date()  // 添加更新时间
//             },
//             { 
//                 new: true,            // 返回更新后的文档
//                 runValidators: true   // 运行模型验证
//             }
//         );

//         if (!updatedFlashcard) {
//             return res.status(404).json({
//                 success: false,
//                 message: '闪卡不存在'
//             });
//         }

//         res.json({
//             success: true,
//             data: updatedFlashcard,
//             message: '闪卡更新成功'
//         });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : '未知错误';
//         res.status(500).json({
//             success: false,
//             message: '更新闪卡失败',
//             error: errorMessage
//         });
//     }
// });

//   // 5. 删除闪卡
//   // 替换原来的 app.delete('/api/flashcards/:id', ...)
// app.delete('/api/flashcards/:id', async (req: Request, res: Response) => {
//     try {
//         const result = await Flashcard.findByIdAndDelete(req.params.id);
//         if (!result) {
//             return res.status(404).json({ success: false, message: '闪卡不存在' });
//         }
//         res.json({ success: true, message: '闪卡删除成功' });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : '未知错误';
//         res.status(500).json({ success: false, message: '删除闪卡失败', error: errorMessage });
//     }
// });

//   // 替换原来的 app.get('/api/health', ...)
// app.get('/api/health', async (req: Request, res: Response) => {
//     try {
//         const flashcardCount = await Flashcard.countDocuments();
//         res.json({
//             success: true,
//             message: 'API服务正常运行',
//             timestamp: new Date().toISOString(),
//             flashcardCount: flashcardCount,
//             database: 'MongoDB Atlas'
//         });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : '未知错误';
//         res.status(500).json({ success: false, message: '数据库连接异常', error: errorMessage });
//     }
// });

//   // 替换原来的 app.get('/api/study/random', ...)
// app.get('/api/study/random', async (req: Request, res: Response) => {
//     try {
//         const flashcardCount = await Flashcard.countDocuments();
//         if (flashcardCount === 0) {
//             return res.status(404).json({ success: false, message: '没有可学习的闪卡' });
//         }

//         const randomIndex = Math.floor(Math.random() * flashcardCount);
//         const randomCard = await Flashcard.findOne().skip(randomIndex);

//         res.json({ success: true, data: randomCard });
//     } catch (error) {
//         const errorMessage = error instanceof Error ? error.message : '未知错误';
//         res.status(500).json({ success: false, message: '获取学习卡片失败', error: errorMessage });
//     }
// });

// 替换获取所有闪卡路由
app.get('/api/flashcards', (req: Request, res: Response) => {
    try {
        res.json({ 
            success: true, 
            data: flashcards,  // ← 使用内存数组
            count: flashcards.length
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        res.status(500).json({ 
            success: false, 
            message: '获取闪卡失败',
            error: errorMessage
        });
    }
});

// 替换创建闪卡路由
app.post('/api/flashcards', (req: Request, res: Response) => {
    try {
        const { question, answer } = req.body;

        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: '问题和答案不能为空'
            });
        }

        const newFlashcard = {
            id: nextId++,
            question: question.trim(),
            answer: answer.trim(),
            createdAt: new Date()
        };

        flashcards.push(newFlashcard);

        res.status(201).json({
            success: true,
            data: newFlashcard,
            message: '闪卡创建成功'
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        res.status(500).json({
            success: false,
            message: '创建闪卡失败',
            error: errorMessage
        });
    }
});

// 替换原来的 app.put('/api/flashcards/:id', ...)
app.put('/api/flashcards/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { question, answer } = req.body;
        
        const flashcardIndex = flashcards.findIndex(card => card.id === id);
        
        if (flashcardIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '闪卡不存在'
            });
        }

        // 更新闪卡内容
        flashcards[flashcardIndex] = {
            ...flashcards[flashcardIndex],
            question: question || flashcards[flashcardIndex].question,
            answer: answer || flashcards[flashcardIndex].answer,
            updatedAt: new Date()
        };

        res.json({
            success: true,
            data: flashcards[flashcardIndex],
            message: '闪卡更新成功'
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        res.status(500).json({
            success: false,
            message: '更新闪卡失败',
            error: errorMessage
        });
    }
});

// 替换原来的 app.delete('/api/flashcards/:id', ...)
app.delete('/api/flashcards/:id', (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const flashcardIndex = flashcards.findIndex(card => card.id === id);

        if (flashcardIndex === -1) {
            return res.status(404).json({
                success: false,
                message: '闪卡不存在'
            });
        }

        // 删除闪卡
        const deletedFlashcard = flashcards.splice(flashcardIndex, 1)[0];

        res.json({
            success: true,
            data: deletedFlashcard,
            message: '闪卡删除成功'
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        res.status(500).json({
            success: false,
            message: '删除闪卡失败',
            error: errorMessage
        });
    }
});

// 替换原来的 app.get('/api/health', ...)
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'API服务正常运行（内存存储模式）',
        timestamp: new Date().toISOString(),
        flashcardCount: flashcards.length,
        database: '内存存储',
        status: 'healthy'
    });
});

// 替换原来的 app.get('/api/study/random', ...)
app.get('/api/study/random', (req: Request, res: Response) => {
    try {
        if (flashcards.length === 0) {
            return res.status(404).json({
                success: false,
                message: '没有可学习的闪卡'
            });
        }

        const randomIndex = Math.floor(Math.random() * flashcards.length);
        const randomCard = flashcards[randomIndex];

        res.json({
            success: true,
            data: randomCard
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        res.status(500).json({
            success: false,
            message: '获取学习卡片失败',
            error: errorMessage
        });
    }
});

// 添加清空路由（开发用）
app.delete('/api/flashcards', (req: Request, res: Response) => {
    try {
        const deletedCount = flashcards.length;
        flashcards = [];
        nextId = 1;
        
        res.json({
            success: true,
            message: `已清空所有闪卡（${deletedCount}张）`,
            deletedCount: deletedCount
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        res.status(500).json({
            success: false,
            message: '清空闪卡失败',
            error: errorMessage
        });
    }
});

  console.log('✅ API路由已注册完成');
};