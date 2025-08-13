// api/polls.js
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// 从环境变量读取 Firebase 服务账号（JSON 格式字符串）
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

// 初始化 Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Vercel API 路由入口
export default async function handler(req, res) {
  // 允许跨域访问（方便前端调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      // 获取所有投票
      const snapshot = await db.collection('polls')
        .orderBy('createdAt', 'desc')
        .get();
      const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(polls);
    }

    if (req.method === 'POST') {
      // 新增投票
      const { question, choices } = req.body;
      await db.collection('polls').add({
        question,
        choices: (choices || []).map(t => ({ text: t, votes: 0 })),
        createdAt: new Date()
      });
      return res.status(200).json({ success: true });
    }

    // 其他方法不支持
    res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
}
