/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const {components,Cm,Ci,Cu,Cc} = require("chrome");
const tabs = require("sdk/tabs");
const {data, id} = require("sdk/self");
const {storage} = require("sdk/simple-storage");
const {Class} = require("sdk/core/heritage");
const {Factory, Unknown} = require("sdk/platform/xpcom");
const {PageMod} = require("sdk/page-mod");
const simplePrefs = require("sdk/simple-prefs");
const unload = require("sdk/system/unload");
const privateBrowsing = require("sdk/private-browsing");
const {TopDomains} = require("TopDomains");
const {Blockers} = require("Blockers");
const {Dispatcher} = require("Dispatcher");

const {PledgedSites} = require("PledgedSites");
const {PledgeButton} = require("PledgeButton");

Cu.import("resource://gre/modules/Services.jsm", this);
Cu.import("resource://gre/modules/NewTabUtils.jsm", this);
Cu.import("resource://gre/modules/NetUtil.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

const kIdleDaily = "idle-daily";

XPCOMUtils.defineLazyServiceGetter(this, "uuid",
                                   "@mozilla.org/uuid-generator;1",
                                   "nsIUUIDGenerator");

let DebugPage = {
  init: function() {
    Factory(this.factory);
    PageMod(this.page);
  },

  factory: {
    contract: "@mozilla.org/network/protocol/about;1?what=s2w-debug",

    Component: Class({
      extends: Unknown,
      interfaces: ["nsIAboutModule"],

      newChannel: function(uri) {
        let chan = Services.io.newChannel(data.url("s2w-debug.html"), null, null);
        chan.originalURI = uri;
        return chan;
      },

      getURIFlags: function(uri) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
      }
    })
  },
  page: {
    // load scripts
    contentScriptFile: [
      //data.url("js/jquery-1.10.2.min.js"),
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
    ],

    contentScriptWhen: "start",

    include: ["about:s2w-debug"],

    onAttach: function(worker) {
      // inject styles
      worker.port.emit("style", data.url("css/bootstrap.min.css"));
      worker.port.emit("style", data.url("css/bootstrap-theme.min.css"));
      worker.port.emit("style", data.url("css/styles.css"));

      worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      worker.port.on("participate", function(site) {
        PledgedSites.setCanPledge(site);
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      });
      worker.port.on("clearsite", function(site) {
        PledgedSites.clearSite(site, true);
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      });
      worker.port.on("deletesite", function(site) {
        PledgedSites.deleteSite(site);
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      });
      worker.port.on("clearall", function() {
        PledgedSites.clearAllSites(true);
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      });
      worker.port.on("submissionData", function() {
        worker.port.emit("submissionData", Dispatcher.getPayload());
      });
      worker.port.on("send", function() {
        StewApp.send();
      });
      worker.port.on("reassign", function() {
        PledgedSites.init(true);
        StewApp.assignParticipatingSites();
        worker.port.emit("pledgedSites", PledgedSites.getPledgeData());
      });
    },
  }
};

let IntroPage = {
  init: function() {
    Factory(this.factory);
    PageMod(this.page);
  },

  factory: {
    contract: "@mozilla.org/network/protocol/about;1?what=s2w-intro",

    Component: Class({
      extends: Unknown,
      interfaces: ["nsIAboutModule"],

      newChannel: function(uri) {
        let chan = Services.io.newChannel(data.url("s2w-intro.html"), null, null);
        chan.originalURI = uri;
        return chan;
      },

      getURIFlags: function(uri) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
      }
    })
  },
  page: {
    // load scripts
    contentScriptFile: [
      //data.url("js/jquery-1.10.2.min.js"),
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
    ],

    include: ["about:s2w-intro"],

    contentScriptWhen: "start",

    onAttach: function(worker) {
      // inject styles
      worker.port.emit("style", data.url("css/bootstrap.min.css"));
      worker.port.emit("style", data.url("css/bootstrap-theme.min.css"));
      worker.port.emit("style", data.url("css/styles.css"));

      worker.port.on("startStudy", function() {
        StewApp.initStew();
        StewApp.beginStew();
      });

      worker.port.on("cancelStudy", function() {
        StewApp.uninstall();
      });
    },
  }
};


