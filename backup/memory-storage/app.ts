import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { setRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⭐️ 静态文件服务 - CommonJS 方式
app.use(express.static(path.join(__dirname, '../public')));

// 设置路由
setRoutes(app);

// 通配符路由（可选）
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});