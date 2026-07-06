const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// ✅ ВАЖНО: правильный порт для облака
const PORT = process.env.PORT || 3000;

// ============================================================
// НАСТРОЙКИ
// ============================================================

app.use(express.json());

// ✅ правильно раздаём папку public
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// БАЗА ДАННЫХ В ФАЙЛЕ
// ============================================================

const DB_FILE = './db.json';

// Инициализация базы
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
        users: [
            { id: 1, login: 'RUK-0001', password: '1234', full_name: 'Руководитель', role: 'owner' }
        ],
        projects: [],
        tasks: [],
        project_members: [],
        reports: [],
        messages: []
    }, null, 2));
}

function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
// LOGIN
// ============================================================

app.post('/login', (req, res) => {
    const { login, password } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.login === login && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            login: user.login,
            name: user.full_name,
            role: user.role
        }
    });
});

// ============================================================
// API
// ============================================================

app.get('/api/projects', (req, res) => {
    const db = readDB();
    res.json(db.projects);
});

app.post('/api/projects', (req, res) => {
    const db = readDB();
    const newProject = { id: Date.now(), ...req.body, created_at: new Date().toISOString() };
    db.projects.push(newProject);
    writeDB(db);
    res.json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
    const db = readDB();
    const index = db.projects.findIndex(p => p.id == req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Не найдено' });

    db.projects[index] = { ...db.projects[index], ...req.body };
    writeDB(db);

    res.json(db.projects[index]);
});

app.delete('/api/projects/:id', (req, res) => {
    const db = readDB();
    db.projects = db.projects.filter(p => p.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ============================================================
// USERS
// ============================================================

app.get('/api/users', (req, res) => {
    const db = readDB();
    res.json(db.users);
});

app.post('/api/users', (req, res) => {
    const db = readDB();
    const newUser = { id: Date.now(), ...req.body };
    db.users.push(newUser);
    writeDB(db);
    res.json(newUser);
});

// ============================================================
// TASKS
// ============================================================

app.get('/api/tasks', (req, res) => {
    const db = readDB();
    res.json(db.tasks);
});

app.post('/api/tasks', (req, res) => {
    const db = readDB();
    const newTask = { id: Date.now(), ...req.body };
    db.tasks.push(newTask);
    writeDB(db);
    res.json(newTask);
});

// ============================================================
// REPORTS
// ============================================================

app.get('/api/reports', (req, res) => {
    const db = readDB();
    res.json(db.reports);
});

app.post('/api/reports', (req, res) => {
    const db = readDB();
    const newReport = { id: Date.now(), ...req.body, created_at: new Date().toISOString() };
    db.reports.push(newReport);
    writeDB(db);
    res.json(newReport);
});

// ============================================================
// MESSAGES
// ============================================================

app.get('/api/messages', (req, res) => {
    const db = readDB();
    res.json(db.messages);
});

app.post('/api/messages', (req, res) => {
    const db = readDB();
    const newMessage = { id: Date.now(), ...req.body, created_at: new Date().toISOString() };
    db.messages.push(newMessage);
    writeDB(db);
    res.json(newMessage);
});

// ============================================================
// PROJECT MEMBERS
// ============================================================

app.get('/api/project_members', (req, res) => {
    const db = readDB();
    res.json(db.project_members);
});

app.post('/api/project_members', (req, res) => {
    const db = readDB();
    const newMember = { id: Date.now(), ...req.body };
    db.project_members.push(newMember);
    writeDB(db);
    res.json(newMember);
});

// ============================================================
// FRONTEND
// ============================================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server запущен на порту ${PORT}`);
    console.log(`📁 DB файл: ${DB_FILE}`);
});
