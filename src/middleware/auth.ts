// 文件路径：middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// 这个秘钥必须和你签发 Token 用的秘钥一模一样！
const JWT_SECRET = process.env.JWT_SECRET || 'oopsy_super_secret_key_2026';

// 🌟 核心防报错：告诉 TS 我们的 Request 身上带了一个 user 属性
export interface AuthRequest extends Request {
    user?: any;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: '🛑 站住！请先出示你的 Oopsy 通行证 (Token)。' });
    }

    const token = authHeader.split(' ')[1];

    // 🌟 找到 requireAuth 函数里的 try 块
    try {
        const decoded: any = jwt.verify(token, JWT_SECRET);

        // 核心对齐：统一给 req.user 塞一个 id，不管载荷里叫 id 还是 _id
        req.user = {
            ...decoded,
            id: decoded.id || decoded._id
        };

        // 💡 调试利器：只要新建时报错，就看终端有没有打印这一行
        console.log('✅ 用户验证通过，ID为:', req.user.id);
        next();
    } catch (error) {
        console.error('Token 验证失败:', error);
        return res.status(401).json({ message: '🚫 通行证无效，请重新登录！' });
    }
};