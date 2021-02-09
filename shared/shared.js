/**
 *  Copyright 2020 Google LLC
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

function $(id) {
  return document.getElementById(id);
}

function logInfo(msg) {
  let status = $('status')
  status.innerHTML = status.innerHTML + '</br>' + msg;
  console.log(msg);
}

function logError(msg) {
  let status = $('status')
  status.innerHTML = status.innerHTML + '</br>' + msg;
  console.error(msg);
}

function clearStatus() {
  $('status').innerHTML = '';
}

function isBluetoothSupported() {
  return navigator.bluetooth !== undefined;
}
