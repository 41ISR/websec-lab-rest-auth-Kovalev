const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");  

const db = new Database("library.db");
db.pragma('foreign_keys = ON');

db.exec(`
  DELETE FROM reviews;
  DELETE FROM books;
  DELETE FROM users;
`);

db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    year INTEGER NOT NULL,
    genre TEXT NOT NULL,
    description TEXT,
    createdBy INTEGER NOT NULL,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

const insertUser = db.prepare(`
  INSERT INTO users (email, username, password, role) 
  VALUES (?, ?, ?, ?)
`);

const hash = pwd => bcrypt.hashSync(pwd, 10);

let adminId, userId;

try {
  adminId = insertUser.run(
    'admin@library.com',
    'admin',
    hash('qwerty123'),
    'admin'
  ).lastInsertRowid;
} catch (e) {
  adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@library.com').id;
}

try {
  userId = insertUser.run(
    'user@library.com',
    'user',
    hash('qwerty123'),
    'user'
  ).lastInsertRowid;
} catch (e) {
  userId = db.prepare('SELECT id FROM users WHERE email = ?').get('user@library.com').id;
}

const insertBook = db.prepare(`
  INSERT INTO books (title, author, year, genre, description, createdBy)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const books = [
  ['1984', 'Джордж Оруэлл', 1949, 'Антиутопия', 'Классика о тоталитаризме и контроле над разумом.', adminId],
  ['Мастер и Маргарита', 'Михаил Булгаков', 1967, 'Фантастика', 'Мистический роман о дьяволе в Москве.', adminId],
  ['Преступление и наказание', 'Фёдор Достоевский', 1866, 'Психология', 'Глубокий анализ вины и искупления.', adminId],
  ['Гарри Поттер и философский камень', 'Дж. К. Роулинг', 1997, 'Фэнтези', 'Начало саги о юном волшебнике.', adminId],
  ['Война и мир', 'Лев Толстой', 1869, 'Исторический роман', 'Эпопея о судьбах людей на фоне войны 1812 года.', adminId]
];

const bookIds = [];
for (const book of books) {
  const result = insertBook.run(...book);
  bookIds.push(result.lastInsertRowid);
}

const insertReview = db.prepare(`
  INSERT INTO reviews (bookId, userId, rating, comment)
  VALUES (?, ?, ?, ?)
`);

const reviews = [
  [bookIds[0], adminId, 5, 'Книга, которая заставляет задуматься о свободе и власти. Обязательна к прочтению!'],
  [bookIds[1], adminId, 5, 'Шедевр! Смешение сатиры, мистики и философии. Булгаков — гений.'],
  [bookIds[2], adminId, 4, 'Тяжёлая, но невероятно глубокая психология. Раскрывает душу человека.'],
  [bookIds[3], adminId, 5, 'Идеальное начало саги. Магия, дружба, приключения — всё на высоте!'],
  [bookIds[4], adminId, 4, 'Масштаб поражает. Историческая достоверность + живые персонажи. Классика.']
];

for (const review of reviews) {
  insertReview.run(...review);
}

console.log("Тестовые данные успешно добавлены!");
console.log("Админ: email=admin@library.com, pass=qwerty123");
console.log("Пользователь: email=user@library.com, pass=qwerty123");
console.log(`Добавлено: 2 пользователя, 5 книг, 5 отзывов.`);

db.close();
module.exports = new Database("library.db");