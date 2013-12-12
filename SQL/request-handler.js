var fs = require('fs');
var _ = require('underscore')._;
var mysql = require('mysql');
var path = require("path");
var url = require('url');
var qs = require('querystring');
// var db = require('./persistent_server').connection;
var extHeader = {
  ".css" : "text/css",
  ".js" : "text/javascript",
  ".html" : "text/html"
};
var headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10, // Seconds.
  'Content-Type': "application/json"
};
var db = mysql.createConnection({
  user: "root",
  database: "chatserver"
});

db.connect();

var dummyMessage = {
  'username': 'batman',  // gets username from url
  'text': 'Pow',
  'roomname': 'lobby'
};
// TODO: move message store to a file
var messageStore = 'chats.txt';
var messages = [];
var objectId = 1000;

var addMeta = function(chat) {
  chat.createdAt = new Date();
  return chat;
};

var addRoom = function(room,userId){
  db.query('INSERT into chatserver.rooms (name) values(' + db.escape(room) + ')', function(err, data) {
    var roomId = data.insertId;
    if (userId){
      //writechattodb
    } else {
      //adduser
    }
  });
};

var checkAddUser = function(res,user,body){
  db.query('SELECT * from chatserver.users where name = ' + db.escape(user) , function(err,data){
    if (Array.isArray(data) && data[0]) {
      var userId = data[0].id;
      res.writeHead(200, {'Content-Type':'text/html'});
      res.end(body + '<script>var userID = ' + userId + '</script></body></html>');
    } else {
      db.query('INSERT into chatserver.users (name) values(' + db.escape(user) + ')', function(err,data){
        if (err){
          console.log(err);
        }
        var userId = data.insertId;
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(body + '<script>var userID = ' + userId + ';</script></body></html>');
      });
    }
  });
};

var writeChatsToDb = function(chats) {
  db.query('INSERT into chatserver.messages (text,userID) values(' + db.escape(chats.text) + ',' + Number(chats.id) + ')' , function(err,data){
  });
};

var readChatsFromDB = function(filename) {
  db.query('SELECT * FROM chatserver.messages a, chatserver.users b WHERE a.userID = b.id', function(err,data){
    for (var i = 0 ; i < data.length ; i++){
      var msg = data[i];
      messages.push({
        username: msg.name,
        text: msg.text,
        roomname: "foo",
        id : msg.id
      });
      console.log(messages);
    }
  });
};

var roomnameFilter = function(roomToFilter) {
  return _.where(messages, {roomname: roomToFilter});
};

var sendResponse = function(response, obj, status) {
  status = status || 200;
  response.writeHead(status, headers);
  console.log(obj);
  response.end(JSON.stringify(obj));
};

var returnMessages = function(request, response) {
  var paths = request.url.slice(1).split('/');
  var filteredMessages = messages.filter(function(msg) {
    return msg.id > paths[2];
  });
  if (paths[0] === 'classes' && paths[1] === 'messages') {
    sendResponse(response, { results: filteredMessages });
  } else if(paths[0] === 'classes' && paths[1] !=='messages') {
    sendResponse(response, { results: roomnameFilter(paths[1]) });
  } else {
    sendResponse(response, null, 404);
  }
};

// Save received chat messages into storage
var saveMessages = function(request, response){
  var chat = "";
  var properChat = null;

  request.setEncoding('utf8');
  request.on('data', function(chunk) {
    chat += chunk;
  });
  request.on('end', function() {
    properChat = addMeta(JSON.parse(chat));
    messages.push(properChat);
    addRoom('room1');
    writeChatsToDb(properChat);
    sendResponse(response, "", 201);
  });
};

var respondToOptions = function(request, response) {
  sendResponse(response, null);
};

var actionList = {
  'GET': returnMessages,
  'POST': saveMessages,
  'OPTIONS': respondToOptions
};

// Initialize messages array from the messageStore ('chats.txt')
// ============================================================================
var updateMessages = function() {
  //emitter.on('chatsReady', function() {
    debugger;
};
readChatsFromDB();
// updateMessages();

// Request Handler
// ============================================================================
exports.handleRequest = function(request, response,msgID) {
  console.log("Serving request type " + request.method + " for url " + request.url);
  actionList[request.method](request, response, msgID);
};
exports.rootHandler = function(request, response) {
  console.log("will serve index.html soon");
  fs.readFile("./client/index.html", function(err, data) {
    var username = url.parse(request.url).query;
    username = qs.parse(username).username;
    if (username) {
      checkAddUser(response,username,data);
    } else {
      response.writeHead(200, {'Content-Type':'text/html'});
      response.end(data);
    }
  });
};

exports.serveStaticAssets = function (request,response){
  var ext = extHeader[path.extname(request.url)];
  var fileName = request.url;
  fs.readFile("./client" + fileName , function(err, data) {
  if (err) { 
  response.writeHead(404, {'Content-Type': "text/html" });
  response.end("NOT HERE!");
  }
  response.writeHead(200, {'Content-Type': ext });
  response.end(data);
});
};
