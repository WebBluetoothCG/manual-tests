# Automated Testing Script

This folder contains a script that will run through the tests in this repo using an automated UI integration testing approach. Because this uses a real browser with real hardware, it must be run on a machine with Bluetooth functionality and a bluetooth device within range.

At this time, only the Chrome implementation of this script is complete. See the ["Chrome Implementation" section](chrome-implementation-overview) below for notes on how it uses [Puppeteer](https://pptr.dev/) to accomplish this. There are placeholders for future Firefox and IE implementations.

## Exceptions

This script is only intented to run through tests with a common UI pattern. This is:

1. Open the test html page
2. Click on the "Upload Device Code" button
3. Operate the opened espruino page to complete code upload
4. Press the "Run Test" button on the test html page

The following tests are skipped because they require steps that the other tests do not.

- https://webbluetoothcg.github.io/manual-tests/get_devices/ _(This test requires the user to manually revoke bluetooth permissions during the test, and has a different button to finish the test.)_
- https://webbluetoothcg.github.io/manual-tests/watch_advertisements/ _(Requires physically restarting the espruino device during the test.)_
- https://webbluetoothcg.github.io/manual-tests/forget_device/ _(This test requires the user to manually revoke bluetooth permissions during the test, and has a different button to finish the test.)_

These tests are configured to be skipped in [const.ts](./const.ts) in the `testDirsToSkip` array.

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

Test results are reported using [TAP](https://node-tap.org/).

### Command Help

Running the script without any arguments will print out documentation on the required arguments.

## Chrome Implementation Overview

The implementation for Chrome uses [Puppeteer](https://pptr.dev/) to simulate user interactions with the webpages and bluetooth device chooser UIs. We'll walk through the bluetooth relevant parts here.

### Launching

When we initially launch the browser with Puppteer, we disable headless mode through the [launch option](https://pptr.dev/api/puppeteer.browserlaunchargumentoptions) because the current headless mode doesn't support showing the bluetooth prompt.

```typescript
puppeteer.launch({
  headless: false,
});
```

This means puppeteer will open a visible Chrome browser window to run the test.

### Opening the bluetooth device prompt

Once we've opened the test's espruino page with puppeteer, we can connect to the bluetooth device we're uploading code to.

We use [`Page.locator().click()`](https://pptr.dev/api/puppeteer.locator) to trigger the bluetooth device chooser and [`Page.waitForDevicePrompt()`](https://pptr.dev/api/puppeteer.page.waitfordeviceprompt/) to recognize when it appears. We must call `waitForDevicePrompt()` _before_ we click the button that runs the webpage's JavaScript that calls the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Bluetooth/requestDevice).

Since both of these Puppeteer methods return promises, `Promise.all()` is a convenient way to call them in the right order together:

```typescript
const [devicePrompt] = await Promise.all([
  page.waitForDevicePrompt(),
  page.locator("#btn_start_test").click(),
]);
```

The promise returned by `waitForDevicePrompt()` resolves to a [DeviceRequestPrompt](https://pptr.dev/api/puppeteer.devicerequestprompt) object which we'll use next to select the desired blueooth device.

### Selecting a device

We use [`DeviceRequestPrompt.waitForDevice()`](https://pptr.dev/api/puppeteer.devicerequestprompt.waitfordevice) and [`DeviceRequestPrompt.select()`](https://pptr.dev/api/puppeteer.devicerequestprompt.select) to find and connect to the bluetooth device we want.

`DevicePrompt.waitForDevice()` calls the supplied callback each time Chrome finds a bluetooth device it could connect to with some basic info about the device. The first time the callback returns `true`, `waitForDevice()` will resolve to the matched `DeviceRequestPromptDevice`. We then pass that device to `DevicePrompt.select()` to have Puppeteer actually connect to that bluetooth device.

In the implementation, this looks like:

```typescript
await devicePrompt.select(
  await devicePrompt.waitForDevice(({ name }) => deviceNameMatcher(name)),
);
```

Once `DevicePrompt.select()` resolves, Chrome will have connected to the device and the webpage will be able to access it.

### Other Notes

- We use [incognito browser contexts](https://pptr.dev/api/puppeteer.browsercontext/#example) so that permissions from one test do not affect the other.
