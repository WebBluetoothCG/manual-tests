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

// Espruino devices publish a UART service by default.
const nordicUARTService = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
// The test service defined in device_code.js
const testService = '0b30acec-193e-11eb-adc1-0242ac120002';
// The test characteristic defined in device_code.js
const testCharacteristic = '0b30afd0-193e-11eb-adc1-0242ac120002';

let gattServer = undefined;
let btDeviceId = null;
const btDeviceIdUrlParam = window.location.search.substring(window.location.search.indexOf('bt_device_id=') + 'bt_device_id='.length).split('&')[0];

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

async function startPairing() {
  clearStatus();
  logInfo('Starting test');

  $('btn_load_code').disabled = true;
  $('btn_start_pairing').disabled = true;
  $('btn_refresh_page').disabled = true;
  $('btn_check_permission').disabled = true;

  try {
    const options = {
      filters: [
        { services: [nordicUARTService] }
      ],
      optionalServices: [testService]
    };

    logInfo(`Requesting Bluetooth device with service ${testService}`);
    const device = await navigator.bluetooth.requestDevice(options);
    logInfo(`Connected to Bluetooh device with id: ${device.id} and name: ${device.name}`);
    btDeviceId = device.id;

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();
    assertEquals(gattServer.device, device, 'Server device mismatch');
    assertTrue(gattServer.connected, 'server.connected should be true');

    logInfo(`Connected to GATT, requesting service: ${testService}...`);
    const service = await gattServer.getPrimaryService(testService);
    assertEquals(service.device, device, 'service device mismatch');

    logInfo(`Connected to service uuid: ${service.uuid}, primary:${service.isPrimary}`);
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
  }

  $('btn_load_code').disabled = false;
  $('btn_start_pairing').disabled = false;
  $('btn_refresh_page').disabled = false;
  $('btn_check_permission').disabled = false;

  if (gattServer) {
    logInfo('Disconnecting from GATT.');
    gattServer.disconnect();
  }
}

async function refreshPage() {
  logInfo('Refreshing the page');
  window.location.replace(`${window.location.href.split("?")[0]}?bt_device_id=${btDeviceId}`);
}

async function checkPermission() {
  clearStatus();
  logInfo(`Calling getDevices API`);
  const pairedDevices = await navigator.bluetooth.getDevices();

  var gatt;
  var passed = false;
  for (let i = 0; (i < pairedDevices.length) && !passed; i++) {
    logInfo(`Bluetooth Device with name "${pairedDevices[i].name}" and id "${pairedDevices[i].id}" was detected.`);
    passed = pairedDevices[i].id == btDeviceIdUrlParam;
    gatt = pairedDevices[i].gatt;
  }
  if (passed) {
    try {
      logInfo(`Connecting to GATT server for device id "${btDeviceIdUrlParam}"...`);
      gattServer = await gatt.connect();
    }catch (error) {
      logError(`Unexpected failure: ${error}`);
    }
  } else {
    logError(`Unexpected failure: The bluetooth device with id "${btDeviceIdUrlParam}" doesn't exist on the list of persistant bluetooth devices`);
  }

  testDone();

  $('btn_load_code').disabled = false;
  $('btn_start_pairing').disabled = false;
  $('btn_refresh_page').disabled = false;
  $('btn_check_permission').disabled = false;
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

  if (btDeviceIdUrlParam == null) {
    $('btn_refresh_page').disabled = true;
    $('btn_check_permission').disabled = true;
  }
  else {
    logInfo(`bt_device_id "${btDeviceIdUrlParam}" was detected in URL parameters.`);
  }
}
