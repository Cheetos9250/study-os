(function(root,factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./study-os-planner.js"));
  else root.StudyOSPlanDiscovery = factory(root.StudyOSPlanner);
})(typeof globalThis !== "undefined" ? globalThis : this,function(planner) {
"use strict";
// Caller supplies the Bangkok-local date. No storage, network, or clock access.
function discoverPlans(sessions,today,horizonDays=7) {
  if (!planner || !Array.isArray(sessions) || !planner.validDate(today) || !Number.isInteger(horizonDays) || horizonDays < 0 || horizonDays > 90) throw new TypeError("invalid plan discovery input");
  const now = Date.parse(today+"T00:00:00Z");
  const cutoff = now+horizonDays*86400000;
  const result = {overdue:[],today:[],upcoming:[],completed:[]};
  for (const session of sessions) {
    planner.validateSession(session);
    const day = Date.parse(session.date+"T00:00:00Z");
    if (session.done) result.completed.push(session);
    else if (day < now) result.overdue.push(session);
    else if (day === now) result.today.push(session);
    else if (day <= cutoff) result.upcoming.push(session);
  }
  for (const group of Object.values(result)) {
    group.sort((a,b)=>a.date.localeCompare(b.date)||a.createdAt-b.createdAt||a.id.localeCompare(b.id));
    Object.freeze(group);
  }
  return Object.freeze(result);
}
return Object.freeze({discoverPlans});
});
