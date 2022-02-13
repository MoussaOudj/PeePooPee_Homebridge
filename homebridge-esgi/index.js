var mqtt = require('mqtt');
var Service, Characteristic, HomebridgeAPI;
var seatTemp = "";
var seatDetection = false;
var seatCover = 1;

var opts = {
    rejectUnauthorized: false,
    username: '',
    password: '',
    connectTimeout: 5000
  };

var mqttclient = mqtt.connect('mqtt://test.mosquitto.org:1883',opts);

mqttclient.on('connect', function() {
    console.log('CONNECTED MQTT');
    mqttclient.subscribe('peepoopee/tempSensor/value');
    mqttclient.subscribe('peepoopee/seatMotion/status');
    });

mqttclient.on('message', function(topic, message){
    if(topic == 'peepoopee/tempSensor/value'){
        var tempValue = JSON.parse(message);
        // console.log("payload temp : ", tempValue)
        seatTemp = tempValue;
        // console.log(jsonStatusPayload);
        } else if(topic == 'peepoopee/seatMotion/status'){
        var seatMotionValue = JSON.parse(message);
        // console.log("payload seatMotion : ", seatMotionValue)
        seatDetection = seatMotionValue;
    }
    });

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    homebridge.registerAccessory("homebridge-esgi", "DummyESGI", DummyESGI);
    homebridge.registerAccessory("homebridge-esgi", "MentionSensor", SeatMotionSensor);
    homebridge.registerAccessory("homebridge-esgi", "MentionSensorTop", MotionSensorTop);
    homebridge.registerAccessory("homebridge-esgi", "TemperatureSensor", TemperatureSensor);
    homebridge.registerAccessory("homebridge-esgi", "SeatMotor", SeatMotor);
}

function DummyESGI(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.Switch(this.name);

    this._onCharacteristic = this._service.getCharacteristic(Characteristic.On);
    this._onCharacteristic.on('set', this._setOn.bind(this));
}

DummyESGI.prototype.getServices = function() {
    return [this._service];
}

DummyESGI.prototype._setOn = function(on, callback) {
    console.log("SET ON Dummy ESGI");
    console.log(on);
    this._onCharacteristic.value = on;
    callback();
}

function SeatMotionSensor(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.MotionSensor(this.name);
    this._service.getCharacteristic(Characteristic.MotionDetected)
        .onGet(this._handleMotionDetectedGet.bind(this));
}

SeatMotionSensor.prototype.getServices = function() {
    return [this._service];
}

SeatMotionSensor.prototype._handleMotionDetectedGet = function() {
    return seatDetection;
}

function MotionSensorTop(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.MotionSensor(this.name);
    this._service.getCharacteristic(Characteristic.MotionDetected)
        .onGet(this._handleMotionDetectedGet.bind(this));
}

MotionSensorTop.prototype.getServices = function() {
    return [this._service];
}

MotionSensorTop.prototype._handleMotionDetectedGet = function() {
    const currentValue = 0;
    return currentValue;
}

function TemperatureSensor(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.TemperatureSensor(this.name);
    this._service.getCharacteristic(Characteristic.CurrentTemperature)
        .onGet(this.handleCurrentTemperatureGet.bind(this));

}

TemperatureSensor.prototype.getServices = function() {
    return [this._service];
}

TemperatureSensor.prototype.handleCurrentTemperatureGet = function() {
    // console.log("seatTemp : ", seatTemp);
    return seatTemp;
}


function SeatMotor(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.GarageDoorOpener(this.name);

    this._service.getCharacteristic(Characteristic.CurrentDoorState)
        .onGet(this.handleCurrentDoorStateGet.bind(this));

    this._service.getCharacteristic(Characteristic.TargetDoorState)
        .onSet(this.handleTargetDoorStateSet.bind(this));
}

SeatMotor.prototype.getServices = function() {
    return [this._service];
}


SeatMotor.prototype.handleCurrentDoorStateGet = function() {
    return seatCover;
  }

  SeatMotor.prototype.handleTargetDoorStateSet = function(value) {
    console.log('Triggered SET TargetDoorState:', value);
    var valueForMqtt = "";
    if (value == 0) {
        valueForMqtt = "open";
        seatCover = 0;
    }else {
        valueForMqtt = "close";
        seatCover = 1;
    }
    mqttclient.publish("peepoopee/servo/value", valueForMqtt, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      });
  }