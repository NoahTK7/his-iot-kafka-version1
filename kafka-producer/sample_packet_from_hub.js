let telemetry_packet = 
{
    "type": "telemetry",
    "pod_id": "123",
    "hub_timestamp": "2020-04-14T00:27:12.802Z",
    "data": {
        "vel": "1.23",
        "accel": "0.56",
    }
}

// packet id for acknowledgement?

let = status_packet = 
{
    "type": "status",
    "pod_id": "123",
    "hub_timestamp": "2020-04-14T00:27:12.802Z",
    "data": "start|stop"
}


/*
{"type":"telemetry","pod_id":"123","hub_timestamp":"2020-04-14T00:27:12.802Z","data":{"vel":"1.23","accel":"0.56"}}
{"type":"telemetry","pod_id":"234","hub_timestamp":"2020-04-14T00:27:12.802Z","data":{"vel":"1.23","accel":"0.56"}}
{"type":"telemetry","pod_id":"789","hub_timestamp":"2020-04-14T00:27:12.802Z","data":{"vel":"1.23","accel":"0.56"}}

{"type":"status","pod_id":"123","hub_timestamp":"2020-04-14T00:27:12.802Z","data":"start"}
{"type":"status","pod_id":"234","hub_timestamp":"2020-04-14T00:27:12.802Z","data":"start"}
{"type":"status","pod_id":"789","hub_timestamp":"2020-04-14T00:27:12.802Z","data":"start"}
*/
