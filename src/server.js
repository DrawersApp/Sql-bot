var XMPP = require('stanza.io'); // https://github.com/otalk/stanza.io - xmpp library.
Sequelize = require('sequelize') // sql orm - http://docs.sequelizejs.com/en/latest/docs/getting-started/

var client = XMPP.createClient({
    // Username and password
    jid: 'harshit1@ejabberd.sandwitch.in',
    password: 'tractor',

    transport: 'websocket',
    wsURL: 'ws://ejabberd.sandwitch.in:5280/websocket'
    // (or `boshURL` if using 'bosh' as the transport)
});

//  Creating the orm object.
/*
 var sequelize = new Sequelize('database', 'username', 'password', {
 host: 'localhost',
 dialect: 'mysql'|'mariadb'|'sqlite'|'postgres'|'mssql',

 pool: {
 max: 5,
 min: 0,
 idle: 10000
 },

 // SQLite only
 storage: 'path/to/database.sqlite'
 });

 // Or you can simply use a connection uri
 var sequelize = new Sequelize('postgres://user:pass@example.com:5432/dbname');
 */

var sequelize = new Sequelize('crawled_date', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql', // For other dialects like postgres make changes in package.json - docs.sequelizejs.com/en/latest/docs/getting-started/
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
});

// Client is logged in callback.
// GetRoster - returns the friend list.
// sendpresence - indicates the other that I'm online.
client.on('session:started', function () {
    client.getRoster();
    client.sendPresence();
    console.log("Session started");
});

// Input message received callback.
client.on('chat', function (msg) {
    // Formatting select queries. Different formatting available for other types.
    if (msg.body.startsWith("select")) {
        selectQuery(msg)
    } else {
        query(msg)
    }
    console.log("Message received" + msg.from);
});

// Connecting.
client.connect();

// Useful for operations with no return values like update.
// Results will be an empty array and metadata will contain the number of affected rows.
function query(msg) {
    sequelize.query(msg.body).spread(function(results, metadata) {
        // Results will be an empty array and metadata will contain the number of affected rows.
        resultString = "result:" + JSON.stringify(results) + "\n" + "metadata" + JSON.stringify(metadata)
        sendMessage(resultString, msg)
    })
}

// In cases where you don't need to access the metadata you can pass in a query type to tell sequelize how to format the results.
// Full list of query types can be found here - https://github.com/sequelize/sequelize/blob/master/lib/query-types.js
function selectQuery(msg) {
    sequelize.query(msg.body, { type: sequelize.QueryTypes.SELECT})
        .then(function(users) {
            // We don't need spread here, since only the results will be returned for select queries
            sendMessage(JSON.stringify(users), msg)
        })

}

// reply back the message to sender.
function sendMessage(result, msg) {
    client.sendMessage({
        to: msg.from,
        type: 'chat',
        requestReceipt: true,
        id: client.nextId(),
        body: result,
        json:
        {
            subType: 'TEXT',
            message: result,
            timestamp: Date.now()
        }
    });
}
