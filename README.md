# 📡 قنواتي Server

## الرفع على Railway (مجاني) 🚀

### الخطوات:

**1. سجّل على Railway**
- روح [railway.app](https://railway.app)
- سجّل بحساب GitHub

**2. ارفع المشروع**
- اضغط "New Project"
- اختار "Deploy from GitHub repo"
- أو اختار "Deploy from local" وارفع المجلد ده

**3. خلّص!**
- Railway هيديك رابط زي: `https://qawaati-xxx.railway.app`
- الموقع هيشتغل على الرابط ده
- الـ proxy بيشتغل تلقائياً على نفس الرابط

---

## التشغيل محلياً

```bash
node server.js
```

الموقع هيفتح على: http://localhost:3000

---

## هيكل المشروع

```
qawaati-server/
├── server.js        ← السيرفر الرئيسي
├── package.json
├── railway.json     ← إعدادات Railway
└── public/
    └── index.html   ← الموقع
```

---

## إزاي بيشتغل

- `/` → الموقع
- `/proxy?url=https://...` → proxy البث تلقائياً
- `/status` → حالة السيرفر

الموقع بيكتشف رابط الـ proxy تلقائياً من نفس الدومين ✅
