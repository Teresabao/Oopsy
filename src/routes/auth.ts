// routes/auth.ts
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/Users'; // 引入刚才改造好的 TS 模型

const router = express.Router();

// 🔐 JWT 专属秘钥
const JWT_SECRET = process.env.JWT_SECRET || 'oopsy_super_secret_key_2026';

// 📝 1. 注册接口
// 📝 1. 注册接口 (改造版：注册成功直接发票)
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空哦' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: '这个名字已经被注册啦，换一个吧' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            password: hashedPassword
        });
        await newUser.save();

        // 🚀 【新增核心】：注册成功后，直接签发 Token
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        // 返回 Token，让前端可以直接登录跳转
        res.status(201).json({ 
            message: '注册成功！欢迎来到 Oopsy！',
            token: token, // 👈 把新票给前端
            user: {
                id: newUser._id,
                username: newUser.username
            }
        });

    } catch (error) {
        console.error('注册报错:', error);
        res.status(500).json({ message: '服务器开小差了，注册失败' });
    }
});

// 🔑 2. 登录接口
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: '找不到这个用户，是不是名字打错了？' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: '密码不对哦，再试一次吧' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: '登录成功！',
            token: token,
            user: {
                id: user._id,
                username: user.username,
                dailyStudyLimit: user.dailyStudyLimit,
                streakDays: user.streakDays
            }
        });

    } catch (error) {
        console.error('登录报错:', error);
        res.status(500).json({ message: '服务器开小差了，登录失败' });
    }
});

export default router;