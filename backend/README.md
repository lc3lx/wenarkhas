# Wen Arkhas - Backend

الواجهة الخلفية لتطبيق "ون أرخص" لمقارنة الأسعار بين المتاجر.

## المتطلبات الأساسية

- Node.js (الإصدار 14 أو أحدث)
- npm (يأتي مع Node.js)
- MongoDB (الإصدار 4.4 أو أحدث)
- Firebase Project (لخدمة الإشعارات الدفعية)

## إعداد المشروع

1. استنساخ المستودع:
   ```bash
   git clone [رابط المستودع]
   cd backend
   ```

2. تثبيت التبعيات:
   ```bash
   npm install
   ```

3. إعداد ملف البيئة:
   ```bash
   cp .env.example .env
   ```
   ثم قم بتعديل ملف `.env` بإضافة القيم المناسبة.

4. إعداد Firebase:
   - أنشئ مشروعًا جديدًا في [وحدة تحكم Firebase](https://console.firebase.google.com/)
   - انتقل إلى Project Settings > Service Accounts
   - انقر على "Generate New Private Key" واحفظ الملف في `config/firebase-service-account.json`

## تشغيل التطبيق

- وضع التطوير (مع إعادة التحميل التلقائي):
  ```bash
  npm run dev
  ```

- وضع الإنتاج:
  ```bash
  npm start
  ```

## الوثائق

- وثائق API: `http://localhost:8000/api-docs` (بعد تشغيل الخادم)
- قواعد البيانات: MongoDB
- المصادقة: JWT

## هيكل المجلدات

```
backend/
├── config/               # ملفات الإعدادات
├── controller/           # متحكمات API
├── middlewares/          # وسائط Express
├── models/               # نماذج MongoDB
├── routes/               # تعريفات المسارات
├── services/             # خدمات الأعمال
├── utils/                # أدوات مساعدة
├── .env                  # متغيرات البيئة
├── .env.example          # مثال على متغيرات البيئة
├── server.js             # نقطة الدخول للتطبيق
└── package.json          # تبعيات المشروع
```

## المتغيرات البيئية

راجع ملف `.env.example` للحصول على قائمة كاملة بالمتغيرات البيئية المطلوبة.

## الترخيص

هذا المشروع مرخص بموجب [MIT License](LICENSE).
