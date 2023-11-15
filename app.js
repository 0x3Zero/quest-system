var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();
const mongoose = require('mongoose');
const authenticate = require('./middlewares/authenticate');
var cors = require('cors');

mongoose.connect(process.env.MONGO_DB);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var questRouter = require('./routes/quest.route');
var campaignRouter = require('./routes/campaign.route');

var app = express();

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Quest System API',
      version: '1.0.0',
      description: 'API for managing quests, participants, and campaigns',
    },
    servers: [
      { url: 'http://localhost:3001' }, // Replace with your server URL
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/', authenticate, questRouter);
app.use('/campaigns', authenticate, campaignRouter);

module.exports = app;
