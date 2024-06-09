const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const https = require('https');

const app = express();

// middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

// session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// view engine
app.set('view engine', 'ejs');

// database connection
const dbURI = 'mongodb+srv://new1:test12345@cluster1.ve6i4ky.mongodb.net/node-auth?retryWrites=true&w=majority';
mongoose.connect(dbURI)
    .then((result) => app.listen(3001))
    .catch((err) => console.log(err));

// middleware to set user data to res.locals
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    next();
});

// Функція для отримання курсу долара
function getExchangeRate(callback) {
    const url = 'https://api.nbp.pl/api/exchangerates/rates/A/USD/?format=json';

    https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            const jsonData = JSON.parse(data);
            const exchangeRate = jsonData.rates[0].mid;
            callback(exchangeRate);
        });
    }).on('error', (error) => {
        console.error('Помилка запиту:', error.message);
        callback(null);
    });
}

// routes
// Додаємо маршрут для отримання курсу долара перед authRoutes
app.get('/exchange-rate', requireAuth, (req, res) => {
    getExchangeRate((rate) => {
        if (rate) {
            res.render('exchange-rate', { exchangeRate: rate, user: req.session.user });
        } else {
            res.status(500).send('Не вдалося отримати курс долара');
        }
    });
});
app.get('*', checkUser);
app.get('/', (req, res) => res.render('home'));
app.get('/crypto', requireAuth, (req, res) => res.render('crypto'));
app.use(authRoutes);