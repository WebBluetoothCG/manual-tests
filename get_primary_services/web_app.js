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
const testServiceUUIDs = ['3f2b9742-7dce-11eb-9439-0242ac130002',
  '6fc096cc-803b-11eb-9439-0242ac130002'];
// The test characteristics defined in device_code.js
const firstCharacteristicUUID = '3f2b9c10-7dce-11eb-9439-0242ac130002';
const secondCharacteristicUUID = 'dcc030e4-8035-11eb-9439-0242ac130002';

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

  // Verify the characteristic properties have the expected values.
  const verifyProperties = (characteristic, expectedTrue, expectedFalse) => {
    expectedTrue.forEach(propName => {
      if (characteristic.properties[propName] !== true)
        throw `Expected property "${propName}" to be true for characteristic ${characteristic.uuid}`;
    });
    expectedFalse.forEach(propName => {
      if (characteristic.properties[propName] === true)
        throw `Expected property "${propName}" to be false for characteristic ${characteristic.uuid}`;
    });
  };

  // Espruino does not set extended properties, so these properties are always
  // false.
  const alwaysFalseProperties = ['reliableWrite', 'writableAuxiliaries',
    'authenticatedSignedWrites'];

  // Verify the properties of |firstCharacteristicUUID|, which should match
  // those set in device_code.js.
  const verifyFirstCharacteristicProperties = (characteristic) => {
    const trueProps = ['read', 'notify'];
    const falseProps = ['broadcast', 'writeWithoutResponse', 'write',
      'indicate'].concat(alwaysFalseProperties);

    verifyProperties(characteristic, trueProps, falseProps);
  };

  // Verify the properties of |secondCharacteristicUUID|, which should match
  // those set in device_code.js.
  const verifySecondCharacteristicProperties = (characteristic) => {
    const trueProps = ['broadcast', 'write', 'writeWithoutResponse', 'indicate'];
    const falseProps = ['read', 'notify'].concat(alwaysFalseProperties);
    verifyProperties(characteristic, trueProps, falseProps);
  };

  // Get a string of all properties set to true.
  const getCharacteristicProperties = (properties) => {
    const propNames = ['read', 'notify', 'broadcast', 'writeWithoutResponse',
      'write', 'indicate'].concat(alwaysFalseProperties);

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
    if (service.device != remoteDevice)
      throw 'Service device does not match connected device';
    const characteristics = await service.getCharacteristics();
    if (!characteristics.length) {
      throw `Service ${service.uuid} had no characteristics`;
    }
    let logText = [
      ` Service UUID: ${service.uuid}, isPrimary: ${service.isPrimary}`
    ];
    // Only first service has specific characteristics which are verified.
    const checkExpectedCharacteristics = service.uuid == '3f2b9742-7dce-11eb-9439-0242ac130002';
    let expectedCharacteristricIDs = ['3f2b9c10-7dce-11eb-9439-0242ac130002',
      'dcc030e4-8035-11eb-9439-0242ac130002'];
    characteristics.forEach(characteristic => {
      logText.push(`  Characteristic UUID: ${characteristic.uuid}`);
      logText.push(`   Props: ${getCharacteristicProperties(characteristic.properties)}`);
      if (checkExpectedCharacteristics) {
        if (!expectedCharacteristricIDs.includes(characteristic.uuid))
          throw `Unexpected characteristric: ${characteristic.uuid}`;
        expectedCharacteristricIDs.splice(
          expectedCharacteristricIDs.indexOf(characteristic.uuid), 1);
        if (characteristic.uuid == firstCharacteristicUUID) {
          verifyFirstCharacteristicProperties(characteristic);
        } else if (characteristic.uuid == secondCharacteristicUUID) {
          verifySecondCharacteristicProperties(characteristic);
        }
      }
    });
    if (checkExpectedCharacteristics) {
      assertEquals(expectedCharacteristricIDs.length, 0,
        `Missing characteristics: ${JSON.stringify(expectedCharacteristricIDs)}`)
    }
    logText.map(logInfo);
  }

  try {
    const options = {
      filters: [{ services: [getEspruinoPrimaryService()] }],
      optionalServices: testServiceUUIDs
    };
    logInfo(`Requesting Bluetooth device with services ${JSON.stringify(testServiceUUIDs)}`);
    remoteDevice = await navigator.bluetooth.requestDevice(options);
    logInfo(`Device: ID: ${remoteDevice.id}, name: \"${remoteDevice.name}\"`);

    remoteDevice.addEventListener('gattserverdisconnected', onGattDisconnected);
    gattServer = await remoteDevice.gatt.connect();

    logInfo(`Connected to GATT, requesting primary services...`);
    const services = await gattServer.getPrimaryServices();

    const expectedServiceIDs = [...testServiceUUIDs].concat(
      getEspruinoPrimaryService());
    services.forEach((service) => {
      if (!expectedServiceIDs.includes(service.uuid)) {
        throw `Unexpected service ${service.uuid}`;
      }
      expectedServiceIDs.splice(expectedServiceIDs.indexOf(service.uuid), 1);
    });
    assertEquals(expectedServiceIDs.length, 0,
      `Expected service(s) not found: ${JSON.stringify(expectedServiceIDs)}`);

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
