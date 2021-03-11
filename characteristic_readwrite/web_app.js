/**
 *  Copyright 2021 Google LLC
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
const testService = '1c84b596-222c-11eb-adc1-0242ac120002';
// The test characteristic defined in device_code.js
const testCharacteristic = '1c84b91a-222c-11eb-adc1-0242ac120002';

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
      filters: [{ services: [nordicUARTService] }],
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

    const firstValue = 1999;
    logInfo(`Got characteristic, writing value ${firstValue}...`);
    let result = await characteristic.writeValueWithResponse(
      new Uint32Array([firstValue]));

    let dataview = await characteristic.readValue();
    let val = dataview.getUint32(0, /*littleEndian=*/true);
    assertEquals(firstValue, val, 'Incorrect first value');

    const secondValue = 2012;
    logInfo(`writing value ${secondValue}...`);
    result = await characteristic.writeValueWithResponse(
      new Uint32Array([secondValue]));
    assertEquals(undefined, result);

    dataview = await characteristic.readValue();
    val = dataview.getUint32(0, /*littleEndian=*/true);
    assertEquals(secondValue, val, 'Incorrect second value');

    const thirdValue = 2040;
    logInfo(`writing value ${thirdValue}...`);
    result = await characteristic.writeValueWithoutResponse(
      new Uint32Array([thirdValue]));
    assertEquals(undefined, result);

    dataview = await characteristic.readValue();
    val = dataview.getUint32(0, /*littleEndian=*/true);
    assertEquals(thirdValue, val, 'Incorrect third value');

    // writeValue is deprecated.
    const fourthValue = 3000;
    logInfo(`writing value ${fourthValue}...`);
    result = await characteristic.writeValue(new Uint32Array([fourthValue]));
    assertEquals(undefined, result);

    dataview = await characteristic.readValue();
    val = dataview.getUint32(0, /*littleEndian=*/true);
    assertEquals(fourthValue, val, 'Incorrect fourth value');

    logInfo('Test passed.');
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
    if (window.isSecureContext == 'https') {
      $('no_bluetooth').style.visibility = 'visible';
    } else {
      $('insecure_context').style.visibility = 'visible';
    }
  }
}
