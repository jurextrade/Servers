let net    = require('net');
let http   = require('http');
let https  = require('https');
let socket = require('socket.io');
let fs     = require('fs');

let XMLHttpRequest, moment;

try {
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}
catch(error) {
    console.log(error)
    require('child_process').execSync('npm install xmlhttprequest')
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
}

try {
    moment = require("moment");
}
catch(error) {
    console.log(error)
    require('child_process').execSync('npm install moment')
    moment = require("moment");    
}

//var fs = require('fs');

const TERMINAL         = "TERMINAL";
const CARD             = "CARD";
const ROUTER           = "ROUTER";


var ServerName         = "jurextrade.com"; 
var FTPUserName        = "uk4ibca5";   				//Your username for a ftp session
var FTPPassword        = "]!42fksf14)]";            //Your password for a ftp session
var FTPPort            = 21;
var FTPRootPath 	   = "/public_html/members/"; //"/public_html/members/";


var EMVServerAdress   = '127.0.0.1';
var EMVPort           = 2008;

var HTTPPort          = 5080;
var SHTTPPort         = 5443;

var CardsPort         = 3007;
var TerminalPort      = 3008;


// EMV Server listening on 2000;      // connection from Card Client
// Router Server listening on 3007;   // connection from Card Client
// Router Server listening on 542;    // connection from Web  Client


function emvconnection () {
    this.Socket 		= null;
    this.Connected 		= false;
}

function cardClient (userid, userservername, username, userpassword) {
	this.UserID 		= userid;
    this.UserName       = username;
    this.UserPassword   = userpassword;
    this.UserServerName = userservername;
    this.Socket 		= null;
    this.Connected 		= false;
    this.InitRequest 	= null;
    this.EmvConnection  = new emvconnection();
}

function webClient (userid, socket) {
    this.UserID 		= userid;
    this.Socket 	    = socket;
	this.CanSend 		= true;	
}

function emvServer () {
    this.Socket 		= null;
    this.Connected 		= false;
}


function Print (sdisplay) {
    const today = moment();
    console.log(today.format('YYYY-MM-DD hh:mm:ss') + " " + sdisplay);
}

NS = new nodeserver(CardsPort, TerminalPort, HTTPPort, SHTTPPort);

