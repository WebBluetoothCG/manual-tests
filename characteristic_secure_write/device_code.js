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

const characteristicData = new Uint8Array([1]);
const devicePassKey = '131313'; // 6 digit passkey to use.
let isConnected = false;
let debug = '?';

function canShowPasskey() {
  // Without a display this app cannot actually display a passkey, but return
  // true because this is required in order to pair using passkeys.
  // http://forum.espruino.com/comments/14922430/
  return true;
}

function deviceHasDisplay() {
  return typeof g !== 'undefined';
}

function updateUI() {
  // Provide feedback that device is connected.
  // TODO: Maybe only do this for some devices when external power is
  //       available. For example, this will turn on the backlight on the
  //       Pixl.js screen, which might not be desirable when powered by the
  //       CR2032 coin cell battery.
  digitalWrite(LED, isConnected);

  if (!deviceHasDisplay())
    return;

  g.clear();
  g.setFontBitmap();
  g.drawString('Current Value:');
  g.drawString('Connected: ' + isConnected, 0, g.getHeight() - 10);
  const msg = 'Dbg: ' + debug;
  g.drawString(msg, g.getWidth() - g.stringWidth(msg), g.getHeight() - 10);
  g.setFontVector(40);
  const val = `${characteristicData[0]}`;
  g.drawString(val, (g.getWidth() - g.stringWidth(val)) / 2, 12);

  g.flip();
}

function onInit() {
  console.log(`Starting onInit. passkey: "${devicePassKey}"`);
  NRF.setServices({
    '5a95ae06-965f-11eb-a8b3-0242ac130003': {
      '5a95c210-965f-11eb-a8b3-0242ac130003': {
        value: characteristicData.buffer,
        broadcast: false,
        readable: true,
        writable: true,
        notify: false,
        description: 'Test Secure Characteristic',
        onRead: function () {
          debug = 'onRead';
          setTimeout(updateScreen(), 100);
          return characteristicData.buffer;
        },
        onWrite: function (evt) {
          characteristicData[0] = new DataView(evt.data).getUint8(0);
          debug = 'onWrite';
          setTimeout(updateScreen(), 100);
        },
        security: {
          read: {
            encrypted: true,  // Encrypt data (default: false).
            mitm: true,       // Man In The Middle (default: false).
          },
          write: {
            encrypted: true,  // Encrypt data (default: false).
            mitm: true,       // Man In The Middle (default: false).
          }
        }
      }
    }
  });

  NRF.on('disconnect', (reason) => {
    debug = `disconnect: ${reason}`;
    isConnected = false;
    updateUI();
  });

  NRF.on('connect', (addr) => {
    debug = `onconnect: ${addr}`;
    isConnected = true;
    updateUI();
  });

  NRF.setSecurity({
    display: canShowPasskey(),  // Can this device display a passkey?
    keyboard: false,            // Can this device enter a passkey?
    mitm: true,                 // Man In The Middle protection.
    passkey: devicePassKey,
  });

  updateUI();
}
