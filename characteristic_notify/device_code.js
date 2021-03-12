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

const data = new Uint32Array([1]);
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

function updateValue() {
  data[0] = data[0] + 1;
  if (data[0] == 10000) {
    // Limit to four digits for display on small screens.
    data[0] = 0;
  }
  if (isConnected) {
    NRF.updateServices({
      '02fc549a-244c-11eb-adc1-0242ac120002': {
        '02fc549a-244c-11eb-adc1-0242ac120002':
            {value: data.buffer, notify: true}
      }
    });
  }
}

function onInit() {
  // Put into a known state.
  digitalWrite(LED, isConnected);

  NRF.setServices({
    '02fc549a-244c-11eb-adc1-0242ac120002': {
      '02fc549a-244c-11eb-adc1-0242ac120002': {
        value: data.buffer,
        broadcast: false,
        readable: true,
        writable: false,
        notify: true,
        description: 'Notify characteristic',
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

  setInterval(updateScreen, 1000);
  setInterval(updateValue, 40);
}