let DashPage = {
  init: function() {
    Factory(this.factory);
    PageMod(this.page);
  },

  factory: {
    contract: "@mozilla.org/network/protocol/about;1?what=s2w-dashboard",

    Component: Class({
      extends: Unknown,
      interfaces: ["nsIAboutModule"],

      newChannel: function(uri) {
        let chan = Services.io.newChannel(data.url("s2w-dashboard.html"), null, null);
        chan.originalURI = uri;
        return chan;
      },

      getURIFlags: function(uri) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
      }
    })
  },
  page: {
    // load scripts
    contentScriptFile: [
      data.url("jquery/jquery.min.js"),
      data.url("jquery/jquery.jqplot.min.js"),
      data.url("jquery/jqplot.pieRenderer.min.js"),
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
    ],

    include: ["about:s2w-dashboard*"],

    contentScriptWhen: "start",

    onAttach: function(worker) {
      // inject styles
      worker.port.emit("style", data.url("css/bootstrap.min.css"));
      worker.port.emit("style", data.url("css/bootstrap-theme.min.css"));
      worker.port.emit("style", data.url("css/styles.css"));
      worker.port.emit("style", data.url("jquery/jquery.jqplot.min.css"));

      let monthlyUsage = TopDomains.computeMonthlyUsage();
      worker.port.emit("data", {
        usage: TopDomains.computeMonthlyUsage(),
        pledges: PledgedSites.getPledgeData(),
      });

      worker.port.on("command", function (data) {
        let {token, site} = data;
        StewApp.runCommand(token, site);
        worker.port.emit("data", {
          usage: TopDomains.computeMonthlyUsage(),
          pledges: PledgedSites.getPledgeData(),
        });
      });
    },
  }
};

let LandingPage = {
  init: function() {
    Factory(this.factory);
    PageMod(this.page);
  },

  factory: {
    contract: "@mozilla.org/network/protocol/about;1?what=s2w-landing",

    Component: Class({
      extends: Unknown,
      interfaces: ["nsIAboutModule"],

      newChannel: function(uri) {
        let chan = Services.io.newChannel(data.url("s2w-landing.html"), null, null);
        chan.originalURI = uri;
        return chan;
      },

      getURIFlags: function(uri) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
      }
    })
  },
  page: {
    // load scripts
    contentScriptFile: [
      data.url("jquery/jquery.min.js"),
      data.url("jquery/jquery.jqplot.min.js"),
      data.url("jquery/jqplot.pieRenderer.min.js"),
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
    ],

    include: ["about:s2w-landing"],

    contentScriptWhen: "start",

    onAttach: function(worker) {
      // inject styles
      worker.port.emit("style", data.url("css/bootstrap.min.css"));
      worker.port.emit("style", data.url("css/bootstrap-theme.min.css"));
      worker.port.emit("style", data.url("css/styles.css"));
      worker.port.emit("style", data.url("jquery/jquery.jqplot.min.css"));

      worker.port.emit("data", {
        usage: TopDomains.computeMonthlyUsage(),
        pledges: PledgedSites.getPledgeData(),
      });

      worker.port.on("command", function (data) {
        let {token, site} = data;
        StewApp.runCommand(token, site);
      });
    },
  }
};

let MagstorePage = {
  init: function() {
    Factory(this.factory);
    PageMod(this.page);
  },

  factory: {
    contract: "@mozilla.org/network/protocol/about;1?what=s2w-magstore",

    Component: Class({
      extends: Unknown,
      interfaces: ["nsIAboutModule"],

      newChannel: function(uri) {
        let chan = Services.io.newChannel(data.url("s2w-magstore.html"), null, null);
        chan.originalURI = uri;
        return chan;
      },

      getURIFlags: function(uri) {
        return Ci.nsIAboutModule.URI_SAFE_FOR_UNTRUSTED_CONTENT;
      }
    })
  },
  page: {
    // load scripts
    contentScriptFile: [
      //data.url("jquery/jquery.min.js"),
      data.url("js/angular.min.js"),
      data.url("js/app.js"),
    ],

    include: ["about:s2w-magstore*"],

    contentScriptWhen: "start",

    onAttach: function(worker) {
      // inject styles
      worker.port.emit("style", data.url("css/bootstrap.min.css"));
      worker.port.emit("style", data.url("css/bootstrap-theme.min.css"));
      worker.port.emit("style", data.url("css/styles.css"));

      let monthlyUsage = TopDomains.computeMonthlyUsage();
      worker.port.emit("data", {
        usage: TopDomains.computeMonthlyUsage(),
        pledges: PledgedSites.getPledgeData(),
      });

      worker.port.on("command", function (data) {
        let {token, site} = data;
        StewApp.runCommand(token, site);
        worker.port.emit("data", {
          usage: TopDomains.computeMonthlyUsage(),
          pledges: PledgedSites.getPledgeData(),
        });
      });

      worker.port.on("configure", function (site) {
        tabs.open("about:s2w-dashboard#anchor_" + site);
      });
    },
  }
};

