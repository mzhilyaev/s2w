/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Ci,Cu,Cc} = require("chrome");
const {data} = require("sdk/self");
const {StewApp} = require("Application");

Cu.import("resource://gre/modules/Services.jsm", this);
Cu.import("resource://gre/modules/NewTabUtils.jsm", this);
Cu.import("resource://gre/modules/NetUtil.jsm");

exports.main = function(options) {
  StewApp.start();
}

exports.onUnload = function (reason) {
  if (reason == "uninstall" || reason=="disable") {
    dump("Cleaning addon storage due to " + reason + "\n");
    StewApp.uninstall();
  }
};
