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

// The test service defined in device_code.js
const testService = '02fc549a-244c-11eb-adc1-0242ac120002';
// The test characteristic defined in device_code.js
const testCharacteristic = '02fc549a-244c-11eb-adc1-0242ac120002';
const requiredNumUpdates = 2;

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

  $('btn_start_test').disabled = true;
  $('btn_load_code').disabled = true;
  let gattServer = undefined;
  let notifyCharacteristic = undefined;
  let updateNum = 0;

  const resetTest =
      async function() {
    if (notifyCharacteristic) {
      await notifyCharacteristic.stopNotifications();
    }
    if (gattServer && gattServer.connected) {
      logInfo('Disconnecting from GATT.');
      gattServer.disconnect();
    }
    $('btn_start_test').disabled = false;
    $('btn_load_code').disabled = false;
  }

  const onCharacteristicChanged =
      function(evt) {
    updateNum += 1;
    try {
      const characteristic = evt.target;
      const dataview = characteristic.value;
      const val = dataview.getUint32(0, /*littleEndian=*/ true);
      if (val == 0) {
        throw `Characteristic value (${val}) should be > 0.`;
      }
      logInfo(`Update #${updateNum} with value ${val}.`);
      if (updateNum == requiredNumUpdates) {
        logInfo('Test success.');
      }
    } catch (error) {
      logError(`Unexpected failure: ${error}`);
      updateNum = requiredNumUpdates;  // Force test to stop.
    }
    if (updateNum >= requiredNumUpdates) {
      resetTest();
      testDone();
    }
  }

  try {
    const options = {
      filters: [{services: [getEspruinoPrimaryService()]}],
      optionalServices: [testService]
    };
    logInfo(`Requesting Bluetooth device with service ${testService}`);
    const device = await navigator.bluetooth.requestDevice(options);

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();

    logInfo(`Connected to GATT, requesting service: ${testService}...`);
    const service = await gattServer.getPrimaryService(testService);

    logInfo(`Got service, requesting characteristic ${testCharacteristic}...`);
    const characteristic = await service.getCharacteristic(testCharacteristic);

    logInfo(`Got characteristic, reading value...`);
    let dataview = await characteristic.readValue();
    let val = dataview.getUint32(0, /*littleEndian=*/ true);
    if (val == 0)
      throw `Characteristic value (${val}) should be > 0.`;

    notifyCharacteristic = await characteristic.startNotifications();
    notifyCharacteristic.addEventListener(
        'characteristicvaluechanged', onCharacteristicChanged);
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
    resetTest();
    testDone();
  }
}

function init() {
  if (!isBluetoothSupported()) {
    console.log('Bluetooth not supported.');
    $('no_bluetooth').style.visibility = 'visible';
    $('have_bluetooth').style.display = 'none';
  }
}