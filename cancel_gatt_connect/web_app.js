/**
 *  Copyright 2025 Google LLC
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

let device = undefined;

/**
 * Load the device code to the Espruino IDE.
 */
function loadEspruinoDeviceCode() {
  fetch('device_code.js').then(response => response.text()).then(data => {
    let url = 'http://www.espruino.com/webide?code=' + encodeURIComponent(data);
    window.open(url, '_window');
  });
}

async function startPairing() {
  clearStatus();
  logInfo('Starting test');

  $('btn_load_code').disabled = true;
  $('btn_start_pairing').disabled = true;
  $('btn_connect_then_cancel').disabled = true;

  try {
    const options = {
      filters: [
        { services: [nordicUARTService] }
      ],
    };

    device = await navigator.bluetooth.requestDevice(options);
    logInfo(`Paired to Bluetooh device with name: ${device.name}`);
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
  }

  $('btn_load_code').disabled = false;
  $('btn_start_pairing').disabled = false;
  $('btn_connect_then_cancel').disabled = false;
}

async function connectThenCancel() {
  $('btn_load_code').disabled = true;
  $('btn_start_pairing').disabled = true;
  $('btn_connect_then_cancel').disabled = true;

  logInfo('Try to connect then cancel');
  try {
    setTimeout(() => {
      device.gatt.disconnect();
    }, 100);
    await device.gatt.connect();
    logError('connect() promise was not rejected');
  } catch (e) {
    if (e.name !== 'AbortError') {
      logError(`connect() promise was rejected with unexpected error: ${e}`);
    }
    logInfo('connect() promise was rejected with Abort error');
  }

  $('btn_load_code').disabled = false;
  $('btn_start_pairing').disabled = false;
  $('btn_connect_then_cancel').disabled = false;
  testDone();
}

async function init() {
  if (!isBluetoothSupported()) {
    console.log('Bluetooth not supported.');
    $('bluetooth_available').style.display = 'none';
    if (window.isSecureContext) {
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
