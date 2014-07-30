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


  $scope.addParticipatingSite = function monthlyPledge() {
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

  self.port.on("pledgedSites", function(pledgeData) {
    $scope.$apply(_ => {
      $scope.pledgedSites = pledgeData.sites;
      $scope.pledgedSitesKeys = Object.keys(pledgeData.sites).reverse();
      $scope.monthlyPledgeAmount = pledgeData.amount;
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
      $scope.pledgedSiteDialog = siteData.pledged;
      $scope.nominateSiteDialog = (!siteData.canPledge && !siteData.nominated);
      $scope.introPledge = (siteData.canPledge && !siteData.pledged && !siteData.canceledForEver);
      if ($scope.introPledge) {
        self.port.emit("command", {token: "offered", site: siteData.host});
      }
    });
  });
});

pledgedSitesApp.controller("dashboardCtrl", function($scope) {
  $scope.showChart = true;

  $scope.toggelChart = function() {
    if ($scope.showChart) {
      $scope.showChart = false;
      $("#chartButton").text("Show");
    }
    else {
      $scope.showChart = true;
      $("#chartButton").text("Hide");
    }
  }

  $scope.passon = function(token, site) {
    self.port.emit("command", {token: token, site: site});
  }

  self.port.on("data", function(data) {
    let {usage, pledges} = data;
    let domains = usage.domains;
    let total = usage.total;
    let sorted = [];

    Object.keys(domains).sort(function(a, b) {
      return domains[b] - domains[a];
    }).forEach(domain => {
      sorted.push([domain, domains[domain], pledges.sites[domain]]);
    });

    $scope.$apply(_ => {
      $scope.usage = usage;
      $scope.sites = sorted.slice(0,50);
    });

    let topSites = [];
    sorted.slice(0, 12).forEach(item => {
      total -= item[1];
      topSites.push([item[0], item[1]]);
    });
    // add ... for the rest of the sites
    topSites.push(["...", total]);

    $("#visitChart").empty();
    // draw a pie chart
    let catsPie = $.jqplot("visitChart", [topSites], {
      grid: {
        background: "transparent",
        drawBorder: false,
        shadow: false,
      },
      legend: {
        placement: "outsideGrid",
        show: true,
      },
      //seriesColors: seriesColors,
      seriesDefaults: {
        renderer: $.jqplot.PieRenderer,
        rendererOptions: {
          dataLabelPositionFactor: .6,
          dataLabelThreshold: 4,
          highlightMouseOver: false,
          showDataLabels: true,
          sliceMargin: 2,
          startAngle: -90,
        },
        shadow: false,
      },
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
