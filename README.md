# مشروع ونار خاص

مشروع ويب كامل يتكون من واجهة أمامية (Frontend) وخلفية (Backend).

## هيكل المشروع

- `/frontend` - تطبيق React.js للواجهة الأمامية
- `/backend` - خادم Node.js مع Express للواجهة البرمجية

## متطلبات التشغيل

- Node.js 16.x أو أحدث
- npm 8.x أو أحدث

## طريقة التشغيل

### تشغيل الخادم (Backend)

```bash
cd backend
npm install
npm start
```

### تشغيل الواجهة الأمامية (Frontend)

```bash
cd frontend
npm install
npm start
```

## المتغيرات البيئية

قم بإنشاء ملف `.env` في مجلد `backend` وأضف المتغيرات التالية:

```
PORT=5000
```
