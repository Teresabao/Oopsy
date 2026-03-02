


# 🔄 恢复备份说明

## 恢复内存存储版本
```bash
# 进入项目目录
cd ~/Desktop/myfirstapp/quizlet-clone

# 恢复核心文件
cp backup/memory-storage/app.ts src/
cp backup/memory-storage/index.ts src/routes/

# 重启服务器
npm start




# Mongodb 密码
# k0wAaDX4jMY2ggCA

MONGODB_URI=mongodb+srv://pte-assist:k0wAaDX4jMY2ggCA@cluster0.uysipp5.mongodb.net/teresa-pte?retryWrites=true&w=majority&appName=Cluster0


# 如何用 git 备份==========================================在终端输入指令
# 添加所有修改的文件
git add .

# 提交更改（写清楚修改内容）
git commit -m "添加用户登录功能"

# 推送到GitHub
git push