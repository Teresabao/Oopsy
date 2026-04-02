import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes'; // 引入我们刚刚写好的新路由！
import path from 'path';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 🌟 这一句非常关键：利用 path 模块精准定位根目录下的 public 文件夹
app.use(express.static(path.join(__dirname, '../public')));


// 2. 在你挂载其他路由（比如 flashcards）的附近，加上这句：
app.use('/api/auth', authRoutes);
// 连接 MongoDB 数据库 (Mongoose)
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ MongoDB 连接成功'))
  .catch(err => console.error('❌ MongoDB 连接失败:', err));


// ...... 上面是你原本的 mongoose.connect 代码 ......

// 🌟🌟🌟 新增：有道词典专用查词代理接口 🌟🌟🌟
app.get('/api/dict', async (req, res) => {
    // TypeScript 需要指定类型
    const word = req.query.word as string;
    
    if (!word) {
        res.status(400).json({ error: '请输入单词' });
        return; 
    }

    try {
        // 呼叫有道官方联想接口
        const youdaoUrl = `https://dict.youdao.com/suggest?q=${encodeURIComponent(word)}&num=1&doctype=json`;
        const response = await fetch(youdaoUrl);
        const data: any = await response.json();

        let translation = "";
        // 提取带词性的完美释义
        if (data && data.data && data.data.entries && data.data.entries.length > 0) {
            translation = data.data.entries[0].explain; 
        }

        res.json({ translation: translation || "未找到确切释义" });
    } catch (error) {
        console.error("查词失败:", error);
        res.status(500).json({ error: '后端网络异常' });
    }
});

// 1. 🌟 先让 app 把你写好的增删改查路由装载上（必须在 export 之前）
app.use('/api', routes);

// 2. 🌟 判断环境：只有在你自己的电脑上运行（本地开发）时，才监听端口
// Vercel 云端在运行时，会自动提供它自己的环境，不需要我们 listen
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 本地 Oopsy 服务器运行在 http://localhost:${PORT}`);
  });
}

// 3. 🌟 终极大招：把所有装备都穿好后的 app，正式交给 Vercel！（必须在最后一行）
export default app;