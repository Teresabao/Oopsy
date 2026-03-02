import { MongoClient, Db } from 'mongodb';

// 数据库连接字符串
const MONGODB_URI = 'mongodb://localhost:27017';
// 数据库名称
const DB_NAME = 'quizlet-clone';

let db: Db;
let client: MongoClient;

// 初始化数据库连接
export async function initDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('数据库连接成功');
  }
  return db;
}

// 获取数据库实例
export function getDb(): Db {
  if (!db) {
    throw new Error('数据库尚未初始化，请先调用 initDb()');
  }
  return db;
}

// 获取集合的辅助函数
export async function getMongoCollection(collectionName: string) {
  await initDb();
  return getDb().collection(collectionName);
}
