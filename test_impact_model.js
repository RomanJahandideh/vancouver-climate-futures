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
  fireRisk, waterScarcity, shorelineOutlook, computeOutcome,
  HOT_DAYS_BY_HORIZON,
} = require("./impact_model.js");

let PASS = 0, FAIL = 0;
function check(name, cond) {
  if (cond) { PASS++; console.log("PASS:", name); }
  else { FAIL++; console.log("FAIL:", name); }
}

const HORIZONS = ["2050s", "2080s"];
const POLICIES = ["status_quo", "proactive"];

// --- exhaustive monotonicity: worse horizon (2080s) must never IMPROVE
// any risk index relative to 2050s, for every fixed policy combination ---
let fireHorizonViolations = 0, waterHorizonViolations = 0, shorelineHorizonViolations = 0, heatHorizonViolations = 0;
for (const firePolicy of POLICIES) {
  for (const waterPolicy of POLICIES) {
    for (const shorelinePolicy of POLICIES) {
      const near = computeOutcome({ horizon: "2050s", firePolicy, waterPolicy, shorelinePolicy });
      const far = computeOutcome({ horizon: "2080s", firePolicy, waterPolicy, shorelinePolicy });
      if (far.fire.index < near.fire.index) fireHorizonViolations++;
      if (far.water.index < near.water.index) waterHorizonViolations++;
      if (far.shoreline.typicalLateSummerLevel > near.shoreline.typicalLateSummerLevel) shorelineHorizonViolations++;
      if (far.shoreline.heatExposureIndex < near.shoreline.heatExposureIndex) heatHorizonViolations++;
    }
  }
}
check("fire risk never improves from 2050s->2080s, across all 8 policy combos (0 violations)", fireHorizonViolations === 0);
check("water scarcity never improves from 2050s->2080s, across all 8 policy combos (0 violations)", waterHorizonViolations === 0);
check("lake level never improves (rises) from 2050s->2080s, across all 8 policy combos (0 violations)", shorelineHorizonViolations === 0);
check("heat exposure never improves from 2050s->2080s, across all 8 policy combos (0 violations)", heatHorizonViolations === 0);

// --- exhaustive monotonicity: proactive policy must never make ITS
// OWN act's index worse than status_quo, for every fixed horizon and
// every combination of the OTHER two acts' policies ---
let firePolicyViolations = 0, waterPolicyViolations = 0, shorelinePolicyViolations = 0;
for (const horizon of HORIZONS) {
  for (const waterPolicy of POLICIES) {
    for (const shorelinePolicy of POLICIES) {
      const sq = computeOutcome({ horizon, firePolicy: "status_quo", waterPolicy, shorelinePolicy });
      const pro = computeOutcome({ horizon, firePolicy: "proactive", waterPolicy, shorelinePolicy });
      if (pro.fire.index > sq.fire.index) firePolicyViolations++;
    }
  }
  for (const firePolicy of POLICIES) {
    for (const shorelinePolicy of POLICIES) {
      const sq = computeOutcome({ horizon, firePolicy, waterPolicy: "status_quo", shorelinePolicy });
      const pro = computeOutcome({ horizon, firePolicy, waterPolicy: "proactive", shorelinePolicy });
      if (pro.water.index > sq.water.index) waterPolicyViolations++;
    }
  }
  for (const firePolicy of POLICIES) {
    for (const waterPolicy of POLICIES) {
      const sq = computeOutcome({ horizon, firePolicy, waterPolicy, shorelinePolicy: "status_quo" });
      const pro = computeOutcome({ horizon, firePolicy, waterPolicy, shorelinePolicy: "proactive" });
      if (pro.shoreline.typicalLateSummerLevel < sq.shoreline.typicalLateSummerLevel) shorelinePolicyViolations++;
    }
  }
}
check("proactive fire policy never raises fire risk, across all 2x4 other-choice combos (0 violations)", firePolicyViolations === 0);
check("proactive water policy never raises water scarcity, across all 2x4 other-choice combos (0 violations)", waterPolicyViolations === 0);
check("proactive shoreline policy never lowers the typical lake level, across all 2x4 other-choice combos (0 violations)", shorelinePolicyViolations === 0);

// --- boundary/identity checks: exact formula behaviour, not just direction ---
const f2080 = fireRisk("2080s", "status_quo");
check("hotDaysFactor is exactly 40 at the 2080s horizon (hotDays/hotDays2080 == 1)", f2080.hotDaysFactor === 40);
const w2080 = waterScarcity("2080s", "status_quo");
check("2080s uses the full cited -23% precipitation reduction, not the 2050s-interpolated fraction", w2080.precipReductionPct === 23);
const s2050status = shorelineOutlook("2050s", "status_quo");
const s2050proactive = shorelineOutlook("2050s", "proactive");
check("shoreline level stays within [lowest_desirable - 0.3, full_pool] at every tested point",
  s2050status.typicalLateSummerLevel <= 342.48 && s2050status.typicalLateSummerLevel >= 340.1 &&
  s2050proactive.typicalLateSummerLevel <= 342.48 && s2050proactive.typicalLateSummerLevel >= 340.1);

// --- composite index: must equal the mean of its three real components, not an approximation ---
const outcome = computeOutcome({ horizon: "2080s", firePolicy: "status_quo", waterPolicy: "status_quo", shorelinePolicy: "status_quo" });
const expectedComposite = Math.round((outcome.fire.index + outcome.water.index + outcome.shoreline.heatExposureIndex) / 3);
check("composite risk index is exactly the mean of the three act indices", outcome.compositeRiskIndex === expectedComposite);

// --- worst-case vs best-case sanity: the single best combination
// (2050s, proactive everywhere) must strictly beat the single worst
// (2080s, status_quo everywhere) on every one of the three act indices ---
const best = computeOutcome({ horizon: "2050s", firePolicy: "proactive", waterPolicy: "proactive", shorelinePolicy: "proactive" });
const worst = computeOutcome({ horizon: "2080s", firePolicy: "status_quo", waterPolicy: "status_quo", shorelinePolicy: "status_quo" });
check("best combination strictly beats worst on fire risk", best.fire.index < worst.fire.index);
check("best combination strictly beats worst on water scarcity", best.water.index < worst.water.index);
check("best combination strictly beats worst on lake level", best.shoreline.typicalLateSummerLevel > worst.shoreline.typicalLateSummerLevel);
check("best combination strictly beats worst on composite risk index", best.compositeRiskIndex < worst.compositeRiskIndex);

console.log("\n%d passed, %d failed", PASS, FAIL);
console.log("\nH3 %s: the impact model is monotonic, in the direction the cited regional science implies, "
  + "across the FULL 16-combination choice space (0 violations found in any of the exhaustive checks above), "
  + "not merely in a sampled or anecdotal example.", FAIL === 0 ? "CONFIRMED" : "NOT CONFIRMED");
if (FAIL) process.exit(1);
