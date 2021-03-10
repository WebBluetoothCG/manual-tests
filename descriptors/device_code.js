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

const data = new Uint32Array([94940]);
let isConnected = false;
let debug = '?';

function updateScreen() {
  if (typeof g === 'undefined') {
    // Device has no graphics device (i.e. screen).
    return;
  }
  g.clear();
  g.setFontBitmap();
  g.drawString('Current Value:');
  g.drawString('Connected: ' + isConnected, 0, g.getHeight() - 10);
  let msg = 'Dbg: ' + debug;
  g.drawString(msg, g.getWidth() - g.stringWidth(msg), g.getHeight() - 10);
  g.setFontVector(40);
  let val = data[0];
  g.drawString(val, (g.getWidth() - g.stringWidth(val)) / 2, 12);

  g.flip();
}

function onInit() {
  // Put into a known state.
  digitalWrite(LED, isConnected);

  NRF.setServices({
    '47ffa036-81c8-11eb-8dcd-0242ac130003': {
      '47ffa252-81c8-11eb-8dcd-0242ac130003': {
        value: data.buffer,
        broadcast: false,
        readable: true,
        writable: true,
        notify: false,
        description: 'Test UINT32 characteristic',
        onWrite: function(evt) {
          data[0] = new DataView(evt.data).getUint32(0, /*littleEndian=*/true);
          debug = 'onWrite';
          setTimeout(updateScreen(), 100);
        },
        onRead: function() {
          debug = 'onRead';
          return data.buffer;
        },
      },
      // This characteristic has no description:
      '47ffa252-81c8-11eb-8dcd-0242ac130003': {
        value: data.buffer,
        broadcast: false,
        readable: true,
        writable: false,
        notify: false,
      }
    }
  });

  NRF.on('disconnect', (reason) => {
    // Provide feedback that device no longer connected.
    digitalWrite(LED, 0);
    isConnected = false;
    debug = reason;
    updateScreen();
  });

  NRF.on('connect', (addr) => {
    digitalWrite(LED, 1);
    isConnected = true;
    debug = addr;
    updateScreen();
  });

  updateScreen();
}
