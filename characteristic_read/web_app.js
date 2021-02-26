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

// Espruino devices publish a UART service by default.
const nordicUARTService = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
// The test service defined in device_code.js
const testService = '0b30acec-193e-11eb-adc1-0242ac120002';
// The test characteristic defined in device_code.js
const testCharacteristic = '0b30afd0-193e-11eb-adc1-0242ac120002';

/**
 * Load the device code to the Espruino IDE.
 */
function loadEspruinoDeviceCode() {
  fetch('device_code.js').then(response => response.text()).then(data => {
    let url = 'http://www.espruino.com/webide?code=' + encodeURIComponent(data);
    window.open(url, '_window');
  });
}

function onGattDisconnected(evt) {
  const device = evt.target;
  logInfo(`Disconnected from GATT on device ${device.name}.`);
}

async function startTest() {
  clearStatus();
  logInfo('Starting test');

  logInfo(`Requesting Bluetooth device with service ${testService}`);

  $('btn_start_test').disabled = true;
  $('btn_load_code').disabled = true;
  let gattServer = undefined;

  try {
    const options = {
      filters: [
        { services: [nordicUARTService] }
      ],
      optionalServices: [testService]
    };
    const device = await navigator.bluetooth.requestDevice(options);

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();

    logInfo(`Connected to GATT, requesting service: ${testService}...`);
    const service = await gattServer.getPrimaryService(testService);

    logInfo(`Got service, requesting characteristic ${testCharacteristic}...`);
    const characteristic = await service.getCharacteristic(testCharacteristic);

    logInfo(`Got characteristic, reading value...`);
    const dataview = await characteristic.readValue();

    const val = dataview.getUint8(0);
    // The expected value is hard-coded in device_code.js.
    const expectedValue = 17;
    if (val == expectedValue) {
      logInfo(`Got expected characteristic value ${val}.`);
    } else {
      logError(`Expected value of ${expectedValue}, but got ${val}.`);
    }
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
  }

  testDone();
  $('btn_start_test').disabled = false;
  $('btn_load_code').disabled = false;
  if (gattServer) {
    logInfo('Disconnecting from GATT.');
    gattServer.disconnect();
  }
}

function init() {
  if (!isBluetoothSupported()) {
    console.log('Bluetooth not supported.');
    $('have_bluetooth').style.display = 'none';
    if (window.location.protocol == 'https') {
      $('no_bluetooth').style.visibility = 'visible';
    } else {
      $('no_https').style.visibility = 'visible';
    }
  }
}
