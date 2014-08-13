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
      pledged: false,
      pledgeLater: 0,
      cancelledForever: false,
      clickedAway: 0,
      offered: 0,
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

  init: function () {
    if (storage.pledges == null) {
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

  setPledged: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].pledged = true;
  },

  addPledgeLater: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].pledgeLater ++;
  },

  addClickedAway: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].clickedAway++;
  },

  addOffered: function(site) {
    this._initSite(site);
    storage.pledges.sites[site].offered++;
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

  getPledged: function(site) {
    if (storage.pledges.sites[site] == null) return 0;
    return storage.pledges.sites[site].pledged;
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

  unpledgeSiteForNextMonth: function(site) {
    if (storage.pledges.sites[site]) {
      storage.pledges.sites[site].unpledged = true;
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

  getPledgedAmountForHost: function (site) {
    if (storage.pledges.sites[site]) {
      return Math.round(storage.pledges.amount /
                        storage.pledges.total *
                        storage.pledges.sites[site].pledged *
                        100.00) / 100;
    }
    return 0;
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
