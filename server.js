const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const DB_FILE = './db.json';

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
        users: [
            { id: 1, login: 'RUK-0001', password: '1000', full_name: 'Руководитель', role: 'owner' }
        ],
        projects: [],
        tasks: [],
        project_members: [],
        reports: [],
        messages: []
    }));
}

function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.post('/login', (req, res) => {
    const { login, password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.login === login && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }
    res.json({ success: true, user: { id: user.id, login: user.login, name: user.full_name, role: user.role } });
});

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});