function nodeserver (cardsport, terminalport, httpport, shttpport) {
    this.emvServer   = new emvServer;

    this.cardClients = [];
    this.webClients  = [];
    
	this.GetCardClientFromEmvSocket = function (socket) {
        for (i = 0; i < this.cardClients.length; i++) {
            if (this.cardClients[i].EmvConnection.Socket == socket)
                return this.cardClients[i];
        }
        return null;
    }

	this.GetCardClientFromSocket = function (socket) {
        for (i = 0; i < this.cardClients.length; i++) {
            if (this.cardClients[i].Socket == socket)
                return this.cardClients[i];
        }
        return null;
    }

    this.GetWebClientFromSocket = function (socket) {
        for (i = 0; i < this.webClients.length; i++) {
            if (this.webClients[i].Socket == socket)
                return this.webClients[i];
        }
        return null;
    }	
    this.GetCardClientFromUserId = function (userid) {  // First cardClient
        for (i = 0; i < this.cardClients.length; i++) {
            if (this.cardClients[i].UserID == userid)
                return this.cardClients[i];
        }
        return null;
    }
    this.GetCardClientFromUser = function (servername, username, password) {  // First cardClient
        for (i = 0; i < this.cardClients.length; i++) {
            if (this.cardClients[i].Connected       == true &&
                this.cardClients[i].UserServerName  == servername &&
                this.cardClients[i].UserName        == username &&
                this.cardClients[i].UserPassword    == password)
                return this.cardClients[i];
        }
        return null;
    }    
	this.SendToWebClient = function (cardclient, origin, message, toall) {                      
		for (i = 0; i < NS.webClients.length; i++) {
//            console.log (NS.webClients.length);
			if (NS.webClients[i].Socket.connected &&  
				(NS.webClients[i].UserID == cardclient.UserID  || cardclient.UserID == 1 && NS.webClients[i].UserID == 0)) {
				if (toall == 1 || NS.webClients[i].CanSend){
					NS.webClients[i].Socket.emit('message', ":" + origin + "*" + message);	
                }
			}
		}
	}	
    this.SendToAllWebClients = function (origin, message) {
		for (i = 0; i < NS.webClients.length; i++) {
    		NS.webClients[i].Socket.emit('message', ":" + origin + "*" + message);	
        }
	}
	
    this.EmitToWebClient = function (socket, message) {
		if (socket)
			socket.emit('message', message);
	}
	this.EmitToCardClient = function (socket, message) {
		if (socket)
			socket.emit('message', message);
	}
    ListenTerminal(terminalport);
    ListenCards(cardsport);
	ListenHTTP(httpport);	
	ListenHTTP(shttpport);	    
};

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

		Print('<==== HTTP CONNECTION : ' + socket.handshake.address);

        if (NS.emvServer.Connected  == true) {
            NS.EmitToWebClient(socket, ":TERMINAL**CONNECT^EMVSERVER^1*")
        } else {
            NS.EmitToWebClient(socket, ":TERMINAL**CONNECT^EMVSERVER^0*")
        }

		NS.webClients.push(new webClient(0, socket));

		for (var i = NS.webClients.length - 1; i >= 0; i--) {
			if (NS.webClients[i].Socket.disconnected) {
				NS.webClients.splice(i, 1);
			}
		}

		socket.on('message', function (message) {

			var client = NS.GetWebClientFromSocket (socket);
			if (!client) return;

			var values = message.split('*');
// LOGIN 			
			if (values[1] == "LOGIN") {
				var userid   = values[0];

				client.UserID  = userid;
				
				Print('<====  HTTP LOGIN : [' + userid + ']');			
				let foundconnection = false;

				for (var i = 0; i < NS.cardClients.length; i++) {

					if  (NS.cardClients[i].UserID == userid || (userid == 0 && NS.cardClients[i].UserID == 1)) {
						if (NS.cardClients[i].Connected) {
					//		client.CanSend = false;  // need to ask me to send again
							Print('====>  HTTP LOGIN : [' + userid + ']'  + 'A CLIENT IS RUNNING for userid ' + NS.cardClients[i].UserID);
							NS.EmitToWebClient(socket, ":CARD**LOGIN^" + "OK^" +"*");  
							foundconnection = true;
						}
					}
				}
				if (!foundconnection) {
					NS.EmitToWebClient(socket, ":CARD**LOGIN^" + "KO*");  
					Print('====>  HTTP LOGIN : [' + userid + ']'  + ' NO CLIENT IS RUNNING FOR userid ' + userid);
				}
			}	
			else
            
// START 			
			if (values[1] == "START") {
				var userid   		= values[0];
				var start 			= +values[2];
		
				client.UserID = userid;
				
				Print('<====  HTTP START : [' + userid + '] Start : ' +start);			
				var foundconnection = false;
				for (var i = 0; i < NS.cardClients.length; i++) {
					if  (NS.cardClients[i].UserID == userid || (userid == 0 && NS.cardClients[i].UserID == 1)) {
						if (NS.cardClients[i].Connected) {
				            Print('====>  HTTP START : [' + userid + ']' + 'Start : ' + start);			
							client.CanSend = (start == 0 ? false : true);
							if (client.CanSend == true)
								NS.EmitToWebClient(socket, ":CARD**READER^" + "CARD READER RUNNING*");	
							foundconnection = true;	
						}
					}
				}
				if (!foundconnection) {
					Print('====>  HTTP START : [' + userid + '] Nothing found to start');
				}
				
			}
			else {			
				var userid = values[0];
				var command = values[2];

                Print('recu message de HTTP : ' + userid + ' ' + command);
				let cardclient = NS.GetCardClientFromUserId(userid);
			
                if (cardclient == null) return;
				if (cardclient.Connected == false) return;

                Print('envoi message : ' + userid + ' ' + command);
				EmitToCardClient(cardclient.Socket, '*' + command + '*');
			}
		});


		socket.on('close', function (data) {
			Print("CLOSE HTTP Patform connection closed");
			Print(HTTPsockets);
		});
		
	
		socket.on('disconnect',
            (reason) => {
		
				Print (" DISCONNECT HTTP Socket : " + socket.handshake.address + " Reason : " + reason);   
				for (var i = NS.webClients.length - 1; i >= 0; i--) {
					if (NS.webClients[i].Socket.disconnected) {
						NS.webClients.splice(i, 1);
					}
				}
				
				if (reason === 'io server disconnect') {
                }
            });	
		socket.on('error',
			function(data) {
				Print (" CLOSED HTTP Socket on Error : " + socket.handshake.address );    			
			});		
    });
    Print("HTTP listening on port " + port);
    server.listen(port);
}


