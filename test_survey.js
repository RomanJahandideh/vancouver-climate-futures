/**
 * Verifies the survey scoring logic (reverse-scoring, averaging,
 * completeness checking, CSV formatting) against hand-computed cases
 * before it is trusted anywhere else. Pure logic, no DOM needed.
 *
 * Run with: node test_survey.js
 */
const { NEP_ITEMS, POLICY_ITEMS, scoreNEP, scorePolicySupport, isComplete, toCsvRow, csvHeader, ALL_ITEMS } = require("./survey.js");

let PASS = 0, FAIL = 0;
function check(name, cond) {
  if (cond) { PASS++; console.log("PASS:", name); }
  else { FAIL++; console.log("FAIL:", name); }
}

check("NEP item set has exactly 6 items", NEP_ITEMS.length === 6);
check("NEP item set has exactly 3 reverse-scored items (a balanced pro/anti set, per the scale's design)",
  NEP_ITEMS.filter((i) => i.reverse).length === 3);
check("POLICY item set has exactly 3 items, one per act", POLICY_ITEMS.length === 3);
check("ALL_ITEMS is the concatenation of both", ALL_ITEMS.length === 9);

// Hand-computed reversal check: all items answered "5" (strongly agree).
// Pro-NEP items stay 5; anti-NEP items reverse to 6-5=1.
// Mean of [5,1,5,1,5,1] = 3.0 exactly.
const allFives = {};
NEP_ITEMS.concat(POLICY_ITEMS).forEach((item) => { allFives[item.id] = 5; });
check("scoreNEP reverses anti-NEP items correctly (all-5 input -> mean 3.0 exactly)", scoreNEP(allFives) === 3.0);

// All-1 input: pro-NEP items stay 1; anti-NEP items reverse to 6-1=5.
// Mean of [1,5,1,5,1,5] = 3.0 exactly (same mean, by construction, a
// useful property of a balanced pro/anti scale: acquiescence bias
// alone doesn't move the score).
const allOnes = {};
NEP_ITEMS.concat(POLICY_ITEMS).forEach((item) => { allOnes[item.id] = 1; });
check("scoreNEP: all-1 input also averages to 3.0 (balanced-scale acquiescence check)", scoreNEP(allOnes) === 3.0);

// A genuinely strong pro-ecological responder: pro-NEP items = 5,
// anti-NEP items = 1 (so they reverse to 5 too). Mean should be 5.0.
const strongPro = {};
NEP_ITEMS.forEach((item) => { strongPro[item.id] = item.reverse ? 1 : 5; });
check("scoreNEP: a consistent strong pro-ecological responder scores exactly 5.0", scoreNEP(strongPro) === 5.0);

// Policy score: straightforward mean, hand-checked.
const policyResponses = { policy_heat: 4, policy_energy: 2, policy_flood: 3 };
check("scorePolicySupport: mean of [4,2,3] == 3.0 exactly", scorePolicySupport(policyResponses) === 3.0);

// Missing-data handling: an incomplete response set must return null,
// not silently average over fewer items (which would misrepresent the
// scale, since the NEP and policy scores are only comparable across
// participants if every participant answered every item).
const incomplete = Object.assign({}, allFives);
delete incomplete.nep3;
check("scoreNEP returns null (not a silently-partial average) when an item is missing", scoreNEP(incomplete) === null);
check("isComplete correctly flags a missing item", isComplete(incomplete) === false);
check("isComplete correctly passes a fully-answered set", isComplete(allFives) === true);

// CSV formatting: header field count must match row field count.
const headerFieldCount = csvHeader().split(",").length;
const row = toCsvRow({
  participant_id: "p1", condition: "interactive", timestamp: "2026-01-01T00:00:00Z",
  pre_nep_score: 3.2, post_nep_score: 3.8, pre_policy_score: 3.0, post_policy_score: 3.7,
  horizon: "2080s", fire_policy: "proactive", water_policy: "status_quo", shoreline_policy: "proactive",
  fire_risk_index: 42, water_scarcity_index: 55, shoreline_level_m: 341.2, composite_risk_index: 50,
});
const rowFieldCount = row.split(",").length;
check("CSV header and a real data row have the same field count (%d)".replace("%d", String(headerFieldCount)),
  headerFieldCount === rowFieldCount);

console.log("\n%d passed, %d failed", PASS, FAIL);
if (FAIL) process.exit(1);
