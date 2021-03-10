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

let gattServer = undefined;

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
  assertFalse(gattServer.connected, 'Server connected');
}

async function startTest() {
  clearStatus();
  logInfo('Starting test');

  logInfo(`Requesting Bluetooth device with service ${testService}`);

  $('btn_start_test').disabled = true;
  $('btn_load_code').disabled = true;

  try {
    const options = {
      filters: [
        { services: [nordicUARTService] }
      ],
      optionalServices: [testService]
    };
    logInfo(`Requesting Bluetooth device with service ${testService}`);
    const device = await navigator.bluetooth.requestDevice(options);

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();
    assertEquals(gattServer.device, device, 'Server device mismatch');
    assertTrue(gattServer.connected, 'server.connected should be true');

    logInfo(`Connected to GATT, requesting service: ${testService}...`);
    const service = await gattServer.getPrimaryService(testService);
    assertEquals(service.device, device, 'service device mismatch');

    logInfo(`Connected to service uuid:${service.uuid}, primary:${service.isPrimary}`);
    logInfo(`Requesting characteristic ${testCharacteristic}...`);
    const characteristic = await service.getCharacteristic(testCharacteristic);
    assertEquals(characteristic.service, service,
      'characteristic service mismatch');

    logInfo(`Got characteristic, reading value...`);
    const dataview = await characteristic.readValue();

    const val = dataview.getUint8(0);
    // The expected value is hard-coded in device_code.js.
    assertEquals(17, val, 'Incorrect value from device');
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
    $('bluetooth_available').style.display = 'none';
    if (window.isSecureContext == 'https') {
      $('bluetooth_none').style.visibility = 'visible';
    } else {
      $('bluetooth_insecure').style.visibility = 'visible';
    }
    return;
  }

  const available = navigator.bluetooth.getAvailability();
  if (!available) {
    $('bluetooth_available').style.display = 'none';
    $('bluetooth_unavailable').style.visibility = 'visible';
  }
}
