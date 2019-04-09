// Main starting point of the application

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const route = require('./routes');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const seeder = require('./seeder');

//DB Setup
mongoose.connect('mongodb://'+(process.env.DB_HOST || 'localhost')+'/'+(process.env.DB_NAME || 'wodss'), { useNewUrlParser: true, useCreateIndex: true });

// App Setup
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json({type: '*/*'}));
app.use(bodyParser.urlencoded({ extended: true }));
route(app);

//Seed
console.log('Seeding DB');
seeder.seedDB()
//Server Setup

const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port);

console.log('WODSS-MERN is listening on Port', port);


