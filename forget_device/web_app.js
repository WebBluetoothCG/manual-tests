/**
 *  Copyright 2022 Google LLC
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

"use strict";

// Espruino devices publish a UART service by default.
const nordicUARTService = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

var gattServer = undefined;
var btDeviceId = null;

function disableButtons(disabled=true) {
  $('btn_load_code').disabled = disabled;
  $('btn_start_pairing').disabled = disabled;
  $('btn_forget_device').disabled = disabled;
}

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
  logInfo('Pairing...');

  disableButtons();

  try {
    logInfo(`Requesting Bluetooth device with service ${nordicUARTService}`);
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [nordicUARTService] }
      ]
    });
    logInfo(`Connected to Bluetooh device with id: ${device.id} and name: ${device.name}`);
    btDeviceId = device.id;
    device.addEventListener('gattserverdisconnected', function(evt) {
      const device = evt.target;
      logInfo(`Disconnected from GATT on device ${device.name}.`);
      assertFalse(gattServer.connected, 'Server connected');
    });

    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();

    logInfo(`Connected to GATT, requesting service: ${nordicUARTService}...`);
    const service = await gattServer.getPrimaryService(nordicUARTService);

    logInfo(`Connected to service uuid: ${service.uuid}, primary:${service.isPrimary}`);
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
  }

  if (gattServer) {
    logInfo('Disconnecting from GATT.');
    gattServer.disconnect();
  }

  disableButtons(false);
}

async function forgetDevice() {
  clearStatus();
  logInfo(`Calling forget API`);
  const device = await getPairedDeviceWithId(btDeviceId);

  if (device) {
    try {
      await device.forget();
    } catch (error) {
      logError(`Unexpected failure: ${error}`);
    }
  } else {
    logError(`Unexpected failure: The bluetooth device with id "${btDeviceId}" doesn't exist on the list of persistant bluetooth devices.`);
  }
  if (await getPairedDeviceWithId(btDeviceId)) {
    logError(`Unexpected failure: The bluetooth device with id "${btDeviceId}" still exists on the list of persistant bluetooth devices.`);
  }

  testDone();

  disableButtons(false);
}

async function getPairedDeviceWithId(id) {
  const pairedDevices = await navigator.bluetooth.getDevices();
  for (let i = 0; i < pairedDevices.length; i++) {
    if (pairedDevices[i].id == id) {
      console.log(pairedDevices[i]);
      return pairedDevices[i];
    }
  }
  return null;
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

  $('btn_forget_device').disabled = true;
}