function ListenCards (port) {
    var server = net.createServer( function (socket) {
		socket.on('data', function (data) {

			var cardclient 	= NS.GetCardClientFromSocket(socket);
			var message 	= String.fromCharCode.apply(null, data);

			if (cardclient && cardclient.InitRequest != null) {
				NS.SendToWebClient(cardclient, CARD, message);
				return;
			}
		
			var lines = message.split('*'); 
			for (var j = 0; j < lines.length; j++) {
				if (lines[j] == '.') continue;
				if (lines[j].length  < 1 ) continue;

				var values = lines[j].split('^');

				if (values[0] == "LOGIN") {
					var servername 		= values[1];
                    var username 		= values[2];
					var password 		= values[3];

					Print("Recu Message Login from Card Client: " + servername + ' , ' + username + ' , ' + password);
					
					result = VerifyUser (socket, port, servername, username, password);
					return;
				}


				if (!cardclient) 
					return;
				
				if (values[0] == "INIT") {
					var symbol = values[1];
					cardclient.InitRequest = ":" + symbol +  "**" + lines[j] + "*";
					Print("Send To client New Init "); 	
				}
			}
			NS.SendToWebClient(cardclient, CARD, message);					
		});

		socket.on('close', function (data) {
			var cardclient = NS.GetCardClientFromSocket(socket);
			if (!cardclient) return;
			NS.SendToWebClient(cardclient, CARD, "*CONNECT^" + cardclient.UserID +"^0*", 1);			
			cardclient.Connected    = false;
			cardclient.Socket       = null;
			cardclient.InitRequest  = null;			
            Print("Customer connection closed " + cardclient.UserID + "                         <============= Customer CLOSED");            

		});


		socket.on('error', function (data) {
			var cardclient = NS.GetCardClientFromSocket(socket);
			if (!cardclient) return;
			NS.SendToWebClient(cardclient, CARD, "*CONNECT^" + cardclient.UserID +"^0*", 1);
			cardclient.Connected    = false;
			cardclient.Socket       = null;
			cardclient.InitRequest  = null;
            Print("Customer connection closed " + cardclient.UserID + "                         <============= Customer CLOSED");            
		});
	});
    server.on('connection', function (socket) {
        Print("Customer connection opened " + socket.remoteAddress + ':' + socket.remotePort + "     <============= Customer CONNECTED");
		for (var i = NS.cardClients.length - 1; i >= 0; i--) {
			if (NS.cardClients[i].Connected == false) {
				NS.cardClients.splice(i, 1);
			}
		}
    });
    Print("EMV Router For Cards listening on port " + port);
    server.listen(port);
}


