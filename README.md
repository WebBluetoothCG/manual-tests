# Web Bluetooth Manual Tests

This project contains a suite of tests that use the
[Web Bluetooth](https://webbluetoothcg.github.io/web-bluetooth/) API.
These tests differ from those already utilized by browsers in that
they rely on actual Bluetooth hardware, and are manually driven.
The benefit to this approach is:

1. They rely on the full Bluetooth stack of the operating system
   on which they are running. This allows them to potentially find
   browser bugs specific to an OS, or possibly even OS Bluetooth
   bugs.
2. They can be easily run by anyone - given they have the necessary
   hardware.
3. They offer a convenient starting point to reproduce Bluetooth
   bugs - whether they be in the web app, browser, or device.

These tests are **not browser specific**, and should work with any
browser supporting Web Bluetooth.

**Note**: This is not an officially supported Google product.

## Prerequisites

These tests do not require any software to be installed on the
device (i.e. computer/phone) aside from a compatible browser.
This should allow them to be run under accounts without
privileges to install software, and on Chrome OS, phones, etc.
