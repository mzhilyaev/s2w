"use strict";

let pledgedSitesApp = angular.module("pledgedSitesApp", []);

pledgedSitesApp.filter('escape', function() {
  return window.escape;
});

pledgedSitesApp.controller("introCtl", function($scope) {
  $scope.startStudy = function startStudy() {
    self.port.emit("startStudy");
  }

  $scope.cancelStudy = function cancelStudy() {
    self.port.emit("cancelStudy");
  }
});

pledgedSitesApp.controller("pledgedSitesCtrl", function($scope) {
  $scope.pledgedSites = null;

  $scope.clear = function clear(site) {
    if (window.confirm(site + " will be removed from you pledges starting next month")) {
      self.port.emit("unpledge", site);
    }
  }

  $scope.monthlyPledge = function monthlyPledge() {
    self.port.emit("next-month-pledge-amount", $scope.nextMonthPledgeAmount);
  }

  self.port.on("pledgedSites", function(pledgeData) {
    $scope.$apply(_ => {
      $scope.pledgedSites = pledgeData.sites;
      $scope.pledgedSitesKeys = Object.keys(pledgeData.sites);
      $scope.monthlyPledgeAmount = pledgeData.amount;
      $scope.nextMonthPledgeAmount = pledgeData.nextMonthAmount || pledgeData.amount;
      $scope.pledgedSitesKeys.forEach((host) => {
        let siteInfo = pledgeData.sites[host];
        siteInfo.dollars = Math.round(pledgeData.amount * siteInfo.percentage) / 100 || 0;
      });
      $scope.pledgedSitesStr = JSON.stringify($scope.pledgedSites);
    });
  });
});

pledgedSitesApp.controller("pledgedSitesCtrlDebug", function($scope) {
  $scope.pledgedSites = null;

  $scope.showData = function showData() {
    self.port.emit("submissionData");
  }

  $scope.hideData = function hideData() {
    $scope.submissionData = null;
  }

  $scope.sendData = function sendData() {
    self.port.emit("send");
  }

  $scope.addSite = function() {
    self.port.emit("participate", $scope.newsite);
  }

  $scope.clearSite = function(site) {
    self.port.emit("clearsite", site || $scope.newsite);
  }

  $scope.deleteSite = function(site) {
    self.port.emit("deletesite", site || $scope.newsite);
  }

  $scope.clearAll = function() {
    self.port.emit("clearall", $scope.newsite);
  }

  $scope.reassign = function() {
    self.port.emit("reassign", $scope.newsite);
  }

  self.port.on("pledgedSites", function(pledgeData) {
    $scope.$apply(_ => {
      $scope.pledgedSites = pledgeData.sites;
      $scope.pledgedSitesKeys = Object.keys(pledgeData.sites).reverse();
      $scope.monthlyPledgeAmount = pledgeData.amount;
    });
  });

  self.port.on("submissionData", function(data) {
    $scope.$apply(_ => {
      $scope.submissionData = JSON.stringify(data, null, 1);
    });
  });
});

pledgedSitesApp.controller("pledgePanelCtr", function($scope) {
  $scope.passon = function passon(token) {
    self.port.emit("command", {token: token, site: $scope.siteInfo.host});
  }

  self.port.on("siteInfo", function(siteData) {
    $scope.$apply(_ => {
      $scope.siteInfo = siteData;
      $scope.pledgedSiteDialog = siteData.canPledge;
      $scope.nominateSiteDialog = (!siteData.canPledge && !siteData.nominated);
      self.port.emit("command", {token: "offered", site: siteData.host});
    });
  });
});

pledgedSitesApp.controller("dashboardCtrl", function($scope) {

  $scope.passon = function(token, site) {
    self.port.emit("command", {token: token, site: site});
  }

  $scope.toggleNominatedList = function() {
    $scope.showNominated = !($scope.showNominated);
  }

  self.port.on("data", function(data) {
    let {usage, pledges} = data;
    let domains = usage.domains;
    let topSites = [];
    let sorted = [];
    let visited = {};
    let nominated = [];

    // populate sorted with visited participating sites first
    Object.keys(domains).sort(function(a, b) {
      return domains[b] - domains[a];
    }).forEach(domain => {
      // only collect sites that are pledged
      if (pledges.sites[domain] && pledges.sites[domain].canPledge) {
        sorted.push([domain, domains[domain], pledges.sites[domain]]);
        visited[domain] = true;
        topSites.push([domain, domains[domain]]);
      }
    });

    // add participating sites that were not visited
    Object.keys(pledges.sites).forEach(domain => {
      if (!visited[domain] && pledges.sites[domain].canPledge) {
        sorted.push([domain, 0, pledges.sites[domain]]);
      }
      // add nominated sites
      else if (pledges.sites[domain].nominated) {
        nominated.push([domain, domains[domain]]);
      }
    });

    $scope.$apply(_ => {
      $scope.usage = usage;
      $scope.sites = sorted;
      $scope.nominated = nominated;
    });
  });
});


pledgedSitesApp.controller("magstoreCtrl", function($scope) {

  $scope.passon = function(token, site) {
    self.port.emit("command", {token: token, site: site});
  }

  $scope.configure = function(site) {
    self.port.emit("configure", site);
  }

  self.port.on("data", function(data) {
    let {usage, pledges} = data;
    let domains = usage.domains;
    let sorted = [];
    let visited = {};

    // populate sorted with visited participating sites first
    Object.keys(domains).sort(function(a, b) {
      return domains[b] - domains[a];
    }).forEach(domain => {
      // only collect sites that are pledged
      if (pledges.sites[domain] && pledges.sites[domain].canPledge) {
        sorted.push([domain, domains[domain], pledges.sites[domain]]);
        visited[domain] = true;
      }
    });

    // add participating sites that were not visited
    Object.keys(pledges.sites).forEach(domain => {
      if (!visited[domain] && pledges.sites[domain].canPledge) {
        sorted.push([domain, 0, pledges.sites[domain]]);
      }
    });

    $scope.$apply(_ => {
      $scope.sites = sorted;
    });
  });
});

//angular.bootstrap(document, ['pledgedSitesApp']);

// Low-level data injection
self.port.on("style", function(file) {
  let link = document.createElement("link");
  link.setAttribute("href", file);
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  document.head.appendChild(link);
});
