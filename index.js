const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Database = require('better-sqlite3')

const db = new Database('library.db')
db.pragma('foreign_keys = ON')

const JWT_SECRET = 'this-is-for-JWT'

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' },
    )
}

const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch {
        return null
    }
}

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
        return res.status(401).json({ message: 'Токен отсутствует' })
    }

    const user = verifyToken(token)
    if (!user) {
        return res.status(401).json({ message: 'Неверный токен' })
    }

    req.user = user
    next()
}
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Доступ запрещён: недостаточно прав' })
        }
        next()
    }
}

const app = express()

app.use(express.json())

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Заполните все поля' })
    }

    const hashedPassword = bcrypt.hashSync(password, 10)

    try {
        const result = db
            .prepare(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`)
            .run(username, email, hashedPassword)

        const user = db
            .prepare('SELECT id, username, email, role FROM users WHERE id = ?')
            .get(result.lastInsertRowid)

        res.status(201).json({
            message: 'Регистрация успешна',
            user,
            token: generateToken(user),
        })
    } catch (err) {
        res.status(400).json({ message: 'Email уже используется' })
    }
})