/**
 * Deterministic climate-impact model for the three acts of Okanagan
 * Climate Futures. Pure, side-effect-free functions, no randomness, no
 * AI in the loop: every index the player sees is computed here from
 * the player's choices and real, cited regional figures, then only
 * narrated/visualized elsewhere.
 *
 * Cited figures (Pacific Climate Impacts Consortium, in partnership
 * with the North Okanagan, Central Okanagan, and Okanagan-Similkameen
 * Regional Districts, "Climate Projections for the Okanagan Region",
 * February 2020, baseline period 1961-1990):
 *   - Summer precipitation: -23% (long-term projection)
 *   - Days per year above 30C, valley bottoms: ~32 in the 2050s,
 *     52-54 in the 2080s
 *   - Regional wildfire risk described as increasing materially if
 *     average annual temperature rises 2.5C by 2050
 * Okanagan Lake's real regulated operating band (BC gov't Okanagan
 * Lake Regulation System factsheet): 340.4m (lowest desirable) to
 * 342.48m (full pool / upper target), both above sea level.
 *
 * This module uses the REAL day-count and precipitation figures
 * directly. It does NOT have a real, source-specific "2050s under low
 * emissions vs 2050s under high emissions" split (the report does not
 * publish one at this granularity), so the two selectable time
 * horizons are the report's own two real, cited horizons, 2050s and
 * 2080s, rather than an invented emissions-scenario label. Every other
 * numeric coefficient below (base risk levels, policy mitigation
 * amounts, scaling factors) is an explicitly illustrative, order-of-
 * magnitude-reasonable placeholder, not a claimed real regional
 * model output, exactly the same "PLACEHOLDER, clearly labeled"
 * discipline as BASE_ELEV_M/SLOPE in vancouver-view-corridor-massing
 * and the carbon/wind proxies in environmental-massing-agents.
 */

const HOT_DAYS_BY_HORIZON = { "2050s": 32, "2080s": 53 }; // real, cited (53 = midpoint of the cited 52-54 range)
const SUMMER_PRECIP_REDUCTION_PCT = { "2050s": 0.6 * 23, "2080s": 23 }; // real -23% cited as the long-term figure; 2050s uses an explicitly interpolated 60% fraction of it, not a separately cited number

const LAKE_FULL_POOL_M = 342.48; // real, BC gov't factsheet
const LAKE_LOWEST_DESIRABLE_M = 340.4; // real, BC gov't factsheet

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

/** Act 1: wildfire risk, Knox Mountain / Glenmore wildland-urban interface. */
function fireRisk(horizon, policy) {
  const hotDays = HOT_DAYS_BY_HORIZON[horizon];
  const baseRisk = 35; // illustrative baseline (PLACEHOLDER)
  const hotDaysFactor = (hotDays / HOT_DAYS_BY_HORIZON["2080s"]) * 40; // scales with the real cited hot-day count
  const policyMitigation = policy === "proactive" ? 20 : 0; // illustrative effect of fuel thinning / prescribed burns (a real FireSmart BC measure)
  const index = clamp(baseRisk + hotDaysFactor - policyMitigation, 0, 100);
  return { index: Math.round(index), hotDays, baseRisk, hotDaysFactor, policyMitigation };
}

/** Act 2: water/drought stress, South East Kelowna agricultural benchlands. */
function waterScarcity(horizon, policy) {
  const precipReductionPct = SUMMER_PRECIP_REDUCTION_PCT[horizon];
  const baseScarcity = 25; // illustrative baseline (PLACEHOLDER)
  const precipFactor = precipReductionPct * 1.6; // scales with the real cited summer-precipitation reduction
  const policyMitigation = policy === "proactive" ? 18 : 0; // illustrative effect of drip-irrigation efficiency upgrades (a real BC Agriculture / Okanagan Basin Water Board adaptation measure)
  const index = clamp(baseScarcity + precipFactor - policyMitigation, 0, 100);
  return { index: Math.round(index), precipReductionPct, baseScarcity, precipFactor, policyMitigation };
}

/** Act 3: lake level & shoreline/heat stress, Okanagan Lake foreshore (Downtown to Mission). */
function shorelineOutlook(horizon, policy) {
  const hotDays = HOT_DAYS_BY_HORIZON[horizon];
  const band = LAKE_FULL_POOL_M - LAKE_LOWEST_DESIRABLE_M; // real regulated band, 2.08m
  const droughtPull = (hotDays / HOT_DAYS_BY_HORIZON["2080s"]) * band * 0.9; // illustrative pull toward the lowest desirable level as heat/demand rise
  const policyOffset = policy === "proactive" ? band * 0.35 : 0; // illustrative effect of wetland restoration / shoreline setback + earlier reservoir management
  const typicalLateSummerLevel = clamp(
    LAKE_FULL_POOL_M - droughtPull + policyOffset,
    LAKE_LOWEST_DESIRABLE_M - 0.3, // allow a small illustrative excursion below the real "lowest desirable" line under the worst case
    LAKE_FULL_POOL_M,
  );
  const heatExposureIndex = Math.round((hotDays / HOT_DAYS_BY_HORIZON["2080s"]) * 100);
  return { typicalLateSummerLevel: Math.round(typicalLateSummerLevel * 100) / 100, heatExposureIndex, hotDays };
}

/**
 * Full outcome for one playthrough: a horizon and a policy choice per
 * act (each act's policy choice is independent, mirroring Future Delta
 * 2.0's per-act "community choice" structure).
 */
function computeOutcome(choices) {
  const { horizon, firePolicy, waterPolicy, shorelinePolicy } = choices;
  const fire = fireRisk(horizon, firePolicy);
  const water = waterScarcity(horizon, waterPolicy);
  const shoreline = shorelineOutlook(horizon, shorelinePolicy);
  const compositeRiskIndex = Math.round((fire.index + water.index + shoreline.heatExposureIndex) / 3);
  return { horizon, fire, water, shoreline, compositeRiskIndex };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    fireRisk, waterScarcity, shorelineOutlook, computeOutcome,
    HOT_DAYS_BY_HORIZON, SUMMER_PRECIP_REDUCTION_PCT, LAKE_FULL_POOL_M, LAKE_LOWEST_DESIRABLE_M,
  };
}
