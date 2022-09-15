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
const bodyTemperatureService = '00001809-0000-1000-8000-00805f9b34fb';
const testCharacteristic = '0b301809-193e-11eb-adc1-0242ac120002';

let gattServer = undefined;
let device = undefined;
let btDeviceId = null;
let intervals = [];
let previous_timstamp = null;
const urlParam = 'bt_device_id';
const btDeviceIdUrlParam = new URLSearchParams(window.location.search).get(urlParam);

function disableButtons(disabled=true) {
  $('btn_load_code').disabled = disabled;
  $('btn_watch_advertisements').disabled = disabled;
  $('btn_watch_advertisements_no_adv').disabled = disabled;
}

function onGattDisconnected(evt) {
  logInfo(`Disconnected from GATT on device ${evt.target.name}.`);
  assertFalse(gattServer.connected, 'Server connected');
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

function listenToAdvertisements(event) {
  if (intervals.length < 10) {
    var data = event.serviceData.get(bodyTemperatureService).getUint8();
    logInfo(`Advertisement received with data: ${data}`);
    if (previous_timstamp != null) {
      if (data != advertisingValue) {
        logError(`Unexpected failure: Value ${data} was received instead of ${advertisingValue}.`);
      }
      t = event.timeStamp - previous_timstamp;
      logInfo(`Interval: ${t}`);
      intervals.push(t);
    }
    previous_timstamp = event.timeStamp;
  } else if (intervals.length == 10) {
    mean = intervals.reduce((a, b) => a + b) / intervals.length;
    logInfo(`Intervals mean: ${mean}`);
    if (mean > 3 * interval) {
      logError(`Unexpected failure: mean of intervals surpassed the limit.`);
    }
    disableButtons(false);
    intervals.push(event.timeStamp - previous_timstamp);
  }
}

async function watchAdvertisements() {
  logInfo('Starting test');
  disableButtons();

  try {
    logInfo(`Requesting Bluetooth device with service ${nordicUARTService}`);
    device = await navigator.bluetooth.requestDevice({
      filters: [
        { services: [nordicUARTService] }
      ],
      optionalServices: [bodyTemperatureService]
    });
    logInfo(`Requested Bluetooh device with id: ${device.id} and name: ${device.name}`);
    btDeviceId = device.id;

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
  }

  disableButtons();
  device.addEventListener('advertisementreceived', listenToAdvertisements);
  device.watchAdvertisements();
}

async function watchAdvertisements_NoDeviceAdvertising() {
  logInfo('Starting test');
  clearStatus();
  disableButtons();
  device.removeEventListener('advertisementreceived', listenToAdvertisements);
  function listenToAdvertisements2(event) {
    logError(`Unexpected failure: Shouldn't have received advertisements.`);
  }
  device.addEventListener('advertisementreceived', listenToAdvertisements2);

  setTimeout(function() {
    testDone();
    device.removeEventListener('advertisementreceived', listenToAdvertisements2);
    disableButtons(false);
  }, 10 * interval);
  
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

  if (btDeviceIdUrlParam == null) {
    $('btn_watch_advertisements_no_adv').disabled = true;
  }
  else {
    logInfo(`bt_device_id "${btDeviceIdUrlParam}" was detected in URL parameters.`);
  }
}
