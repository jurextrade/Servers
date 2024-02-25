let mysql = require('mysql');


let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mt4_progress_co'
});


connection.connect(function(err) {
    if (err) {
      return console.error('error: ' + err.message);
    }
  
    console.log('Connected to the MySQL server.');
});

connection.query('SELECT * FROM 0_users WHERE 1', function (error, results, fields) {
    if (error)
        throw error;

    console.log(results);
});


connection.end(function(err) {
    if (err) {
        return console.log('error:' + err.message);
    }
    console.log('Close the database connection.');
    });
    
    
    // To force the connection close immediately, you can use the destroy() method. 
    // The destroy() method guarantees that no more callbacks or events will be triggered for the connection.

    //connection.destroy();