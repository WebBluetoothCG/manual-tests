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
const nordicUARTService = getEspruinoPrimaryService();

const testServiceID = '5a95ae06-965f-11eb-a8b3-0242ac130003';
const testCharacteristicID = '5a95c210-965f-11eb-a8b3-0242ac130003';

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

  $('btn_start_test').disabled = true;
  $('btn_load_code').disabled = true;

  try {
    const testReadOnlyService = async (gettServer) => {
      logInfo(`Requesting test service: ${testServiceID}...`);
      const service = await gattServer.getPrimaryService(testServiceID);
      assertEquals(device, service.device, 'service device mismatch');
      assertEquals(testServiceID, service.uuid, 'incorrect service UUID');

      logInfo(`Connected to service uuid:${service.uuid}, primary:${service.isPrimary}`);
      logInfo(`Requesting characteristic ${testCharacteristicID}...`);
      const characteristic = await service.getCharacteristic(testCharacteristicID);
      assertEquals(characteristic.service, service,
        'characteristic service mismatch');
      assertEquals(testCharacteristicID, characteristic.uuid,
        'incorrect characteristic UUID');

      logInfo(`Setting value to 25`);
      await characteristic.writeValueWithResponse(new Uint8Array([25]));

      dataView = await characteristic.readValue();
      val = dataView.getUint8(0, /*littleEndian=*/true);
      assertEquals(25, val, 'incorrect value');
      logInfo('readback success.');

      logInfo(`Setting to 73`);
      await characteristic.writeValueWithResponse(new Uint8Array([73]));

      dataView = await characteristic.readValue();
      val = dataView.getUint8(0, /*littleEndian=*/true);
      assertEquals(73, val, 'incorrect value');
      logInfo('readback success.');
    }

    const options = {
      filters: [{ services: [nordicUARTService] }],
      optionalServices: [testServiceID]
    };
    logInfo(`Requesting Bluetooth device with service ${nordicUARTService}`);
    const device = await navigator.bluetooth.requestDevice(options);

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();
    assertEquals(device, gattServer.device, 'server device mismatch');
    assertTrue(gattServer.connected, 'server.connected should be true');

    await testReadOnlyService(gattServer);

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

async function init() {
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

  const available = await navigator.bluetooth.getAvailability();
  if (!available) {
    $('bluetooth_available').style.display = 'none';
    $('bluetooth_unavailable').style.visibility = 'visible';
  }
}
