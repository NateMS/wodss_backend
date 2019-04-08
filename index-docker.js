// Main starting point of the application

const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const route = require('./routes');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

//DB Setup
mongoose.connect('mongodb://mongodb/wodss', { useNewUrlParser: true, useCreateIndex: true });


// App Setup
app.use(morgan('combined'));
app.use(cors());
app.use(bodyParser.json({type: '*/*'}));
app.use(bodyParser.urlencoded({ extended: true }));
route(app);

//Server Setup

const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port);

console.log('WODSS-MERN is listening on Port', port);
