const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const DB_FILE = './db.json';

// Инициализация базы данных
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
    }));
}

function readDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE));
    } catch (e) {
        return { users: [], projects: [], tasks: [], project_members: [], reports: [], messages: [] };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ============================================================
// АВТОРИЗАЦИЯ
// ============================================================

app.post('/login', (req, res) => {
    const { login, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.login === login && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }
    res.json({ success: true, user: { id: user.id, login: user.login, name: user.full_name, role: user.role } });
});

// ============================================================
// API ДЛЯ ОБЪЕКТОВ (PROJECTS)
// ============================================================

app.get('/api/projects', (req, res) => {
    const db = readDB();
    res.json(db.projects);
});

app.post('/api/projects', (req, res) => {
    const db = readDB();
    const newProject = {
        id: Date.now(),
        ...req.body,
        created_at: new Date().toISOString()
    };
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
// API ДЛЯ СОТРУДНИКОВ (USERS)
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

app.put('/api/users/:id', (req, res) => {
    const db = readDB();
    const index = db.users.findIndex(u => u.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Не найдено' });
    db.users[index] = { ...db.users[index], ...req.body };
    writeDB(db);
    res.json(db.users[index]);
});

app.delete('/api/users/:id', (req, res) => {
    const db = readDB();
    db.users = db.users.filter(u => u.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ============================================================
// API ДЛЯ ЗАДАЧ (TASKS)
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

app.put('/api/tasks/:id', (req, res) => {
    const db = readDB();
    const index = db.tasks.findIndex(t => t.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Не найдено' });
    db.tasks[index] = { ...db.tasks[index], ...req.body };
    writeDB(db);
    res.json(db.tasks[index]);
});

app.delete('/api/tasks/:id', (req, res) => {
    const db = readDB();
    db.tasks = db.tasks.filter(t => t.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ============================================================
// API ДЛЯ УЧАСТНИКОВ ПРОЕКТОВ (PROJECT_MEMBERS)
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

app.delete('/api/project_members/:id', (req, res) => {
    const db = readDB();
    db.project_members = db.project_members.filter(m => m.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ============================================================
// API ДЛЯ ОТЧЁТОВ (REPORTS)
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

app.put('/api/reports/:id', (req, res) => {
    const db = readDB();
    const index = db.reports.findIndex(r => r.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Не найдено' });
    db.reports[index] = { ...db.reports[index], ...req.body };
    writeDB(db);
    res.json(db.reports[index]);
});

app.delete('/api/reports/:id', (req, res) => {
    const db = readDB();
    db.reports = db.reports.filter(r => r.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ============================================================
// API ДЛЯ СООБЩЕНИЙ (MESSAGES)
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

app.put('/api/messages/:id', (req, res) => {
    const db = readDB();
    const index = db.messages.findIndex(m => m.id == req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Не найдено' });
    db.messages[index] = { ...db.messages[index], ...req.body };
    writeDB(db);
    res.json(db.messages[index]);
});

app.delete('/api/messages/:id', (req, res) => {
    const db = readDB();
    db.messages = db.messages.filter(m => m.id != req.params.id);
    writeDB(db);
    res.json({ success: true });
});

// ============================================================
// СТАТИКА И ЗАПУСК
// ============================================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});
