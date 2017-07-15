// Config Environment
global.__DEV__ = process.env.NODE_ENV !== 'production';
if (global.__DEV__) { require('dotenv').config(); }

const express = require('express');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, 'public');
const VIEW_DIRECTORY = path.resolve(__dirname, 'views');

const app = express();

// Serve static files
app.use(express.static(PUBLIC_DIR));

// Set up views
app.set('views', VIEW_DIRECTORY);
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res, next) => {
	res.render('login.ejs', {env: process.env});
});
app.get('/login-success', (req, res, next) => {
	res.render('login-success.ejs', {env: process.env});
});
app.get('/download', (req, res, next) => {
	res.render('download.ejs', {env: process.env});
});

// Listen to outside world
app.listen(process.env.PORT, function() {
	console.log(`express: listening on localhost:${process.env.PORT}`);
});