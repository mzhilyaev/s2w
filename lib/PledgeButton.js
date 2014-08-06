/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Cc,Ci,Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm", this);
const {data} = require("sdk/self");
const ui = require("sdk/ui");
const {Panel} = require("sdk/panel");
const {setTimeout} = require("sdk/timers");
const {PledgedSites} = require("PledgedSites");

let PledgeButton = {

  init: function (application) {
   let self = this;

   this.pledgePanel = Panel({
     contentURL: data.url("pledgePanel.html"),
     contentScriptFile: [
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
     ],
     contentScriptWhen: "start",
     onHide: function () {
       self.pledgeButton.state("window", {
         checked: false,
         disabled: false,
         label: self._makeButtonLabel(),
       });
     },
   });
   this.pledgePanel.port.on("command", function (data) {
     let {token, site} = data;
     application.runCommand(token, site);
     if (token == "offered") {
       return;
     }

     self.pledgePanel.hide();
     // rebuild panel UI to reflect the changes
     self.pledgePanel.port.emit("siteInfo", PledgedSites.getPledgedSite(site));
   });

   this.pledgeButton = ui.ToggleButton({
    id: "pledge-button",
    label: "Subscribe To Web",
    icon: data.url("images/pledge_unsupported.png"),
    disabled: true,
    onChange: function(state) {
      if (state.checked)  {
        self.pledgePanel.show({
              position: self.pledgeButton
        });
      }
    },
   });
  },

  glowButton: function () {
    dump("Glowing =====\n");
  },

  setCurrentSite: function (siteData) {
    this.currentSite = siteData;
    this._configureSiteUI();
  },

  _makeButtonLabel: function() {
    let site = this.currentSite;
    let label = site.host;
    dump(JSON.stringify(site,null,1) + "\n");
    if (site.pledged) {
      if (site.unblocked) {
        label += " pledged, ads are shown";
      }
      else {
        label += " pledged, ads are hidden";
      }
    }
    else if (site.canPledge) {
      label +=  " supports your pledge";
    }
    else if (site.nominated) {
      label += " nominated";
    }
    else {
      label += site.host + " can be nominated";
    }
    return label;
  },

  _configureSiteUI: function () {
    // configure pledge button
    if (!this.currentSite 
        || this.currentSite.host.startsWith("about::")
        || this.currentSite.cancelledForever) {
      this.pledgeButton.state("window", {
        disabled: true,
      });
      return;
    }

    // configure pledge panel
    this.pledgePanel.port.emit("siteInfo", this.currentSite);

    if (this.currentSite.canPledge) {
      this.pledgeButton.state("window", {
        label: this._makeButtonLabel(),
        icon: data.url("images/pledge_supported.png"),
        disabled: false,
      });
      if (this.currentSite.offered == 0) {
        this.pledgePanel.show({
          position: this.pledgeButton
        });
      }
      else if (!this.currentSite.pledged) {
        // not the first time, but not pledged yet
        this.glowButton();
      }
      
    }
    else {
      this.pledgeButton.state("window", {
        label: this._makeButtonLabel(),
        icon: data.url("images/pledge_unsupported.png"),
        disabled: false,
      });
      // make the button glow to let use nominate the site
      this.glowButton();
    }
  },
}

exports.PledgeButton = PledgeButton;
