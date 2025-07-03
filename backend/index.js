const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/api', (req, res) => {
  res.json({ message: 'مرحباً بك في واجهة برمجة التطبيقات' });
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
