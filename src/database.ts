import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '你的连接字符串';


// 在 src/database.ts 中添加详细日志
export const connectDB = async () => {
    try {
        console.log('尝试连接MongoDB...');
        console.log('连接字符串:', process.env.MONGODB_URI ? '已设置' : '未设置');
        
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ MongoDB连接成功');
    } catch (error) {
        console.error('❌ MongoDB连接失败详情:');
        console.error(error);
        process.exit(1);
    }
};