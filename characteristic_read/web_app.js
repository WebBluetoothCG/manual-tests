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

async function startTest() {
  clearStatus();
  logInfo('Starting test');

  let options = { acceptAllDevices: true };
  if (testServices) {
    logInfo(`Requesting Bluetooth device with optional service ${testServices}`);
    options['optionalServices'] = testServices;
  } else {
    logInfo(`Requesting any Bluetooth device`);
  }

  $('btn_start_test').disabled = true;
  let gattServer = undefined;

  try {
    const device = await navigator.bluetooth.requestDevice(options);

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();

    logInfo(`Connected to GATT, requesting service: ${testServices[0]}...`);
    const service = await gattServer.getPrimaryService(testServices[0]);

    logInfo(`Got service, requesting characteristic ${testCharacteristic}...`);
    const characteristic = await service.getCharacteristic(testCharacteristic);

    logInfo(`Got characteristic, reading value...`);
    const dataview = await characteristic.readValue();

    const val = dataview.getUint8(0);
    logInfo(`Got characteristic value \"${val}\".`);
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
  }

  $('btn_start_test').disabled = false;
  if (gattServer) {
    logInfo('Disconnecting from GATT.');
    gattServer.disconnect();
  }
}

function init() {
  if (!isBluetoothSupported()) {
    console.log('Bluetooth not supported.');
    $('no_bluetooth').style.visibility = 'visible';
    $('have_bluetooth').style.display = 'none';
  }
}
