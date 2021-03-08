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

const data = new Uint32Array([3214]);
let isConnected = false;
let debug = '?';

function updateScreen() {
  if (typeof g === 'undefined') {
    // Device has no graphics device (i.e. screen).
    return;
  }
  g.clear();
  g.setFontBitmap();
  g.drawString('Current Notify Value:');
  g.drawString('Connected: ' + isConnected, 0, g.getHeight() - 10);
  let msg = 'Dbg: ' + debug;
  g.drawString(msg, g.getWidth() - g.stringWidth(msg), g.getHeight() - 10);
  g.setFontVector(40);
  let val = data[0];
  g.drawString(val, (g.getWidth() - g.stringWidth(val)) / 2, 12);

  g.flip();
}

// This function is from:
// https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function randomBoolean() {
  return Math.random() < 0.5;
}

function createTestServices() {
  const checkedServices = {
    '3f2b9c10-7dce-11eb-9439-0242ac130002': {
      value: data.buffer,
      broadcast: false,
      readable: true,
      writable: false,
      notify: true,
      indicate: false,
      description: 'Characteristic 1',
    },
    // Characteristic #2 has opposite values as #1.
    'dcc030e4-8035-11eb-9439-0242ac130002': {
      value: data.buffer,
      broadcast: true,
      readable: false,
      writable: false,
      notify: true,
      indicate: true,
      description: null,
    }
  };

  // Add some more randomm characteristics. This is just for load testing to
  // test of the browser can handle a reasonable number of characteristics.
  //
  // The nRF52832 (used by the Espruino) has limited resources, and in testing
  // generally will only broadcast that it has six characteristics.
  let uncheckedServices = {};
  for (let i = 0; i < 10; i++) {
    // Make the last two characters of the UUID the characteristic index. This
    // Is only to make it easier to debug as the character can be easily
    // identified.
    let digits = i.toString();
    if (digits.length == 1)
      digits = '0' + digits;
    const uuid = generateUUID().replace(/..$/, digits);

    uncheckedServices[uuid] = {
      value: data.buffer,
      broadcast: randomBoolean(),
      readable: randomBoolean(),
      writable: randomBoolean(),
      notify: randomBoolean(),
      indicate: randomBoolean(),
      description: `Characteristic ${i}`
    };
  }

  return {
    '3f2b9742-7dce-11eb-9439-0242ac130002': checkedServices,
    '6fc096cc-803b-11eb-9439-0242ac130002': uncheckedServices
  };
}

function onInit() {
  // Put into a known state.
  digitalWrite(LED, isConnected);

  NRF.setServices(createTestServices());

  NRF.on('disconnect', (addr) => {
    // Provide feedback that device no longer connected.
    digitalWrite(LED, 0);
    isConnected = false;
    debug = addr;
    updateScreen();
  });

  NRF.on('connect', (reason) => {
    digitalWrite(LED, 1);
    isConnected = true;
    debug = reason;
    updateScreen();
  });

  updateScreen();
}
