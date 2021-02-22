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

const data = new Uint32Array([90210]);
let isConnected = false;
let debug = '?';

function updateScreen() {
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
    '1c84b596-222c-11eb-adc1-0242ac120002': {
      '1c84b91a-222c-11eb-adc1-0242ac120002': {
        value: data.buffer,
        broadcast: false,
        readable: true,
        writable: true,
        notify: false,
        description: 'Single read-write characteristic',
        onWrite: function(evt) {
          data[0] = new DataView(evt.data).getUint32(0, /*littleEndian=*/ true);
          debug = 'onWrite';
          setTimeout(updateScreen(), 100);
        },
        onRead: function() {
          debug = 'onRead';
          setTimeout(updateScreen(), 100);
          return data.buffer;
        },
      }
    }
  });

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
