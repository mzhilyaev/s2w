/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {Cc,Ci,Cu} = require("chrome");

Cu.import("resource://gre/modules/Services.jsm", this);
const {data} = require("sdk/self");
const {storage} = require("sdk/simple-storage");

let PledgedSites = {

  _createSiteObject: function(site) {
    return {
      host: site,
      canPledge: false,
      panelShown: 0,
      blockedAdsCount: 0,
      unblocked: false,
      unpledged: false,
      nominated: false,
      created: Date.now(),
    };
  },

  _initSite: function(site, force) {
    if (storage.pledges.sites[site] == null || force) {
      storage.pledges.sites[site] = this._createSiteObject(site);
    }
  },

  init: function (force) {
    if (storage.pledges == null || force) {
      storage.pledges = {
        sites: {},
        amount: 0,
        total: 0,
        nextMonthAmount: 0,
      };
    }
  },

  setCancelledForever: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].cancelledForever = true;
  },

  addOffered: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].panelShown++;
  },

  setCanPledge: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].canPledge = true;
  },

  setUnblocked: function(site, state) {
    this._initSite(site);
    storage.pledges.sites[site].unblocked = state || false;
  },

  setUnpledged: function(site, state) {
    this._initSite(site);
    storage.pledges.sites[site].unpledged = state || false;
  },

  nominate: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].nominated = true;
  },

  getPledgedSites: function () {
    return storage.pledges.sites;
  },

  getPledgedSite: function (site) {
    if (storage.pledges.sites[site] == null) {
      return this._createSiteObject(site);
    }
    else {
      return storage.pledges.sites[site];
    }
  },

  clearSite: function(site, retainCanPledge) {
    let canPledge = (retainCanPledge) ? storage.pledges.sites[site].canPledge : false;
    this._initSite(site, true);
    storage.pledges.sites[site].canPledge = canPledge;
  },

  deleteSite: function(site) {
    delete storage.pledges.sites[site];
  },

  setPledgedAmount: function(val) {
    storage.pledges.amount = val;
  },

  getPledgedAmount: function () {
    return storage.pledges.amount;
  },

  setNextMonthPledgedAmount: function(val) {
    storage.pledges.nextMonthAmount = val;
  },

  getNextMonthPledgedAmount: function () {
    return storage.pledges.nextMonthAmount;
  },

  getPledgeData: function () {
    return storage.pledges;
  },

  clearAllSites: function (retainCanPledge) {
    Object.keys(storage.pledges.sites).forEach(site => {
      this.clearSite(site, retainCanPledge);
    });
  }

};

exports.PledgedSites = PledgedSites;
