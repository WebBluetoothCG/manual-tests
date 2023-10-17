# Automated Testing Script

This folder contains a script that will run through the tests in this repo using an automated UI integration testing approach. Because this uses a real browser with real hardware, it must be run on a machine with bluetooth functionality and a bluetooth device within range.

At this time, only the Chrome implementation of this script is complete. There are placeholders for future Firefox and IE implementations.

## Exceptions

This script is only intented to run through tests with a common UI pattern. This is:

1. Open the test html page
2. Click on the "Upload Device Code" button
3. Operate the opened espruino page to complete code upload
4. Press the "Run Test" button on the test html page

The following tests are skipped because they require steps that the other tests do not.

- https://webbluetoothcg.github.io/manual-tests/get_devices/ _(This test requires the user to manually revoke bluetooth permissions durin the test, and has a different button to finish the test.)_
- https://webbluetoothcg.github.io/manual-tests/watch_advertisements/ _(Requires physically restarting the espruino device during the test.)_
- https://webbluetoothcg.github.io/manual-tests/forget_device/ _(This test requires the user to manually revoke bluetooth permissions durin the test, and has a different button to finish the test.)_

## Setup

Install dependencies

```shellsession
$ npm i
```

## Running

The script requires two arguments:

- device (`-d`): Name of a bluetooth device within range of the machine
- browser (`-b`): Browser to run tests with

```shellsession
$ npm run tests -- -d "Pixl.js 2a52" -b chrome
```

Test results are reported using [tap](https://node-tap.org/).

### Command Help

Running the script without any arguments will print out documentation on the required arguments.

```shellsession
$ npm run tests -- -d "Pixl.js 2a52" -b chrome
```
