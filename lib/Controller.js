/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Ci,Cu,Cc} = require("chrome");
const {storage} = require("sdk/simple-storage");
const {TopDomains} = require("TopDomains");
const {PledgedSites} = require("PledgedSites");
const {PledgeButton} = require("PledgeButton");

Cu.import("resource://gre/modules/Services.jsm", this);
Cu.import("resource://gre/modules/NewTabUtils.jsm", this);
Cu.import("resource://gre/modules/NetUtil.jsm");


let Controller = {
  assignParticipatingSites: function() {
    // randomly find 1/3 of top 100 sites and make them participating
    let sites = TopDomains.computeTopSites();
    let limit = Math.floor(sites.length / 3);
    while (limit > 0) {
      let index = Math.floor(Math.random() * sites.length);
      while (!sites[index]) {
        index = Math.floor(Math.random() * sites.length);
      }
      PledgedSites.setCanPledge(sites[index]);
      limit--;
      sites[index] = null;
    }
  },

  runCommand: command(token, site) {
    switch (token) {
      case "offered":
        PledgedSites.addOffered(site);
        break;
      case "pledged":
        PledgedSites.setPledged(site);
        break;
      case "pledge-later":
        PledgedSites.addPledgeLater(site);
        break;
      case "pledge-never":
        PledgedSites.setCancelledForever(site);
        break;
      case "unblock":
        PledgedSites.setUnblocked(site, true);
        break;
      case "reblock":
        PledgedSites.setUnblocked(site, false);
        break;
      case "unpledge":
        PledgedSites.setUnpledged(site, true);
        break;
      case "repledge":
        PledgedSites.setUnpledged(site, false);
        break;
      case "clear":
        PledgedSites.clearSite(site);
        break;
     }
  },

};

exports.Controller = Controller;
