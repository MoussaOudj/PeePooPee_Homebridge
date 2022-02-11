"use strict";

var mqtt = require('mqtt');
var Service, Characteristic, HomebridgeAPI;
var sitTemp = 0;

var opts = {
    rejectUnauthorized: false,
    username: '',
    password: '',
    connectTimeout: 5000
  };

var mqttclient = mqtt.connect('mqtt://test.mosquitto.org:1883',opts);

mqttclient.on('connect', function() {
    console.log('CONNECTED MQTT');
    mqttclient.subscribe('test/ios/temp');
    });

mqttclient.on('message', function(topic, message){
    if(topic == 'test/ios/temp'){
        var jsonStatusPayload = JSON.parse(message);
        sitTemp = jsonStatusPayload;
        // console.log(jsonStatusPayload);
        }
    });

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    homebridge.registerAccessory("homebridge-esgi", "DummyESGI", DummyESGI);
    homebridge.registerAccessory("homebridge-esgi", "MentionSensor", MentionSensor);
    homebridge.registerAccessory("homebridge-esgi", "MentionSensorTop", MentionSensorTop);
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

function MentionSensor(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.MotionSensor(this.name);
    this._service.getCharacteristic(Characteristic.MotionDetected)
        .onGet(this._handleMotionDetectedGet.bind(this));
}

MentionSensor.prototype.getServices = function() {
    return [this._service];
}

MentionSensor.prototype._handleMotionDetectedGet = function() {
    const currentValue = 0;
    return currentValue;
}

function MentionSensorTop(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.MotionSensor(this.name);
    this._service.getCharacteristic(Characteristic.MotionDetected)
        .onGet(this._handleMotionDetectedGet.bind(this));
}

MentionSensorTop.prototype.getServices = function() {
    return [this._service];
}

MentionSensorTop.prototype._handleMotionDetectedGet = function() {
    const currentValue = 1;
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
    print(sitTemp);
    return sitTemp;
}


function SeatMotor(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.GarageDoorOpener(this.name);

    this._service.getCharacteristic(Characteristic.CurrentDoorState)
        .onGet(this.handleCurrentDoorStateGet.bind(this));

    this._service.getCharacteristic(Characteristic.TargetDoorState)
        .onGet(this.handleTargetDoorStateGet.bind(this))
        .onSet(this.handleTargetDoorStateSet.bind(this));

    this._service.getCharacteristic(Characteristic.ObstructionDetected)
        .onGet(this.handleObstructionDetectedGet.bind(this));
}

SeatMotor.prototype.getServices = function() {
    return [this._service];
}


SeatMotor.prototype.handleCurrentDoorStateGet = function() {
    const currentValue = Characteristic.CurrentDoorState.OPEN;
    return currentValue;
  }

  SeatMotor.prototype.handleTargetDoorStateGet = function() {
    const currentValue = Characteristic.TargetDoorState.OPEN;
    return currentValue;
  }

  SeatMotor.prototype.handleTargetDoorStateSet = function(value) {
    console.log('Triggered SET TargetDoorState:', value);
    var valueForMqtt = "";
    if (value == 0) {
        valueForMqtt = "open";
    }else {
        valueForMqtt = "close";
    }
    mqttclient.publish("servo/test", valueForMqtt, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      });
  }

  SeatMotor.prototype.handleObstructionDetectedGet = function() {
    const currentValue = 0;
    return currentValue;
  }