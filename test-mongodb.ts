import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI!;

async function testMongoDBConnection() {
    console.log('🔍 开始测试MongoDB连接...');
    
    // 隐藏密码显示
    const maskedUri = MONGODB_URI.replace(/:[^:]*@/, ':****@');
    console.log('连接字符串:', maskedUri);
    
    try {
        console.log('⏳ 尝试连接...');
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000
        });
        
        console.log('✅ MongoDB连接成功！');
        console.log('数据库名称:', mongoose.connection.name);
        console.log('主机地址:', mongoose.connection.host);
        
        // 测试基本操作
        console.log('🧪 测试数据读写...');
        const testSchema = new mongoose.Schema({ 
            message: String,
            timestamp: { type: Date, default: Date.now }
        });
        
        const TestModel = mongoose.model('Test', testSchema);
        const testDoc = new TestModel({ message: '连接测试成功' });
        await testDoc.save();
        
        console.log('✅ 数据写入测试成功！');
        console.log('文档ID:', testDoc._id);
        
        await mongoose.disconnect();
        console.log('📴 连接已关闭');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 连接失败:');
        console.error('错误信息:', error.message);
        console.error('错误代码:', error.code);
        console.error('错误名称:', error.name);
        
        if (error.name === 'MongoServerSelectionError') {
            console.log('💡 建议: 检查网络连接和IP白名单设置');
        }
        
        process.exit(1);
    }
}

// 运行测试
testMongoDBConnection();
