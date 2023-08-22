const express = require('express');
const expressApp = express();
const server = require('http').createServer(expressApp);
const Realm = require("realm");
require('dotenv').config();

global.app = new Realm.App({ id: process.env.APP_ID });
//Realm.App.Sync.setLogLevel(realmApp, 'trace');

global.myRealm;

global.io = require('socket.io')(server, {
	cors: {
		origin: '*'
	}
});
const cors = require('cors');

// Middleware
expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(express.urlencoded({extended: true}));

const contacts = require('./routes/contacts');
expressApp.use('/contacts', cors(), contacts.router);
const users = require('./routes/users');
expressApp.use('/users', cors(), users);

expressApp.get("/", cors(), function (req, res) {
	res.send("Contacts API");
});

// Sockets
io.on('connection', (socket) => {
	global.socket = socket;
	console.log('a client is connected');
});

// Main app
server.listen(process.env.PORT, function () {
	console.log(`app listening on port ${process.env.PORT}`);
});