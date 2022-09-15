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

 const advertisingValue = 99;
 const interval = 1000; //ms
 
 function onInit() {
   // Put into a known state.
   digitalWrite(LED, 0);
 
   NRF.setServices({
     '00001809-0000-1000-8000-00805f9b34fb': {
       '0b301809-193e-11eb-adc1-0242ac120002': {
         value: [17],
         broadcast: false,
         readable: true,
         writable: false,
         notify: false,
         description: 'Single read-only characteristic',
       }
     }
   });
 
   NRF.on('disconnect', (reason) => {
     // Provide feedback that device is no longer connected.
     digitalWrite(LED, 0);
   });
 
   NRF.on('connect', (addr) => {
     // Provide feedback that device is connected.
     // TODO: Maybe only do this for some devices when external power is
     //       available. For example, this will turn on the backlight on the
     //       Pixl.js screen, which might not be desirable when powered by the
     //       CR2032 coin cell battery.
     digitalWrite(LED, 1);
   });
 
   NRF.setAdvertising({
     0x1809: [advertisingValue]},
     {interval: interval}
   );
 }
 