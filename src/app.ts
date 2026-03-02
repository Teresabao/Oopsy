import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import routes from './routes'; // 引入我们刚刚写好的新路由！

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 🌟 这一句非常关键：它告诉服务器前端页面在哪里！
app.use(express.static('public')); 

// 连接 MongoDB 数据库 (Mongoose)
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('✅ MongoDB 连接成功'))
  .catch(err => console.error('❌ MongoDB 连接失败:', err));

// 使用我们写好的 Mongoose 路由接口
app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});