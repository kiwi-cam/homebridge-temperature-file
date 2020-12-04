var fs = require('fs');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-temperature-file", "TemperatureFile", TemperatureFileAccessory);
}

function TemperatureFileAccessory(log, config) {
  this.log = log;
  this.name = config["name"];
  this.filePath = config["file_path"];

  this.service = new Service.TemperatureSensor(this.name);

  this.service
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getTemperature.bind(this));

  this.state = readDataFile (this.filePath,log);

  if(this.state.humidity){
    this.service
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .on('get', this.getHumidity.bind(this));
  }

  if(this.state.battery){
    this.service
      .getCharacteristic(Characteristic.StateLowBattery)
      .on('get', this.getLowBattery.bind(this));
  }
}

TemperatureFileAccessory.prototype.getTemperature = function(callback) {
    const {log} = this;
    this.state = readDataFile (this.filePath,log);

    callback(null, parseFloat(this.state.temperature))
}

TemperatureFileAccessory.prototype.getHumidity = function(callback) {
    const {log} = this;

    callback(null, parseFloat(this.state.humidity))
}

TemperatureFileAccessory.prototype.getLowBattery = function(callback) {
    const {log} = this;

    let alert = (this.state.battery < 20) ? 1 : 0;
    callback(null, alert)
}

function readDataFile (filePath,log) {
    const state= {};

    fs.readFile(filePath, 'utf8', function(err, data) {
          if (err) {
         log(`\x1b[31m[ERROR] \x1b[0m${name} updateTemperatureFromFile\n\n${err.message}`);
      }

      if (data === undefined || data.trim().length === 0) {
        log(`\x1b[33m[WARNING]\x1b[0m ${name} Error reading file: ${this.filePath}, using previous Temperature`);
        return;
      }

      const lines = data.split(/\r?\n/);
      if (/^[0-9]+\.*[0-9]*$/.test(lines[0])){
        state.temperature = parseFloat(data);
      } else {
        lines.forEach((line) => {
          if(-1 < line.indexOf(':')){
            let value = line.split(':');
            if(value[0] == 'temperature') state.temperature = parseFloat(value[1]);
            if(value[0] == 'humidity') state.humidity = parseFloat(value[1]);
            if(value[0] == 'battery') state.battery = parseFloat(value[1]);
          }
        });
      }
    })

  return state;
}

TemperatureFileAccessory.prototype.getServices = function() {
  return [this.service];
}
