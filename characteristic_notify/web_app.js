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
const requiredNumUpdates = 100;

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
  let lastValue = null;

  const resetTest = async () => {
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

  const checkCharacteristicValue = (value) => {
    if (value > 9999) {
      throw `Invalid characteristic value ${value}. Should be val <= 9999.`;
    }
    if (!lastValue) {
      return;
    }
    if (lastValue === 9999) {
      if (value !== 0) {
        throw `Expected characteristic value 0, actual ${value}.`;
      }
      return;
    }
    if (value !== (lastValue + 1)) {
      throw `Expected characteristic value ${lastValue + 1}, actual ${value}.`;
    }
  }

  const onCharacteristicChanged = (evt) => {
    updateNum += 1;
    try {
      const characteristic = evt.target;
      const dataView = characteristic.value;
      const val = dataView.getUint32(0, /*littleEndian=*/true);
      checkCharacteristicValue(val);
      lastValue = val;
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
      filters: [{ services: [getEspruinoPrimaryService()] }],
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
    let dataView = await characteristic.readValue();
    let val = dataView.getUint32(0, /*littleEndian=*/true);
    checkCharacteristicValue(val);

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
