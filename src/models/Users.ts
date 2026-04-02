// models/User.ts
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // 确保每个用户名都是独一无二的
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    dailyStudyLimit: {
        type: Number,
        default: 20
    },
    streakDays: {
        type: Number,
        default: 0
    },
    lastActiveDate: {
        type: String,
        default: ''
    }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);