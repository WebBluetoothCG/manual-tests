/**
 *  Copyright 2020 Google LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
var testDevice;

const testServices = ['0b30acec-193e-11eb-adc1-0242ac120002'];

const testCharacteristic = '0b30afd0-193e-11eb-adc1-0242ac120002';

/**
 * Load the device code to the Espruino IDE.
 */
function loadCode() {
  fetch('device_code.js').then(response => response.text()).then(data => {
    let url = 'http://www.espruino.com/webide?code=' + encodeURIComponent(data);
    window.open(url, '_window');
  });
}

function onGattDisconnected(evt) {
  const device = evt.target;
  logInfo(`Disconnected from GATT on device ${device.name}.`);
}

function readCharacteristic(gattServer) {
  let decoder = new TextDecoder('utf-8');
  gattServer.getPrimaryService(testServices[0])
    .then(service => {
      logInfo(
        `Got service, requesting characteristic ${testCharacteristic}...`);
      return service.getCharacteristic(testCharacteristic);
    })
    .then(characteristic => {
      logInfo(`Got characteristic, reading value...`);
      return characteristic.readValue();
    })
    .then(dataview => {
      const endianNess = true;  // little-endian.
      let val = dataview.getUint8(0, endianNess);
      logInfo(`Got characteristic value \"${val}\".`);
    })
    .catch(error => {
      logError(`Unexpected failure: ${error}`);
    });
}

function connectGattServer(device) {
  logInfo(`Connecting to GATT server for device \"${device.name}\"`);
  device.gatt.connect()
    .then(gattServer => {
      logInfo(`Connected to GATT server for device \"${device.name}\"`);
      readCharacteristic(gattServer);
    })
    .catch(error => {
      logError(`Error connecting to GATT server for device \"${device.name}\"`);
    });
}

/**
 * Start the test.
 */
function connectDevice(optionalServices) {
  logInfo('Starting test');
  var options = { acceptAllDevices: true };
  if (optionalServices) {
    logInfo(`Requesting Bluetooth device with optional service ${optionalServices}`);
    options['optionalServices'] = optionalServices;
  } else {
    logInfo(`Requesting any Bluetooth device`);
  }

  navigator.bluetooth.requestDevice(options)
    .then(device => {
      testDevice = device;
      logInfo(`Got device name: \"${device.name}\"`);
      logInfo(`Got device id: \"${device.id}\"`);
      device.addEventListener('gattserverdisconnected', onGattDisconnected);
      connectGattServer(device);
    })
    .catch(error => {
      logError(`Got device id: \"${device.id}\"`);
    });
}

function startTest() {
  clearStatus();
  connectDevice(testServices);
}

function init() {
  if (!isBluetoothSupported()) {
    console.log('Bluetooth not supported.');
    $('no_bluetooth').style.visibility = 'visible';
    $('have_bluetooth').style.display = 'none';
  }
}