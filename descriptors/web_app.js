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
const nordicUARTService = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
// The test service defined in device_code.js
const testServiceUUID = '47ffa036-81c8-11eb-8dcd-0242ac130003';
// The test characteristic defined in device_code.js
const testCharacteristicUUID = '47ffa252-81c8-11eb-8dcd-0242ac130003';

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

  // Verify the characteristic descriptors defened in device_code.js
  const verifyTestServiceDescriptors = async (service) => {
    assertEquals(testServiceUUID, service.uuid, 'incorrect service UUID');

    const characteristics = await service.getCharacteristics();
    assertEquals(1, characteristics.length, 'expected 1 characteristic');
    for (characteristic of characteristics) {
      switch (characteristic.uuid) {
        case testCharacteristicUUID:
          let descriptors = await characteristic.getDescriptors();
          assertEquals(1, descriptors.length);
          const descriptor = await characteristic.getDescriptor(
            BluetoothUUID.getDescriptor('gatt.characteristic_user_description'));
          assertEquals(
            BluetoothUUID.getDescriptor('gatt.characteristic_user_description'),
            descriptor.uuid);
          assertEquals(characteristic, descriptor.characteristic,
            'descriptor characteristic mismatch');
          assertEquals(null, descriptor.value, 'value should be null');
          const value = await descriptor.readValue();
          const decoder = new TextDecoder('utf-8');
          let strVal = decoder.decode(value);
          assertEquals('Test UINT32 characteristic', strVal);

          strVal = decoder.decode(value);
          assertEquals('Test UINT32 characteristic', strVal);

          const encoder = new TextEncoder('utf-8')
          try {
            await descriptor.writeValue(encoder.encode('Something else'));
          } catch (e) {
            assertEquals('NotSupportedError', e.name);
          }
          break;
        default:
          logError(`Unexpected characteristic: ${characteristic.uuid}`);
      }
    }
  }

  // Verify descriptors for Nordic UART Service (NUS)
  // https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/include/bluetooth/services/nus.html
  const verifyNordicServiceDescriptors = async (service) => {
    assertEquals(nordicUARTService, service.uuid, 'incorrect service UUID');

    const characteristics = await service.getCharacteristics();
    assertEquals(2, characteristics.length, 'expected 2 characteristic');
    for (characteristic of characteristics) {
      switch (characteristic.uuid) {
        case '6e400002-b5a3-f393-e0a9-e50e24dcca9e': // RX
          try {
            await characteristic.getDescriptors();
            throw 'RX Characteristic should have no descriptors';
          } catch (e) {
            assertEquals('NotFoundError', e.name);
          }
          break;
        case '6e400003-b5a3-f393-e0a9-e50e24dcca9e': // TX
          const descriptors = await characteristic.getDescriptors();
          assertEquals(1, descriptors.length);
          const descriptor = descriptors[0];
          assertEquals(
            BluetoothUUID.getDescriptor('gatt.client_characteristic_configuration'),
            descriptor.uuid);
          assertEquals(characteristic, descriptor.characteristic,
            'descriptor characteristic mismatch');
          const value = await descriptor.readValue();
          const decoder = new TextDecoder('utf-8');
          const strVal = decoder.decode(value);
          assertEquals(2, strVal.length);
          assertEquals('\0\0', strVal);
          break;
        default:
          logError(`Unexpected characteristic: ${characteristic.uuid}`);
      }
    }
  }

  try {
    const options = {
      filters: [{ services: [nordicUARTService] }],
      optionalServices: [testServiceUUID]
    };
    logInfo(`Requesting Bluetooth device with service ${testServiceUUID}`);
    const device = await navigator.bluetooth.requestDevice(options);

    device.addEventListener('gattserverdisconnected', onGattDisconnected);
    logInfo(`Connecting to GATT server for device \"${device.name}\"...`);
    gattServer = await device.gatt.connect();
    assertEquals(gattServer.device, device, 'Server device mismatch');
    assertTrue(gattServer.connected, 'server.connected should be true');

    logInfo(`Connected to GATT, requesting primary services...`);
    let services = await gattServer.getPrimaryServices(nordicUARTService);
    assertEquals(1, services.length, 'expectged one nordic service');
    await verifyNordicServiceDescriptors(services[0]);

    services = await gattServer.getPrimaryServices(testServiceUUID);
    assertEquals(1, services.length, 'expected one test service');
    await verifyTestServiceDescriptors(services[0]);

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
