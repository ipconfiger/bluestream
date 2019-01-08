let commandLineArgs = require('command-line-args');
let util = require('util');
let bleno = require('bleno');
let BlenoPrimaryService = bleno.PrimaryService;


let optionDefinitions = [
    { name: 'host', type: String, multiple: false, defaultOption: true }
];
let options = commandLineArgs(optionDefinitions);

let BlenoCharacteristic = bleno.Characteristic;

let BsCharacteristic = function() {
  BsCharacteristic.super_.call(this, {
    uuid: '0b0b0b',
    properties: ['read', 'write', 'notify'],
    value: null
  });

  this._value = new Buffer(0);
  this._updateValueCallback = null;
  this.idx = 0;
};

util.inherits(BsCharacteristic, BlenoCharacteristic);

BsCharacteristic.prototype.onReadRequest = function(offset, callback) {
  console.log('EchoCharacteristic - onReadRequest: value = ' + this._value.toString('hex'));
  this.idx+=1;
  callback(this.RESULT_SUCCESS, new Buffer(this.idx));
};

BsCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  this._value = data;
  console.log('EchoCharacteristic - onWriteRequest: value = ' + this._value.toString('hex'));
  if (this._updateValueCallback) {
    console.log('EchoCharacteristic - onWriteRequest: notifying');
    this._updateValueCallback(this._value);
  }
  callback(this.RESULT_SUCCESS);
};

BsCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('EchoCharacteristic - onSubscribe');
  this._updateValueCallback = updateValueCallback;
};

BsCharacteristic.prototype.onUnsubscribe = function() {
  console.log('EchoCharacteristic - onUnsubscribe');

  this._updateValueCallback = null;
};

bleno.on('stateChange', function(state) {
    console.log('on -> stateChange: ' + state);
  
    if (state === 'poweredOn') {
      bleno.startAdvertising('echo', ['ec00']);
    } else {
      bleno.stopAdvertising();
    }
  });
  
bleno.on('advertisingStart', function(error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
  
    if (!error) {
      bleno.setServices([
        new BlenoPrimaryService({
          uuid: 'ec00',
          characteristics: [
            new BsCharacteristic()
          ]
        })
      ]);
    }
});
