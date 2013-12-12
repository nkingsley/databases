var mysql = require('mysql');
/* If the node mysql module is not found on your system, you may
 * need to do an "sudo npm install -g mysql". */

/* You'll need to fill the following out with your mysql username and password.
 * database: "chat" specifies that we're using the database called
 * "chat", which we created by running schema.sql.*/
var dbConnection = mysql.createConnection({
  user: "root",
  database: "chatserver"
});

dbConnection.connect();

/* Now you can make queries to the Mysql database using the
 * dbConnection.query() method.
 * See https://github.com/felixge/node-mysql for more details about
 * using this module.*/

/* You already know how to create an http server from the previous
 * assignment; you can re-use most of that code here. */
var http = require("http");
var url = require("url");
var fs = require("fs");
var requestHandler = require("./request-handler");
var port = 8081;
var ip = "127.0.0.1";

var rootHandler = requestHandler.rootHandler;
var messageHandler = requestHandler.handleRequest;


var router = {
  "/": rootHandler,
  "/classes/messages": messageHandler
};
var server = http.createServer(function(request, response) {
  var path = url.parse(request.url).pathname;
  var handler = router[path];

  if (handler) {
    handler(request, response);
  }
  else {
    var pathArr = path.split("/");
    if (pathArr[1] && pathArr[2] && pathArr[1] === 'classes'){
      requestHandler.handleRequest(request,response,pathArr[2]);
    } else {
      requestHandler.serveStaticAssets(request,response);
    }
  }
});

console.log("Listening on http://" + ip + ":" + port);

server.listen(port, ip);
exports.connection = dbConnection;