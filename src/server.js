var XMPP = require('stanza.io'); // if using browserify
Sequelize = require('sequelize')

var client = XMPP.createClient({
    jid: 'harshit1@ejabberd.sandwitch.in',
    password: 'tractor',

    // If you have a .well-known/host-meta.json file for your
    // domain, the connection transport config can be skipped.

    transport: 'websocket',
    wsURL: 'ws://ejabberd.sandwitch.in:5280/websocket'
    // (or `boshURL` if using 'bosh' as the transport)
});

var sequelize = new Sequelize('crawled_date', 'root', 'root', {
    host: 'localhost',
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
});

client.on('session:started', function () {
    client.getRoster();
    client.sendPresence();
    console.log("Session started");
});

client.on('chat', function (msg) {
    query(msg)
    console.log("Message received" + msg.from);
});

client.connect();

function query(msg) {
    sequelize.query(msg.body).spread(function(results, metadata) {
        // Results will be an empty array and metadata will contain the number of affected rows.
        resultString = "result:" + JSON.stringify(results) + "\n" + "metadata" + JSON.stringify(metadata)
        sendMessage(resultString, msg)
    })
}

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
