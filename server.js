// ============================================================
// СтройCRM — сервер (окончательная версия)
// Отдаёт сайт (index.html) и безопасно общается с GigaChat
// ============================================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

// Отдаём файлы сайта из папки public
app.use(express.static(path.join(__dirname, 'public')));

// GigaChat использует сертификат Минцифры — отключаем строгую
// проверку сертификата, чтобы не требовался VPN или доп. настройка.
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

let cachedToken = null;
let tokenExpiresAt = 0;

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt - 30000) {
      return resolve(cachedToken);
    }

    const authKey = process.env.GIGACHAT_AUTH_KEY;
    if (!authKey) {
      return reject(new Error('Переменная GIGACHAT_AUTH_KEY не задана на сервере'));
    }

    const body = 'scope=GIGACHAT_API_PERS';
    const options = {
      hostname: 'ngw.devices.sberbank.ru',
      port: 9443,
      path: '/api/v2/oauth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': generateUUID(),
        'Authorization': `Basic ${authKey}`,
        'Content-Length': Buffer.byteLength(body)
      },
      agent: insecureAgent,
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.access_token) {
            return reject(new Error('GigaChat не вернул токен: ' + data));
          }
          cachedToken = json.access_token;
          tokenExpiresAt = json.expires_at ? json.expires_at * 1000 : now + 25 * 60 * 1000;
          resolve(cachedToken);
        } catch (e) {
          reject(new Error('Не удалось разобрать ответ токена: ' + data));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Таймаут запроса токена GigaChat')); });
    req.on('error', (e) => reject(new Error('Ошибка сети при запросе токена: ' + e.message)));
    req.write(body);
    req.end();
  });
}

function askGigaChat(token, messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'GigaChat',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const options = {
      hostname: 'gigachat.devices.sberbank.ru',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(body)
      },
      agent: insecureAgent,
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Не удалось разобрать ответ GigaChat: ' + data));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Таймаут запроса к GigaChat')); });
    req.on('error', (e) => reject(new Error('Ошибка сети при запросе к GigaChat: ' + e.message)));
    req.write(body);
    req.end();
  });
}

// Маршрут для кнопки "Спросить ИИ-помощника"
// (адрес совпадает с тем, что вызывает фронтенд в index.html)
app.post('/api/ai-proxy', async (req, res) => {
  try {
    const { system, messages } = req.body || {};

    const gigaMessages = [
      { role: 'system', content: system || '' },
      ...((messages || []).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      })))
    ];

    const token = await getAccessToken();
    const gigaData = await askGigaChat(token, gigaMessages);

    const answer =
      gigaData.choices?.[0]?.message?.content ||
      (gigaData.error && (gigaData.error.message || JSON.stringify(gigaData.error))) ||
      'GigaChat не дал ответа. Попробуйте ещё раз.';

    res.json({ answer });
  } catch (err) {
    console.error('Ошибка ИИ-помощника:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Проверочный маршрут — если открыть /api/health в браузере,
// сразу видно жив ли сервер и настроен ли ключ.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GIGACHAT_AUTH_KEY)
  });
});

// Все остальные запросы — отдаём главную страницу сайта
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер СтройCRM запущен на порту ${PORT}`);
});
