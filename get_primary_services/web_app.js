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

// The test service defined in device_code.js
const testServiceUUID = '3f2b9742-7dce-11eb-9439-0242ac130002';
// The test characteristic defined in device_code.js
const testCharacteristicUUID = '3f2b9c10-7dce-11eb-9439-0242ac130002';

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
  let remoteDevice = undefined;

  const resetTest = async () => {
    if (gattServer && gattServer.connected) {
      logInfo('Disconnecting from GATT.');
      gattServer.disconnect();
    }
    $('btn_start_test').disabled = false;
    $('btn_load_code').disabled = false;
  }

  // Verify the properties of |testCharacteristicUUID|, which should match
  // those set in device_code.js.
  const verifyProperties = (properties) => {
    const trueProps = ['read', 'notify'];
    const falseProps = ['broadcast', 'writeWithoutResponse', 'write',
      'indicate', 'authenticatedSignedWrites',
      'reliableWrite', 'writableAuxiliaries'];

    trueProps.forEach(propName => {
      if (!properties[propName])
        throw 'Expected property ${propName} to be true';
    });
    falseProps.forEach(propName => {
      if (properties[propName])
        throw 'Expected property ${propName} to be false';
    });
  };

  // Get a string of all properties set to true.
  const getCharacteristicProperties = (properties) => {
    const propNames = ['read', 'notify', 'broadcast', 'writeWithoutResponse',
      'write', 'indicate', 'authenticatedSignedWrites', 'reliableWrite',
      'writableAuxiliaries'];

    let enabledProps = [];
    propNames.forEach(propName => {
      if (properties[propName]) {
        enabledProps.push(propName);
      }
    });

    if (enabledProps.length)
      return enabledProps.join(', ');
    return '<none>';
  };

  const logService = async (service) => {
    let logText = [
      ` Service UUID: ${service.uuid}, isPrimary: ${service.isPrimary}`
    ];
    const characteristics = await service.getCharacteristics();
    if (!characteristics.length) {
      logText.push(`  No characteristics`);
    } else {
      characteristics.forEach(characteristic => {
        logText.push(`  Characteristic UUID: ${characteristic.uuid}`);
        logText.push(`   Props: ${getCharacteristicProperties(characteristic.properties)}`);
        if (characteristic.uuid == testCharacteristicUUID) {
          verifyProperties(characteristic.properties);
        }
      });
    }
    logText.map(logInfo);
  }

  try {
    const options = {
      filters: [{ services: [getEspruinoPrimaryService()] }],
      optionalServices: [testServiceUUID]
    };
    logInfo(`Requesting Bluetooth device with service ${testServiceUUID}`);
    remoteDevice = await navigator.bluetooth.requestDevice(options);
    logInfo(`Device: ID: ${remoteDevice.id}, name: \"${remoteDevice.name}\"`),

    remoteDevice.addEventListener('gattserverdisconnected', onGattDisconnected);
    gattServer = await remoteDevice.gatt.connect();

    logInfo(`Connected to GATT, requesting primary services...`);
    const services = await gattServer.getPrimaryServices();

    var actions = services.map(logService);
    await Promise.all(actions);

    resetTest();
    testDone();
  } catch (error) {
    logError(`Unexpected failure: ${error}`);
    resetTest();
    testDone();
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
