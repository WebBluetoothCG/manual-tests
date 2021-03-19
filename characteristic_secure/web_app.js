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

const ageServiceID = '00002a80-0000-1000-8000-00805f9b34fb';
const ageCharacteristicID = '00002a80-0000-1000-8000-00805f9b34fb';

const heartRateServiceID = '0000180d-0000-1000-8000-00805f9b34fb';
const heartRateMaxCharacteristicID = '00002a8d-0000-1000-8000-00805f9b34fb';

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
    const testAgeService = async (gettServer) => {
      logInfo(`Requesting age service: ${ageServiceID}...`);
      const service = await gattServer.getPrimaryService(ageServiceID);
      assertEquals(device, service.device, 'service device mismatch');
      assertEquals(ageServiceID, service.uuid, 'incorrect service UUID');

      logInfo(`Connected to service uuid:${service.uuid}, primary:${service.isPrimary}`);
      logInfo(`Requesting characteristic ${ageCharacteristicID}...`);
      const characteristic = await service.getCharacteristic(ageCharacteristicID);
      assertEquals(characteristic.service, service,
        'characteristic service mismatch');
      assertEquals(ageCharacteristicID, characteristic.uuid,
        'incorrect characteristic UUID');

      let dataView = await characteristic.readValue();
      let val = dataView.getUint8(0, /*littleEndian=*/true);
      logInfo(`Starting age is ${val}`);

      logInfo(`Setting age to 25`);
      await characteristic.writeValueWithResponse(new Uint8Array([25]));

      dataView = await characteristic.readValue();
      val = dataView.getUint8(0, /*littleEndian=*/true);
      assertEquals(25, val, 'incorrect age');
      logInfo('readback success.');

      logInfo(`Setting to 73`);
      await characteristic.writeValueWithResponse(new Uint8Array([73]));

      dataView = await characteristic.readValue();
      val = dataView.getUint8(0, /*littleEndian=*/true);
      assertEquals(73, val, 'incorrect age');
      logInfo('readback success.');
    }

    const testHeartRateService = async (gettServer) => {
      logInfo(`Requesting service: ${heartRateServiceID}...`);
      const service = await gattServer.getPrimaryService(heartRateServiceID);
      assertEquals(device, service.device, 'service device mismatch');
      assertEquals(heartRateServiceID, service.uuid, 'incorrect service UUID');

      logInfo(`Connected to service uuid:${service.uuid}, primary:${service.isPrimary}`);
      logInfo(`Requesting characteristic ${heartRateMaxCharacteristicID}...`);
      const characteristic = await service.getCharacteristic(heartRateMaxCharacteristicID);
      assertEquals(characteristic.service, service,
        'characteristic service mismatch');
      assertEquals(heartRateMaxCharacteristicID, characteristic.uuid,
        'incorrect characteristic UUID');

      let dataView = await characteristic.readValue();
      let val = dataView.getUint8(0, /*littleEndian=*/true);
      logInfo(`Starting max hart rate is ${val}`);

      logInfo(`Setting maximum heart rate to 67`);
      await characteristic.writeValueWithResponse(new Uint8Array([67]));

      dataView = await characteristic.readValue();
      val = dataView.getUint8(0, /*littleEndian=*/true);
      assertEquals(67, val, 'incorrect maximum heart rate');
      logInfo('readback success.');

      logInfo(`Setting to 110`);
      await characteristic.writeValueWithResponse(new Uint8Array([110]));

      dataView = await characteristic.readValue();
      val = dataView.getUint8(0, /*littleEndian=*/true);
      assertEquals(110, val, 'incorrect maximum heart rate');
      logInfo('readback success.');
    }

    const options = {
      filters: [{ services: [nordicUARTService] }],
      optionalServices: [ageServiceID,
        BluetoothUUID.getService(heartRateServiceID)]
    };
    logInfo(`Requesting Bluetooth device with service ${nordicUARTService}`);
    const device = await navigator.bluetooth.requestDevice(options);

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();
    assertEquals(device, gattServer.device, 'server device mismatch');
    assertTrue(gattServer.connected, 'server.connected should be true');

    await testAgeService(gattServer);
    await testHeartRateService(gattServer);

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
