let net = require('net');


let server = net.createServer(function (socket) {
    
    socket.on('data', function (data) {
        var bread   = socket.bytesRead;
        var bwrite  = socket.bytesWritten;
       
        console.log('Bytes read : ' + bread);
        console.log('Bytes written : ' + bwrite);
        console.log('Data sent to server : ' + data);
      
        //echo data
        var is_kernel_buffer_full = socket.write('Data ::' + data);
       
        if(is_kernel_buffer_full){
          console.log('Data was flushed successfully from kernel buffer i.e written successfully!');
        }else{
          socket.pause();
        }
        console.log('--------------------------------------------')                   
    });

    socket.on('close', function (error) {
        var bread   = socket.bytesRead;
        var bwrite  = socket.bytesWritten;
    
        console.log('Bytes read : ' + bread);
        console.log('Bytes written : ' + bwrite);
        console.log('Socket closed!');
  
        if(error){
          console.log('Socket was closed coz of transmission error');
        }
        console.log('--------------------------------------------')           
    });

    socket.on('end',function(data){

        console.log('Socket ended from other end!');
        console.log('End data : ' + data);
        console.log('--------------------------------------------')             
    });
    
    socket.on('error', function (error) {
        console.log('Error : ' + error);
        console.log('--------------------------------------------')             
    });

    socket.on('drain',function(){
        console.log('*write buffer is empty now .. u can resume the writable stream');
        console.log('--------------------------------------------')             
        socket.resume();
    });
      
    socket.on('timeout',function(){
        console.log('Socket timed out !');
        socket.end('Timed out!');
        console.log('--------------------------------------------')             
    // can call socket.destroy() here too.
    });

});

server.on('connection', function (socket) {

    var address = this.address();
    var port    = address.port;
    var family  = address.family;
    var ipaddr  = address.address;

    console.log('Connected to server  on port : ' + port);
    console.log('--------------------------------------------')     
});

server.on('close', function(){
    console.log('Server closed !');
    console.log('--------------------------------------------')         
});
  
server.on('listening',function(socket){
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

server.listen(2222);