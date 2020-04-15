const ip = require('ip');
const dgram = require('dgram');

const { Kafka, CompressionTypes, logLevel } = require('kafkajs');

// const host = process.env.HOST_IP || ip.address();
const host = "localhost";
const UDP_PORT = 3333;

const kafka = new Kafka({
    logLevel: logLevel.INFO,
    clientId: 'his-kafka-producer-v1',
    brokers: [`${host}:9092`]
});
const producer = kafka.producer();

// UDP Server

let server = dgram.createSocket('udp4');

server.on('listening', function() {
    let address = server.address();
    console.log('UDP Server listening on ' + address.address + ':' + address.port);
});

server.bind(UDP_PORT, host);

const receivePacketUDP = (stream, remote) => {
    console.log('Message received from: ' + remote.address + ':' + remote.port +'; data: ' + stream);
    let jsonData = {};
    try {
        jsonData = JSON.parse(stream);
    } catch (exception) {
        console.error("invalid JSON data");
        // return error packet
        return
    }
    // acknowledge packet

    // send to Kafka
    sendMessage(jsonData);
}

//business logic

const sendMessage = (data) => {

    // process fields from UDP packet (move to sendMessage function?)
    // - determine topic
    // - determine key of kafka message
    // - remove any unnecessary fields
    // - forward rest of fields to value of kafka message

    // add server timestamp to payload [probably unnecessary bc Kafka stores a timestamp upon ingestion]
    data.server_timestamp = new Date().toISOString();

    let messageData = {};
    if (data.type == "telemetry") {
        messageData.topic = "pod_"+data.pod_id+"_telemetry"
    } else if (data.type == "status") {
        messageData.topic = "pod_statuses"
    } else {
        //error: unknown type
    }
    
    // set key to pod id
    messageData.key = data.pod_id;
    // delete pod id from payload?

    // send payload as json string [todo: send as object]
    messageData.value = JSON.stringify(data);

    return producer
        .send({
            topic: messageData.topic,
            compression: CompressionTypes.GZIP,
            acks: 1,
            messages: [{
                key: messageData.key,
                value: messageData.value
            }],
        })
        .then(console.log)
        .catch(e => console.error(`[his-kafka-producer-v1] ${e.message}`, e));
}

// const createMessage = message => ({
//     key: `key-${getRandomNumber(5)}`,
//     value: `{"timestamp": "${new Date().toISOString()}", "message": "${message}"}`,
// });

// const sendMessage = (data) => {
//     return producer
//         .send({
//             topic: data.topic,
//             compression: CompressionTypes.GZIP,
//             acks: -1,
//             messages: data.messages.map(m => createMessage(m)),
//         })
//         .then(console.log)
//         .catch(e => console.error(`[his-kafka-producer-v1] ${e.message}`, e));
// }

const init = async () => {
    await producer.connect();
    console.log('[his-kafka-producer-v1] connected to kafka cluster.');
    server.on('message', receivePacketUDP);
}

init().catch(e => console.error(`[his-kafka-producer-v1] ${e.message}`, e));

// error handling / clean shutdown

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
    process.on(type, async () => {
        try {
            console.log(`    process.on ${type}`)
            await producer.disconnect()
            await server.close()
            process.exit(0)
        } catch (_) {
            process.exit(1)
        }
    })
})

signalTraps.map(type => {
    process.once(type, async () => {
        try {
            console.log(`    process.once ${type}`)
            await producer.disconnect()
            await server.close()
        } finally {
            process.kill(process.pid, type)
        }
    })
})

// util

const getRandomNumber = (max) => Math.round(Math.random() * max);
