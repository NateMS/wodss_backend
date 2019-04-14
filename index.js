// Main starting point of the application

require('dotenv').config();
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const route = require('./routes');
const adminSeeder = require('./services/defaultAdminSeeder');

const app = express();

//DB Setup
const db_host = process.env.DB_HOST || 'localhost';
const db_name = process.env.DB_NAME || 'wodss';
mongoose.connect('mongodb://'+db_host+'/'+db_name, { useNewUrlParser: true, useCreateIndex: true });

// App Setup
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json({type: '*/*'}));
app.use(bodyParser.urlencoded({ extended: true }));
route(app);

// Seeding
adminSeeder.seed();

//Server Setup

const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port);

console.log('WODSS-MERN is listening on Port', port);

