function onConnectionLost() {
  console.log("connection lost");
  document.getElementById("status").innerHTML = "Connection Lost";
  document.getElementById("status_messages").innerHTML = "Connection Lost";
  connected_flag = 0;

  MQTTconnect();
}
function onFailure(message) {
  console.log("Failed");
  document.getElementById("status_messages").innerHTML =
    "Connection Failed- Retrying";
  setTimeout(MQTTconnect, reconnectTimeout);
}
function onMessageArrived(r_message) {
  const obj = JSON.parse(r_message.payloadString);

  var lat = obj.latitude;
  var long = obj.longitude;
  var accuracy = obj.precision;
  var temp = obj.temperature;

  if (marker) {
    map.removeLayer(marker);
  }

  if (circle) {
    map.removeLayer(circle);
  }

  var greenIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [23, 40],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [40, 40],
  });

  var blueIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [23, 40],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [40, 40],
  });

  var redIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [23, 40],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [40, 40],
  });

  var blackIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [23, 40],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [40, 40],
  });

  if (temp < 10 && temp >= -40) {
    //blue
    marker = L.marker([lat, long], { icon: blueIcon });
    circle = L.circle([lat, long], { radius: accuracy });
    marker.bindPopup("Temperature: " + temp).openPopup();
  } else if (temp >= 10 && temp < 30) {
    //green
    marker = L.marker([lat, long], { icon: greenIcon });
    circle = L.circle([lat, long], { radius: accuracy, color: "green" });
    marker.bindPopup("Temperature: " + temp).openPopup();
  } else if (temp >= 30 && temp <= 60) {
    //red
    marker = L.marker([lat, long], { icon: redIcon });
    circle = L.circle([lat, long], { radius: accuracy, color: "red" });
    marker.bindPopup("Temperature: " + temp).openPopup();
  } else {
    //out of range
    marker = L.marker([lat, long], { icon: blackIcon });
    circle = L.circle([lat, long], { radius: accuracy, color: "black" });
    marker.bindPopup("Temperature: " + temp).openPopup();
  }

  var featureGroup = L.featureGroup([marker, circle]).addTo(map);

  map.fitBounds(featureGroup.getBounds());

  out_msg = "Message received " + r_message.payloadString;
  out_msg = out_msg + "      Topic " + r_message.destinationName + "<br/>";
  out_msg = "<b>" + out_msg + "</b>";
  //console.log(out_msg+row);
  try {
    document.getElementById("out_messages").innerHTML += out_msg;
  } catch (err) {
    document.getElementById("out_messages").innerHTML = err.message;
  }

  if (row == 10) {
    row = 1;
    document.getElementById("out_messages").innerHTML = out_msg;
  } else row += 1;

  mcount += 1;
  console.log(mcount + "  " + row);
}

function onConnected(recon, url) {
  console.log(" in onConnected " + reconn);
}
function onConnect() {
  // Once a connection has been made, make a subscription and send a message.
  document.getElementById("status_messages").innerHTML =
    "Connected to\nhost: " + host + "\nport " + port;
  connected_flag = 1;
  document.getElementById("status").innerHTML = "Connected";
  console.log("on Connect " + connected_flag);
}
function disconnect() {
  if (connected_flag == 1) mqtt.disconnect();
}

function MQTTconnect() {
  var clean_sessions = document.forms["connform"]["clean_sessions"].value;
  console.log("clean = " + clean_sessions);

  if ((clean_sessions = document.forms["connform"]["clean_sessions"].checked))
    clean_sessions = true;
  else clean_sessions = false;

  document.getElementById("status_messages").innerHTML = "";
  var s = document.forms["connform"]["server"].value;
  var p = document.forms["connform"]["port"].value;
  if (p != "" && s != "") {
    port = parseInt(p);
    console.log("port = " + port);
    host = s;
    console.log("host = " + host);
    console.log(
      "Connecting to: ws://" +
        host +
        "/" +
        port +
        "/mqtt\n" +
        "clean session = " +
        clean_sessions
    );
  } else {
    console.log("Port or Server field is empty, please fill out");
  }

  document.getElementById("status_messages").innerHTML = "connecting";
  var x = Math.floor(Math.random() * 10000);
  var cname = "orderform-" + x;
  mqtt = new Paho.MQTT.Client(host, port, cname);
  //document.write("connecting to "+ host);
  var options = {
    timeout: 3,
    cleanSession: clean_sessions,
    onSuccess: onConnect,
    onFailure: onFailure,
  };

  mqtt.onConnectionLost = onConnectionLost;
  mqtt.onMessageArrived = onMessageArrived;
  mqtt.onConnected = onConnected;

  mqtt.connect(options);
  return false;
}
function sub_topics() {
  document.getElementById("status_messages").innerHTML = "";
  if (connected_flag == 0) {
    out_msg = "<b>Not Connected so can't subscribe</b>";
    console.log(out_msg);
    document.getElementById("status_messages").innerHTML = out_msg;
    return false;
  }
  var stopic = document.forms["subs"]["Stopic"].value;
  console.log("here");
  var sqos = 0;
  console.log("Subscribing to topic =" + stopic + " QOS " + sqos);
  document.getElementById("status_messages").innerHTML =
    "Subscribing to topic =" + stopic;
  var soptions = {
    qos: sqos,
  };
  mqtt.subscribe(stopic, soptions);
  return false;
}

var marker, circle;
function generateTemp() {
  var pos = 60,
    neg = 40,
    includeZero = false,
    result;

  do result = Math.ceil(Math.random() * (pos + neg)) - neg;
  while (includeZero === false && result === 0);

  console.log(result);

  return result;
}

function getPosition(position) {
  console.log(position);
  var lat = position.coords.latitude;
  var long = position.coords.longitude;
  var accuracy = position.coords.accuracy;

  var temp = generateTemp();
  var msg = position;
  console.log(msg);
  var topic = "engo551_lab5";
  var pqos = 0;
  const geo_data = {
    latitude: lat,
    longitude: long,
    precision: accuracy,
    temperature: temp,
  };
  message = new Paho.MQTT.Message(JSON.stringify(geo_data));
  message.destinationName = topic;
  message.qos = pqos;
  console.log(
    "Your coordinate is: Lat: " +
      lat +
      " Long: " +
      long +
      " Accuracy: " +
      accuracy
  );
  mqtt.send(message);
  return false;
}

function send_message() {
  document.getElementById("status_messages").innerHTML = "";
  if (connected_flag == 0) {
    out_msg = "<b>Not Connected so can't send</b>";
    console.log(out_msg);
    document.getElementById("status_messages").innerHTML = out_msg;
    return false;
  }
  var pqos = 0;
  var msg = document.forms["smessage"]["message"].value;
  console.log(msg);
  document.getElementById("status_messages").innerHTML =
    "Sending message  " + msg;

  var topic = document.forms["smessage"]["Ptopic"].value;
  message = new Paho.MQTT.Message(msg);
  if (topic == "") message.destinationName = "test-topic";
  else message.destinationName = topic;
  message.qos = pqos;
  mqtt.send(message);
  return false;
}

function sendLocation() {
  if (!navigator.geolocation) {
    console.log("Your browser doesn't support geolocation feature!");
  } else {
    navigator.geolocation.getCurrentPosition(getPosition);
  }
}
