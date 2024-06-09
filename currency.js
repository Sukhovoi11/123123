const express = require('express');
const https = require('https');
const ejs = require('ejs');
const fs = require('fs');

const app = express();

// Функция для выполнения запроса к API и обработки данных для евро
function getEuroExchangeRate(callback) {
    const url = 'https://api.nbp.pl/api/exchangerates/rates/A/EUR/?format=json';

    https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            const jsonData = JSON.parse(data);
            const euroRate = jsonData.rates[0].mid; // Получаем курс евро
            callback(null, euroRate);
        });
    }).on('error', (error) => {
        console.error('Ошибка запроса:', error.message);
        callback(error, null);
    });
}

// Функция для выполнения запроса к API и обработки данных для доллара
function getUsdExchangeRate(callback) {
    const url = 'https://api.exchangeratesapi.io/latest';

    https.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            const jsonData = JSON.parse(data);
            const usdRate = jsonData.rates.USD; // Получаем курс доллара
            callback(null, usdRate);
        });
    }).on('error', (error) => {
        console.error('Error:', error.message);
        callback(error, null);
    });
}

app.get('/exchange-rates', (req, res) => {
    // Получаем курс евро
    getEuroExchangeRate((error, euroRate) => {
        if (error) {
            console.error('Ошибка получения курса евро:', error);
            return;
        }

        // Получаем курс доллара
        getUsdExchangeRate((error, usdRate) => {
            if (error) {
                console.error('Error fetching exchange rates:', error);
                return;
            }

            fs.readFile('views/exchange-rates.ejs', 'utf8', (err, template) => {
                if (err) {
                    console.error('Error reading template:', err);
                    return;
                }

                // Рендеринг шаблона EJS с передачей курсов валют
                const renderedTemplate = ejs.render(template, { euroRate: euroRate, usdRate: usdRate });
                res.send(renderedTemplate);
            });
        });
    });
});
