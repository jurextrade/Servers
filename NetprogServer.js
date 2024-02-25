let net    = require('net');
let http   = require('http');
let https  = require('https');
let socket = require('socket.io');
let fs     = require('fs');

var HTTPPort            = 4080;
var SHTTPPort           = 4443;


ListenHTTP(HTTPPort);	
ListenHTTP(SHTTPPort);	  

function ListenHTTP (port) {
	var server;
	var port;
	
	if (port == SHTTPPort) { //SSL
		server = https.createServer({key: fs.readFileSync('./server.key'), cert: fs.readFileSync('./server.crt')});
	}
	else {
		server = http.createServer();
	}

	var io = socket(server, {cors: {origin: '*', credentials: true}});

    io.on('connection', function (socket) {

		console.log('<==== HTTP CONNECTION : ' + socket.handshake.address);


		socket.on('message', function (message) {
            exec_command(socket, message);
		});


		socket.on('close', function (data) {
			console.log("CLOSE HTTP Patform connection closed");
		});
		
		socket.on('disconnect',
            (reason) => {
		
				console.log (" DISCONNECT HTTP Socket : " + socket.handshake.address + " Reason : " + reason);   
            });	
		socket.on('error',
			function(data) {
				console.log (" CLOSED HTTP Socket on Error : " + socket.handshake.address );    			
			});		
    });
    console.log("HTTP listening on port " + port);
    server.listen(port);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const childprocess = require('child_process'); 
const process = require('process');


function exec_command (socket, message) {
    var nodemessage = JSON.parse (message);
    try {
        nodemessage.return =  'ok: ' +  eval(nodemessage.command)
    } catch (error) {
        if (error instanceof SyntaxError) {
            nodemessage.return = 'SyntaxError: ' + error.message;
        } else 
        if (error instanceof ReferenceError) {
            nodemessage.return = 'ReferenceError: ' + error.message;
        } else 
        if (error instanceof RangeError) {
            nodemessage.return = 'RangeError: ' + error.message;
        } else 
        if (error instanceof TypeError) {
            nodemessage.return = 'TypeError: ' + error.message;
        } else 
        if (error instanceof URIError) {
            nodemessage.return = 'URIError: ' + error.message;
        } else 
        {
            nodemessage.return = 'Which Error!!  : ' + error.message;            
            //  throw error;
        }

    }
    socket.emit ('message', JSON.stringify (nodemessage, null, 2));   

 /*
  
    return childprocess.exec (message,  (err, stdout, stderr) => {
		if (err) {
			console.log('exec error!');
            socket.emit ('message', stderr)
			return 1;
		}
        socket.emit ('message', stdout)
		console.log ('exc ok!');	
		return 1;
	})
*/    
}

function exec_detach (socket, message) {
    
    let process = childprocess.spawn(message);
    let data = '';
    let error = '';

    process.stdout.on('data', stdout => {
        socket.emit ('message', stdout)
    });
    
    process.stderr.on('data', stderr => {
        socket.emit ('message', stderr)
    });

    process.on('error', err => {
      console.log(err);
    })
    
    process.on('close', code => {
        if (code !== 0) {
            console.log(error)
        } else {
            console.log(data)
        }
        process.stdin.end();
    });
}