function ListenTerminal (port) {
    let server = net.createServer( function (socket) {
		socket.on('data', function (data) {

			var message 	= String.fromCharCode.apply(null, data);
			
            var lines = message.split('*'); 
			for (var j = 0; j < lines.length; j++) {
				if (lines[j] == '.') continue;
				if (lines[j].length  < 1 ) continue;

				var values = lines[j].split('^');

				if (values[0] == "LOGIN") {
					var servername 		= values[1];
                    var username 		= values[2];
					var password 		= values[3];

					Print("Recu Message Login from EMV Server : " + servername + ' , ' + username + ' , ' + password);
                    
                    let cardclient = NS.GetCardClientFromUser (servername, username, password)                    
                    if (!cardclient) {
                        socket.write('-1')  
                        console.log ('get connection from EMVServer but can not find client !')
                       // NS.SendToWebClient(cardclient, TERMINAL, '*LOGIN^KO^*');      
                        return;       
                    }
                    console.log ('get connection from  EMVServer client id is : ' + cardclient.UserID)
					socket.write(cardclient.UserID);
                    NS.SendToWebClient(cardclient, TERMINAL, '*LOGIN^OK^*');      
                    NS.SendToWebClient(cardclient, TERMINAL, '*TRACE^' + cardclient.UserID + '^Hello ' + username +  '\n^*');      
					return;

				} 
                var userid = values[1];
                let cardclient = NS.GetCardClientFromUserId (userid);          
//                console.log ('User id : ' + userid + ' message is ' + message)
                if (cardclient) {
                    NS.SendToWebClient(cardclient, TERMINAL, message);
                    return;       
                }                              

			}
		});

		socket.on('close', function (data) {
            Print("Server connection opened " + socket.remoteAddress + ':' + socket.remotePort + "     <============= EMV Server CLOSED");        
            NS.emvServer.Connected    = false;
			NS.emvServer.Socket       = null;    
            NS.SendToAllWebClients(TERMINAL, "*CONNECT^EMVSERVER^0*")
		});


		socket.on('error', function (data) {
            Print("Server connection opened " + socket.remoteAddress + ':' + socket.remotePort + "     <============= EMV Server ERROR");      
            NS.emvServer.Connected    = false;
			NS.emvServer.Socket       = null;                                
            NS.SendToAllWebClients(TERMINAL, "*CONNECT^EMVSERVER^0*")
		});
	});
    server.on('connection', function (socket) {
        Print("Server connection opened " + socket.remoteAddress + ':' + socket.remotePort + "     <============= EMV Server Connected");
        NS.emvServer.Connected    = true;
        NS.emvServer.Socket       = socket;          
        NS.SendToAllWebClients(TERMINAL, "*CONNECT^EMVSERVER^1*")
    });

    Print("EMV Router For Terminals listening on port " + port); 
    server.listen(port);
    return server;
}


function ConnectToEmvServer () {

    let socket = net.createConnection ({port: EMVPort, host: EMVServerAdress}, function () {
        
        socket.on("data", (data) => {
            //console.log(`Received: ${data}`);
            let cardclient = NS.GetCardClientFromEmvSocket(socket)
            NS.SendToWebClient (cardclient, TERMINAL, data)
        });

        socket.on("error", (error) => {
            console.log(`Error: ${error.message}`);
        });

        socket.on("close", () => {
            console.log("Connection closed");
        })
    })
    console.log("Connected");
    return socket;

}

function VerifyUser (socket, port, servername, username, password) {
	
    var http = new XMLHttpRequest();

    var url = 'http://' + servername +'/wp-login1.php?action=checkemv&' + 
			  'user_login=' + username + 
			  '&user_password=' + password;

    http.open('POST', url, false);
    
    Print ('Sending request to ' + servername + ' to verify user :' + username + ' password : ' + password);
    
	http.onreadystatechange = function() {

	    if (http.readyState == 4 && http.status == 200) {
        
            Print("recu : *" + http.responseText + "*");
        
            let userid =  http.responseText;
            socket.write(userid)            
        
            if (userid == '0') 
                {
                    Print("Authentification Failed : " + userid);
                }
                else
                {
                    Print("Authentification Succeeded : " + userid);
                    let connection = NS.GetCardClientFromUserId(userid);
                    if (!connection) {
                        connection = new cardClient(userid, servername, username, password);
                        NS.cardClients.push(connection);
//                        connection.EmvConnection.Socket    = ConnectToEmvServer();        
//                        connection.EmvConnection.Connected = true;                
                    }
                    connection.Connected = true;
                    connection.Socket = socket;

                    NS.SendToWebClient(connection, CARD, "*CONNECT^" + connection.UserID +"^1*", 1);					
                }
            }
	}
    http.send(null);
}
