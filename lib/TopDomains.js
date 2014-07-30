const {Class} = require("sdk/core/heritage");

const {Cc, Ci, Cu, ChromeWorker} = require("chrome");
Cu.import("resource://gre/modules/PlacesUtils.jsm")
Cu.import("resource://gre/modules/Services.jsm");

const MicroSecondsPerDay = 86400000000

let TopDomains = {
  computeTopSites: function() {
    let seen = {};
    let sorted = [];
    
    let stmt = PlacesUtils.history.DBConnection.createStatement(
      "SELECT host " +
      "FROM moz_hosts " +
      "ORDER BY frecency DESC " +
      "LIMIT 100");
    while (stmt.executeStep()) {
      try {
        let base = Services.eTLD.getBaseDomainFromHost(stmt.row.host);
        if (seen[base]) {
          continue;
        }

        seen[base] = true;
        sorted.push(base);
      }
      catch(ex) {}
    }
    return sorted;
  },

  computeMonthlyUsage: function() {
    let results = {total: 0, domains: {}};
    let daysAgoMicroSeconds = Date.now() * 1000 - 30 * MicroSecondsPerDay;
    let query = 
      "SELECT rev_host, count(1) cnt " +
      "FROM moz_historyvisits v, moz_places p " +
      "WHERE v.place_id = p.id " +
      "AND v.visit_date > " + daysAgoMicroSeconds + " " +
      "AND p.hidden = 0 " +
      "GROUP BY rev_host";
    let stmt = PlacesUtils.history.DBConnection.createStatement(query);
    while (stmt.executeStep()) {
      try {
        let host = stmt.row.rev_host.split("").reverse().join("").substr(1);
        let base = Services.eTLD.getBaseDomainFromHost(host);
        results.total += stmt.row.cnt;
        if (!results.domains[base]) {
          results.domains[base] = 0;
        }
        results.domains[base] += stmt.row.cnt;
      } catch(ex) {}
    }
    return results;
  },
};

exports.TopDomains = TopDomains;
