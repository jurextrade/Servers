let http = require('http');


let server = http.createServer(function (req, res) {   //create web server
    console.log('Request received : ' + req.url);
    console.log('--------------------------------------------')      

    if (req.url == '/') { //check the URL of the current request
        
        // set response header
        res.writeHead(200, { 'Content-Type': 'text/html' }); 
        
        // set response content    
        res.write('<html><body><p>This is home Page.</p></body></html>');
        res.end();
    
    }
    else if (req.url == "/student") {
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>This is student Page.</p></body></html>');
        res.end();
    
    }
    else if (req.url == "/admin") {
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<html><body><p>This is admin Page.</p></body></html>');
        res.end();
    
    }
    else
        res.end('Invalid Request!');

});

server.on('connection', function (socket) {
    var address = this.address();
    var port    = address.port;
    var family  = address.family;
    var ipaddr  = address.address;

    console.log('Connected to server on port : ' + port);
    console.log('--------------------------------------------')    

});

server.on('close', function(){
    console.log('Server closed !');
    console.log('--------------------------------------------')         
});

server.on('listening', function(socket){
    console.log('Server is listening!');
    var address = this.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log('Server is listening at port :' + port);
    console.log('Server ip : ' + ipaddr);
    console.log('Server is IP4/IP6 : ' + family);
    console.log('--------------------------------------------')    
});

//////////////////////////////////////////////////////////////////////////////////////////////////////

let server1 = http.createServer();

let socket = require('socket.io');

let io = socket(server1, {cors: {
    origin: '*',
    credentials: true
    }
});

io.on('connection', function (socket) {

    
    var address = server1.address();
    var port    = address.port;
    var family  = address.family;
    var ipaddr  = address.address;

    console.log('**Connected to server  on port : ' + port);
    console.log('--------------------------------------------')    


    socket.on('message', function (message) {
        console.log ('socket message : ' + message);
        console.log('--------------------------------------------')    
    });

    socket.on('close', function (data) {
        console.log('socket close,  data : ' + data)
        console.log('--------------------------------------------')    
    });
        
    socket.on('disconnect',function (data) {
        console.log('socket disconnect, data : ' + data)
        console.log('--------------------------------------------')    
    });

    socket.on('error',	function(data) {
        console.log('socket error, data : ' + data)
        console.log('--------------------------------------------')    
    });	
        
});    


server1.on('connection', function (socket) {

    var address = this.address();
    var port    = address.port;
    var family  = address.family;
    var ipaddr  = address.address;

    console.log('Connected to server on port : ' + port);
    console.log('--------------------------------------------')    

});

server1.on('close', function(){
    console.log('Server closed !');
    console.log('--------------------------------------------')         
});

server1.on('listening', function(socket){
    console.log('Server is listening!');
    var address = this.address();
    var port = address.port;
    var family = address.family;
    var ipaddr = address.address;
    console.log('Server is listening at port :' + port);
    console.log('Server ip : ' + ipaddr);
    console.log('Server is IP4/IP6 : ' + family);
    console.log('--------------------------------------------')    
});

server1.on("request", function (req, res) {   //create web server
    console.log('Request received : ' + req.url);
    console.log('--------------------------------------------')        
})

server.listen(4000);
server1.listen(4001);