let SERVER_PORT = 3333;
let SERVER_HOST = 'localhost';

let PORT = 33334;

let readline = require('readline');
let dgram = require('dgram');
let client = dgram.createSocket('udp4');
client.bind(PORT);

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let sendMessage = (message) => {
    client.send(message, 0, message.length, SERVER_PORT, SERVER_HOST, function (err, bytes) {
        if (err) throw err;
        console.log('UDP message sent to ' + SERVER_HOST + ':' + SERVER_PORT);
        console.log("Type a message to send (press 'q' to quit, press 'return' to send): ");
    });
};

console.log("Type a message to send (press 'q' to quit, press 'return' to send): ");

rl.on("line", async function (answer) {
    if (answer === "q") {
        rl.close();
        exit().then(function () {
            process.exit(0);
        });
        return;
    }
    console.log("Sending message: ", answer);
    try {
        await sendMessage(answer);
    } catch (e) {
        console.error("An error occurred while sending message.", e);
        console.log("Type a message to send (press 'q' to quit, press 'return' to send): ");
    }
});

async function exit() {
    console.log("Closing UDP port...");
    await client.close(() => {
        console.log("UDP port closed...exiting.")
    });
}

process.on("SIGINT", function () {
    exit().then(function () {
        process.exit(0);
    });
});
