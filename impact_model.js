/**
 * Deterministic climate-impact model for the three acts of Vancouver
 * Climate Futures. Pure, side-effect-free functions, no randomness, no
 * AI in the loop: every index the player sees is computed here from
 * the player's choices and real, cited City of Vancouver / provincial
 * figures, then only narrated/visualized elsewhere.
 *
 * Cited figures:
 *   - Sea level rise: ~0.5m by 2050, ~1m by 2100 on the BC coast, and
 *     the City of Vancouver's real coastal Flood Construction Level of
 *     4.6m (Greater Vancouver Regional District datum), set to protect
 *     waterfront structures around Burrard Inlet, English Bay, False
 *     Creek and the Fraser River floodplain through 2100.
 *     (City of Vancouver Coastal Flood Risk Assessment; "Adapting to
 *     sea level rise", vancouver.ca/green-vancouver.)
 *   - The 2021 BC heat dome: 619 deaths province-wide, the deadliest
 *     weather event in BC history, and a documented urban-heat-island
 *     gap of roughly 20C between lower-tree-canopy neighbourhoods
 *     (e.g. Marpole) and higher-canopy ones (e.g. West Vancouver)
 *     during the event, tied to neighbourhood greenness, not just
 *     regional weather. (Peer-reviewed analyses of 2021 heat dome
 *     community deaths in Greater Vancouver.)
 *   - The City of Vancouver's real RARA grant program ($3.5M) funding
 *     heat-pump/electrification retrofits for existing market rental
 *     buildings. (vancouver.ca energy-resources-and-programs page.)
 *
 * This module uses these real, cited figures directly (0.5m/1m sea
 * level rise, the 4.6m flood construction level). It does NOT have a
 * source-specific "2050 vs 2100 heat severity" or "energy
 * vulnerability" figure at this granularity, those two acts' baseline/
 * horizon/policy coefficients are explicitly illustrative,
 * order-of-magnitude-reasonable placeholders, not claimed real model
 * outputs, the same "PLACEHOLDER, clearly labeled" discipline as
 * BASE_ELEV_M/SLOPE in vancouver-view-corridor-massing and the carbon/
 * wind proxies in environmental-massing-agents. The heat exposure index
 * is never framed as, or compared to, the real 2021 death toll; that
 * figure is cited only as real-world motivation for the act, never
 * reproduced as a game output.
 */

const SEA_LEVEL_RISE_M = { "2050s": 0.5, "2100s": 1.0 }; // real, cited BC coast projections
const FCL_M = 4.6; // real, City of Vancouver coastal Flood Construction Level (GVRD datum)
const FALSE_CREEK_BASELINE_M = 2.0; // illustrative low-water reference for the 3D visualization only

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

/** Act 1: coastal flood risk, False Creek foreshore. */
function floodRisk(horizon, policy) {
  const seaLevelRiseM = SEA_LEVEL_RISE_M[horizon];
  const baseRisk = 30; // illustrative baseline (PLACEHOLDER)
  const seaLevelFactor = (seaLevelRiseM / SEA_LEVEL_RISE_M["2100s"]) * 45; // scales with the real cited sea-level-rise figure
  const policyMitigation = policy === "proactive" ? 20 : 0; // illustrative effect of coastal green infrastructure / setbacks (the real Sea2City / False Creek Coastal Adaptation Plan approach)
  const index = clamp(baseRisk + seaLevelFactor - policyMitigation, 0, 100);
  return { index: Math.round(index), seaLevelRiseM, baseRisk, seaLevelFactor, policyMitigation };
}

/** Act 2: extreme-heat exposure, a lower-tree-canopy neighbourhood (Marpole-type). */
function heatExposure(horizon, policy) {
  const baseExposure = 30; // illustrative baseline (PLACEHOLDER)
  const horizonFactor = horizon === "2100s" ? 35 : 15; // illustrative: further-out horizon assumed more severe
  const policyMitigation = policy === "proactive" ? 20 : 0; // illustrative effect of tree-canopy/cooling investment, grounded in the real documented canopy-driven temperature gap
  const index = clamp(baseExposure + horizonFactor - policyMitigation, 0, 100);
  return { index: Math.round(index), horizonFactor, baseExposure, policyMitigation };
}

/** Act 3: building energy vulnerability, older rental housing stock. */
function energyVulnerability(horizon, policy) {
  const baseVulnerability = 40; // illustrative baseline (PLACEHOLDER)
  const horizonFactor = horizon === "2100s" ? 20 : 10; // illustrative: aging stock further out
  const policyMitigation = policy === "proactive" ? 25 : 0; // illustrative effect of heat-pump/electrification retrofits (the real RARA program)
  const index = clamp(baseVulnerability + horizonFactor - policyMitigation, 0, 100);
  return { index: Math.round(index), horizonFactor, baseVulnerability, policyMitigation };
}

/** Maps a flood risk index (0-100) to a local False Creek water level
 * for the 3D visualization, rising toward the real 4.6m Flood
 * Construction Level as risk increases. The 4.6m ceiling is real and
 * cited; the low-end baseline (2.0m) is an illustrative reference
 * chosen only to make the change visible, not a claimed real figure. */
function floodRiskToWaterLevel(floodIndex) {
  const t = floodIndex / 100;
  return Math.round((FALSE_CREEK_BASELINE_M + t * (FCL_M - FALSE_CREEK_BASELINE_M)) * 100) / 100;
}

/**
 * Full outcome for one playthrough: a horizon and a policy choice per
 * act (each act's policy choice is independent, mirroring Future Delta
 * 2.0's per-act "community choice" structure).
 */
function computeOutcome(choices) {
  const { horizon, floodPolicy, heatPolicy, energyPolicy } = choices;
  const flood = floodRisk(horizon, floodPolicy);
  const heat = heatExposure(horizon, heatPolicy);
  const energy = energyVulnerability(horizon, energyPolicy);
  const compositeRiskIndex = Math.round((flood.index + heat.index + energy.index) / 3);
  return {
    horizon, flood, heat, energy, compositeRiskIndex,
    falseCreekWaterLevelM: floodRiskToWaterLevel(flood.index),
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    floodRisk, heatExposure, energyVulnerability, computeOutcome, floodRiskToWaterLevel,
    SEA_LEVEL_RISE_M, FCL_M, FALSE_CREEK_BASELINE_M,
  };
}
