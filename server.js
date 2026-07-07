const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Добавляем задержку 5 секунд перед запуском сервера
setTimeout(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('✅ Сервер запущен на порту ' + PORT);
    });
}, 5000);
