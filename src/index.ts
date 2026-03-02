import * as dotenv from 'dotenv';
dotenv.config();

console.log('🚀 项目启动成功!');
console.log('环境变量 PORT:', process.env.PORT);
console.log('MongoDB URI:', process.env.MONGODB_URI ? '已设置' : '未设置');