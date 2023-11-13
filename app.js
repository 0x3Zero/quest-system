var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const mongoose = require('mongoose');
const authenticate = require('./middlewares/authenticate');

mongoose.connect(process.env.MONGO_DB);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var questRouter = require('./routes/Quest');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', authenticate, questRouter);

module.exports = app;
