// socket.io server

// const app = require('express')();
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);

// io.on('connection', () => {
//     client.on('event', data => { /* … */ });
//     client.on('disconnect', () => { /* … */ });
// });

// server.listen(3000);

//kafka consumer

const ip = require('ip')

const { Kafka, logLevel } = require('kafkajs')

// const host = process.env.HOST_IP || ip.address()
const host = "localhost"

const kafka = new Kafka({
  logLevel: logLevel.INFO,
  brokers: [`${host}:9092`],
  clientId: 'his-kafka-consumer-web-v1',
})

const statusTopic = 'pod_statuses'
const telemetryTopics = /pod_(\d+)_telemetry/
const statusConsumer = kafka.consumer({ groupId: 'status-consumer-web-1' })
const telemetryConsumer = kafka.consumer({ groupId: 'telemetry-consumer-web-1' })
const admin = kafka.admin()

const init = async () => {
  await statusConsumer.connect()
  await telemetryConsumer.connect()
  await admin.connect()
  await statusConsumer.subscribe({ topic: statusTopic })
  await telemetryConsumer.subscribe({ topic: telemetryTopics })
  statusConsumer.run({
    eachMessage: processMessage,
  })
  telemetryConsumer.run({
    eachMessage: processMessage,
  })
}

// todo: seperate functions per consumer type?
const processMessage = async ({ topic, partition, message }) => {
  const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
  console.log(`- ${prefix} ${message.key}#${message.value}`)

  let messageJson = JSON.parse(message.value);
  console.log(messageJson);

  let startTime = new Date(messageJson.server_timestamp);
  console.log("time elapsed since UDP packet received: " + ((new Date) - startTime) + " milliseconds");

  if (topic == "pod_statuses" && messageJson.data == "start") {
    await subNewTopic("pod_" + message.key + "_telemetry")
  }
  // else if (topic.contains("telemetry")) {

  // }
}

const subNewTopic = async (newTopic) => {
  try {
    // get list to see if topic exists already
    let topicMetadata = await admin.fetchTopicMetadata();
    for (let topicObj of topicMetadata.topics) {
      // console.log("[DEBUG] topic found: " + topicObj.name)
      if (topicObj.name == newTopic) {
        console.log("[DEBUG] Topic already exists.")
        return
      }
    }

    console.log("[DEBUG] New topic not found, creating it.")

    // create new topic based on pod_id
    await admin.createTopics({
      topics: [{
        topic: newTopic
      }]
    })
  } catch (exception) {
    console.error("failed to create and subscribe to new topic for telemetry data: ", exception)
    return
  }

  // only way to stop consumer?
  await telemetryConsumer.disconnect();
  await telemetryConsumer.connect();

  // subscribe to new topic 
  await telemetryConsumer.subscribe({ topic: telemetryTopics })

  // restart consumer
  telemetryConsumer.run({
    eachMessage: processMessage,
  })
}

init().catch(e => console.error(`[his-kafka-consumer-web-v1] ${e.message}`, e))

// error handling / clean shutdown

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
  process.on(type, async e => {
    try {
      console.log(`    process.on ${type}`)
      console.error(e)
      await statusConsumer.disconnect()
      await telemetryConsumer.disconnect()
      await admin.disconnect()
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
      await statusConsumer.disconnect()
      await telemetryConsumer.disconnect()
      await admin.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  })
})
