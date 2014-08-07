/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
const {Cu} = require("chrome");
const {storage} = require("sdk/simple-storage");
const {Request} = require("sdk/request");
const simplePrefs = require("sdk/simple-prefs");
	
Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

let Dispatcher = {
  _makePayload: function() {
    return {
      application: "s2w",
      payloadDate: "" + new Date(),
      locale: Services.prefs.getCharPref("general.useragent.locale"),
      version: storage.version,
      installDate: storage.installDate,
      updateDate: storage.updateDate,
      stewData: storage.stewData,
      pledges: storage.pledges,
      uuid: simplePrefs.prefs.uuid,
    };
  },

  send: function(serverUrl) {
    let payload = this._makePayload();
    let serverPing = Request({
      url: serverUrl,
      contentType: "application/json; charset=utf8",
      content: JSON.stringify(payload),
      onComplete: (response) => {
        if (response.status >= 200 && response.status < 300) {
          let days = Object.keys(payload.interests);
          deferred.resolve(days);
        }
        else {
          deferred.reject("HTTP Error " + response.status + " " + response.statusText)
        }
      },
    });
    serverPing.post();
  },

  getPayload: function() {
    return this._makePayload();
  }
}

exports.Dispatcher = Dispatcher;
