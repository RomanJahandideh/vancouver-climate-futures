/**
 * RQ3 / H3: the deterministic impact model must be monotonic, in the
 * direction the cited regional science implies, everywhere in the
 * choice space, not just in a couple of anecdotal examples. Checked
 * exhaustively over the full 2 (horizon) x 2x2x2 (per-act policy)
 * combination space: 16 full outcomes, plus pairwise comparisons
 * within every matched pair that differs by exactly one variable.
 *
 * Run with: node test_impact_model.js
 */
const {
  floodRisk, heatExposure, energyVulnerability, computeOutcome, floodRiskToWaterLevel,
  SEA_LEVEL_RISE_M, FCL_M, FALSE_CREEK_BASELINE_M,
} = require("./impact_model.js");

let PASS = 0, FAIL = 0;
function check(name, cond) {
  if (cond) { PASS++; console.log("PASS:", name); }
  else { FAIL++; console.log("FAIL:", name); }
}

const HORIZONS = ["2050s", "2100s"];
const POLICIES = ["status_quo", "proactive"];

// --- exhaustive monotonicity: worse horizon (2100s) must never IMPROVE
// any risk index relative to 2050s, for every fixed policy combination ---
let floodHorizonViolations = 0, heatHorizonViolations = 0, energyHorizonViolations = 0, waterLevelHorizonViolations = 0;
for (const floodPolicy of POLICIES) {
  for (const heatPolicy of POLICIES) {
    for (const energyPolicy of POLICIES) {
      const near = computeOutcome({ horizon: "2050s", floodPolicy, heatPolicy, energyPolicy });
      const far = computeOutcome({ horizon: "2100s", floodPolicy, heatPolicy, energyPolicy });
      if (far.flood.index < near.flood.index) floodHorizonViolations++;
      if (far.heat.index < near.heat.index) heatHorizonViolations++;
      if (far.energy.index < near.energy.index) energyHorizonViolations++;
      if (far.falseCreekWaterLevelM < near.falseCreekWaterLevelM) waterLevelHorizonViolations++;
    }
  }
}
check("flood risk never improves from 2050s->2100s, across all 8 policy combos (0 violations)", floodHorizonViolations === 0);
check("heat exposure never improves from 2050s->2100s, across all 8 policy combos (0 violations)", heatHorizonViolations === 0);
check("energy vulnerability never improves from 2050s->2100s, across all 8 policy combos (0 violations)", energyHorizonViolations === 0);
check("False Creek water level never falls from 2050s->2100s, across all 8 policy combos (0 violations)", waterLevelHorizonViolations === 0);

// --- exhaustive monotonicity: proactive policy must never make ITS
// OWN act's index worse than status_quo, for every fixed horizon and
// every combination of the OTHER two acts' policies ---
let floodPolicyViolations = 0, heatPolicyViolations = 0, energyPolicyViolations = 0;
for (const horizon of HORIZONS) {
  for (const heatPolicy of POLICIES) {
    for (const energyPolicy of POLICIES) {
      const sq = computeOutcome({ horizon, floodPolicy: "status_quo", heatPolicy, energyPolicy });
      const pro = computeOutcome({ horizon, floodPolicy: "proactive", heatPolicy, energyPolicy });
      if (pro.flood.index > sq.flood.index) floodPolicyViolations++;
    }
  }
  for (const floodPolicy of POLICIES) {
    for (const energyPolicy of POLICIES) {
      const sq = computeOutcome({ horizon, floodPolicy, heatPolicy: "status_quo", energyPolicy });
      const pro = computeOutcome({ horizon, floodPolicy, heatPolicy: "proactive", energyPolicy });
      if (pro.heat.index > sq.heat.index) heatPolicyViolations++;
    }
  }
  for (const floodPolicy of POLICIES) {
    for (const heatPolicy of POLICIES) {
      const sq = computeOutcome({ horizon, floodPolicy, heatPolicy, energyPolicy: "status_quo" });
      const pro = computeOutcome({ horizon, floodPolicy, heatPolicy, energyPolicy: "proactive" });
      if (pro.energy.index > sq.energy.index) energyPolicyViolations++;
    }
  }
}
check("proactive coastal policy never raises flood risk, across all 2x4 other-choice combos (0 violations)", floodPolicyViolations === 0);
check("proactive canopy policy never raises heat exposure, across all 2x4 other-choice combos (0 violations)", heatPolicyViolations === 0);
check("proactive retrofit policy never raises energy vulnerability, across all 2x4 other-choice combos (0 violations)", energyPolicyViolations === 0);

// --- boundary/identity checks: exact formula behaviour, not just direction ---
const f2100 = floodRisk("2100s", "status_quo");
check("seaLevelFactor is exactly 45 at the 2100s horizon (SLR/SLR2100 == 1)", f2100.seaLevelFactor === 45);
check("2100s uses the full real cited 1m sea level rise figure", f2100.seaLevelRiseM === SEA_LEVEL_RISE_M["2100s"]);
check("2050s uses the real cited 0.5m sea level rise figure", floodRisk("2050s", "status_quo").seaLevelRiseM === 0.5);

// floodRiskToWaterLevel must stay within the real cited FCL ceiling and the illustrative baseline floor.
check("floodRiskToWaterLevel(0) == the illustrative baseline exactly", floodRiskToWaterLevel(0) === FALSE_CREEK_BASELINE_M);
check("floodRiskToWaterLevel(100) == the real cited FCL exactly", floodRiskToWaterLevel(100) === FCL_M);
const midLevel = floodRiskToWaterLevel(50);
check("floodRiskToWaterLevel(50) is exactly halfway between baseline and the real FCL",
  Math.abs(midLevel - (FALSE_CREEK_BASELINE_M + (FCL_M - FALSE_CREEK_BASELINE_M) / 2)) < 1e-6);

// --- composite index: must equal the mean of its three real components, not an approximation ---
const outcome = computeOutcome({ horizon: "2100s", floodPolicy: "status_quo", heatPolicy: "status_quo", energyPolicy: "status_quo" });
const expectedComposite = Math.round((outcome.flood.index + outcome.heat.index + outcome.energy.index) / 3);
check("composite risk index is exactly the mean of the three act indices", outcome.compositeRiskIndex === expectedComposite);

// --- worst-case vs best-case sanity: the single best combination
// (2050s, proactive everywhere) must strictly beat the single worst
// (2100s, status_quo everywhere) on every one of the three act indices ---
const best = computeOutcome({ horizon: "2050s", floodPolicy: "proactive", heatPolicy: "proactive", energyPolicy: "proactive" });
const worst = computeOutcome({ horizon: "2100s", floodPolicy: "status_quo", heatPolicy: "status_quo", energyPolicy: "status_quo" });
check("best combination strictly beats worst on flood risk", best.flood.index < worst.flood.index);
check("best combination strictly beats worst on heat exposure", best.heat.index < worst.heat.index);
check("best combination strictly beats worst on energy vulnerability", best.energy.index < worst.energy.index);
check("best combination strictly beats worst on composite risk index", best.compositeRiskIndex < worst.compositeRiskIndex);

console.log("\n%d passed, %d failed", PASS, FAIL);
console.log("\nH3 %s: the impact model is monotonic, in the direction the cited regional science implies, "
  + "across the FULL 16-combination choice space (0 violations found in any of the exhaustive checks above), "
  + "not merely in a sampled or anecdotal example.", FAIL === 0 ? "CONFIRMED" : "NOT CONFIRMED");
if (FAIL) process.exit(1);