let StewApp = {

  handlePageShow:  function(url) {
    if (url == null || url.startsWith("about:")) {
      PledgeButton.setCurrentSite(null);
      return;
    }

    try {
      let uri = NetUtil.newURI(url);
      let base = Services.eTLD.getBaseDomainFromHost(uri.host);
      let siteInfo = Cu.cloneInto(PledgedSites.getPledgedSite(base), {});
      PledgeButton.setCurrentSite(siteInfo);
    }
    catch (e) {
      dump(e + " ERROR\b");
      throw Error(e);
    }
  },

  setupContentPolicy: function() {
   ({
      classDescription: "about:s2w content policy",
      // how is this set?
      classID: components.ID("d27de1fd-f2cc-4f84-be48-65d2510123b5"),
      contractID: "@mozilla.org/s2w/content-policy;1",
      QueryInterface: XPCOMUtils.generateQI([Ci.nsIContentPolicy, Ci.nsIFactory]),

      init: function() {
        let registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
        registrar.registerFactory(this.classID, this.classDescription, this.contractID, this);

        let catMan = Cc["@mozilla.org/categorymanager;1"].getService(Ci.nsICategoryManager);
        catMan.addCategoryEntry("content-policy", this.contractID, this.contractID, false, true);

        unload.when(function() {
          catMan.deleteCategoryEntry("content-policy", this.contractID, false);

          // This needs to run asynchronously, see bug 753687
          Services.tm.currentThread.dispatch(function() {
            registrar.unregisterFactory(this.classID, this);
          }.bind(this), Ci.nsIEventTarget.DISPATCH_NORMAL);
        }.bind(this));
      },

      shouldLoad: function(contentType, contentLocation, requestOrigin, context, mimeTypeGuess, extra) {
        try {
          // Ignore top level browser document loads
          if (contentType == Ci.nsIContentPolicy.TYPE_DOCUMENT) {
            return Ci.nsIContentPolicy.ACCEPT;
          }

          // Return to normal behavior (not blocking) for private browsing windows
          let topWindow = (context.ownerDocument || context).defaultView.top;
          if (privateBrowsing.isPrivate(topWindow)) {
            return Ci.nsIContentPolicy.ACCEPT;
          }

          // Ignore requests that share a base domain
          let trackerDomain = Services.eTLD.getBaseDomain(contentLocation);
          let topLevel = topWindow.location.host;
          let contextDomain = Services.eTLD.getBaseDomainFromHost(topLevel);
          if (trackerDomain == contextDomain) {
            return Ci.nsIContentPolicy.ACCEPT;
          }
          let pledgeInfo = PledgedSites.getPledgedSite(contextDomain);
          // reject if trackerDomain is in Ad placing list and context domain blocks ads
          // dump("testing " + trackerDomain + " " + contentLocation.host + " " + contentLocation.path + "\n");
          if (pledgeInfo.canPledge &&
              !pledgeInfo.unblocked &&
              !pledgeInfo.unpledged &&
              Blockers[trackerDomain]) {
            dump("blocked " + trackerDomain + " on " + contextDomain + " " + contentLocation.host + " " + contentLocation.path + " <<<<<\n");
            pledgeInfo.blockedAdsCount ++;
            return Ci.nsIContentPolicy.REJECT_REQUEST;
          }
        }
        catch(ex) {}
        return Ci.nsIContentPolicy.ACCEPT;
      },

      shouldProcess: function(contentType, contentLocation, requestOrigin, context, mimeType, extra) {
        return Ci.nsIContentPolicy.ACCEPT;
      },

      createInstance: function(outer, iid) {
        if (outer) {
          throw Cr.NS_ERROR_NO_AGGREGATION;
        }
        return this.QueryInterface(iid);
      }
    }).init();
  },

  beginStew: function() {
    DebugPage.init();
    LandingPage.init();
    DashPage.init();
    MagstorePage.init();
    PledgeButton.init(this);
    PledgedSites.init();
    this.setupContentPolicy();

    tabs.on('load', (tab) => {
      if (tab == tabs.activeTab) {
        this.handlePageShow(tab.url);
      }
    });

    tabs.on('activate', (tab) => {
      this.handlePageShow(tab.url);
    });

    if (!simplePrefs.prefs.uuid) {
      // generate and store a UUID for this user agent if it doesn't exist
      simplePrefs.prefs.uuid = uuid.generateUUID().toString().slice(1, -1).replace(/-/g, "");
    }

    AddonManager.getAddonByID(id, addon => {
      if (addon) {
        storage.installDate = "" + addon.installDate;
        storage.updateDate = "" + addon.updateDate;
        storage.version = "" + addon.version;
      }
    });

    Services.obs.addObserver(this, kIdleDaily, false);
  },

  initStew: function() {
    storage.stewData.introOK = true;
    PledgedSites.init();
    this.assignParticipatingSites();
    this.introTab.close();
  },

  start: function() {
    if (!storage.stewData) {
      storage.stewData = {
        introOK: false
      };
      IntroPage.init();
      tabs.open({
        url: "about:s2w-intro",
        onOpen: function(tab) {
          this.introTab = tab;
          this.initStew();
          this.beginStew();
          tabs.open("http://www.engadget.com/");
          tabs.open("http://www.amazon.com/");
        }.bind(this),
      });
    }
    else {
      if (storage.stewData.introOK) {
        // if intro status is OK, start the he stew
        this.beginStew();
      }
      else {
        // a user ignored stew page all together - uninstall addon
        this.uninstall();
      }
    }
  },

  uninstall: function() {
    Services.obs.removeObserver(this, kIdleDaily);
    delete storage.stewData;
    delete storage.pledges;
    delete storage.installDay;
    delete storage.installDate;
    delete storage.updateDate;
    delete storage.version;
    AddonManager.getAddonByID(id, addon => {
      if (addon) {
        addon.uninstall();
      }
    });
  },

  assignParticipatingSites: function() {
    let locale = Services.prefs.getCharPref("general.useragent.locale");
    switch (locale) {
      case "se":
      case "sv-SE":
        locale = "se";
        break;
      case "pl":
        break;
      default:
        locale = "global";
        break;
    }
    let domains = TopDomains.getPackagedDomains()[locale];
    let sites = Object.keys(domains);
    for (var i = 0; i < sites.length; i += 3) {
      PledgedSites.setCanPledge(sites[i]);
    }
  },

  runCommand: function(token, site) {
    switch (token) {
      case "offered":
        PledgedSites.addOffered(site);
        break;
      case "unblock":
        PledgedSites.setUnblocked(site, true);
        if (!tabs.activeTab.url.startsWith("about:")) {
          tabs.activeTab.reload();
        }
        break;
      case "reblock":
        PledgedSites.setUnblocked(site, false);
        if (!tabs.activeTab.url.startsWith("about:")) {
          tabs.activeTab.reload();
        }
        break;
      case "unpledge":
        PledgedSites.setUnpledged(site, true);
        break;
      case "nominate":
        PledgedSites.nominate(site);
        break;
      case "clear":
        PledgedSites.clearSite(site);
        break;
      case "dash-board":
        tabs.open("about:s2w-dashboard");
        break;
      case "mag-store":
        tabs.open("about:s2w-magstore");
        break;
      case "landing":
        tabs.open("about:s2w-landing");
        break;
      case "send":
        this.send();
        break;
      case "uninstall":
        // @TODO it may be better to walk tabs and close all s2w tabs
        if (tabs.activeTab.url == "about:s2w-dashboard") {
          tabs.activeTab.close();
        }
        StewApp.uninstall();
        break;
     }
  },

  observe: function _observe(aSubject, aTopic, aData) {
    if (aTopic == kIdleDaily) {
      this.send();
    }
  },

  send: function() {
    Dispatcher.send(simplePrefs.prefs.server_url);
  },

};

exports.StewApp = StewApp;


