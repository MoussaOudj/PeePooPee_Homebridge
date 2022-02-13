var mqtt = require('mqtt');
var Service, Characteristic, HomebridgeAPI;
var seatTemp = "";
var seatDetection = false;
var seatCover = 0;

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
        seatTemp = tempValue;
        } else if(topic == 'peepoopee/seatMotion/status'){
        var seatMotionValue = JSON.parse(message);
        seatDetection = seatMotionValue;
    }
    });

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    HomebridgeAPI = homebridge;
    homebridge.registerAccessory("homebridge-peepoopee", "FanPeepo", FanPeepo);
    homebridge.registerAccessory("homebridge-peepoopee", "MentionSensor", SeatMotionSensor);
    homebridge.registerAccessory("homebridge-peepoopee", "TemperatureSensor", TemperatureSensor);
    homebridge.registerAccessory("homebridge-peepoopee", "SeatMotor", SeatMotor);
}

function FanPeepo(log, config) {
    this.log = log;
    this.name = config.name;
    this._service = new Service.Fan(this.name);


    this._service.getCharacteristic(Characteristic.On)
        .onGet(this._handleOnGet.bind(this))
        .onSet(this._handleOnSet.bind(this));
}

FanPeepo.prototype.getServices = function() {
    return [this._service];
}

FanPeepo.prototype._handleOnGet = function() {
    const currentValue = 0;
    return currentValue;
}

FanPeepo.prototype._handleOnSet = function(value) {
    console.log("value : ", value);
    mqttclient.publish("peepoopee/fan/value", value.toString(), { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      });
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
        seatCover = Characteristic.CurrentDoorState.OPEN;
    }else {
        valueForMqtt = "close";
        seatCover = Characteristic.CurrentDoorState.CLOSED;
    }
    mqttclient.publish("peepoopee/servo/value", valueForMqtt, { qos: 0, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      });
  }