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
const {getNodeView} = require("sdk/view/core");

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

  glowAdFreeSite: function() {
    return;
    let nodeView = getNodeView(this.pledgeButton);
    nodeView.style.boxShadow = "1px 1px 1px 2px olive";
  },

  glowNonFreeSite: function() {
    return;
    let nodeView = getNodeView(this.pledgeButton);
    nodeView.style.boxShadow = "1px 1px 1px 2px blue";
  },

  glowOff: function() {
    let nodeView = getNodeView(this.pledgeButton);
    nodeView.style.boxShadow = "";
  },

  setCurrentSite: function (siteData) {
    this.currentSite = siteData;
    this._configureSiteUI();
  },

  _makeButtonLabel: function() {
    let site = this.currentSite;
    if (!site || site.unpledged) {
      return;
    }
    let label = site.host;
    if (site.canPledge) {
      if (site.unblocked) {
        label += " participates, ads are shown";
      }
      else {
        label += " participates, ads are hidden";
      }
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
        || this.currentSite.unpledged) {
      this.pledgeButton.state("window", {
        disabled: true,
      });
      this.glowOff();
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
      this.glowAdFreeSite();
    }
    else {
      this.pledgeButton.state("window", {
        label: this._makeButtonLabel(),
        icon: data.url("images/pledge_unsupported.png"),
        disabled: false,
      });
      // make the button glow to let use nominate the site
      this.glowNonFreeSite();
    }
  },
}

exports.PledgeButton = PledgeButton;
