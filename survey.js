/**
 * Pre/post evaluation instrument, shared by both the interactive game
 * (index.html) and the static information-equivalent control condition
 * (static.html), so both conditions administer the identical instrument
 * and only the experience between the two administrations differs.
 *
 * NEP_ITEMS: a 6-item SUBSET of the 15-item revised New Ecological
 * Paradigm (NEP) scale (Dunlap, R.E., Van Liere, K.D., Mertig, A.G., &
 * Jones, R.E. (2000). Measuring endorsement of the new ecological
 * paradigm: A revised NEP scale. Journal of Social Issues, 56(3),
 * 425-442.), a real, widely used, validated measure of ecological
 * worldview. This is a SUBSET chosen for a short pre/post pilot
 * administration, not the full validated instrument; a real deployment
 * should use the complete 15-item scale from the cited source. Items
 * marked reverse=true are anti-NEP and are reverse-scored before
 * averaging, per the scale's own standard scoring convention.
 *
 * POLICY_ITEMS: three items written specifically for this study, tied
 * directly to the three real adaptation choices in the game. These are
 * NOT drawn from a validated scale and are not claimed to be one.
 */

const NEP_ITEMS = [
  { id: "nep1", text: "We are approaching the limit of the number of people the Earth can support.", reverse: false },
  { id: "nep2", text: "Humans have the right to modify the natural environment to suit their needs.", reverse: true },
  { id: "nep3", text: "When humans interfere with nature it often produces disastrous consequences.", reverse: false },
  { id: "nep4", text: "Human ingenuity will ensure that we do NOT make the Earth unlivable.", reverse: true },
  { id: "nep5", text: "The balance of nature is very delicate and easily upset.", reverse: false },
  { id: "nep6", text: "The so-called 'ecological crisis' facing humankind has been greatly exaggerated.", reverse: true },
];

const POLICY_ITEMS = [
  { id: "policy_heat", text: "Vancouver should invest in tree canopy and cooling infrastructure for lower-canopy neighbourhoods even if it costs more than doing nothing new." },
  { id: "policy_energy", text: "Vancouver should invest in heat-pump/electrification retrofits for older rental buildings even if it costs more than doing nothing new." },
  { id: "policy_flood", text: "Vancouver should invest in coastal green infrastructure and shoreline setbacks even if it limits some waterfront development." },
];

const ALL_ITEMS = NEP_ITEMS.concat(POLICY_ITEMS);

function renderSurvey(containerEl, phase) {
  containerEl.innerHTML = "";
  const heading = document.createElement("h3");
  heading.textContent = (phase === "pre" ? "Before we start" : "One last thing") + ": a few quick questions";
  containerEl.appendChild(heading);
  const note = document.createElement("p");
  note.className = "survey-note";
  note.textContent = "1 = strongly disagree, 5 = strongly agree. There are no right answers.";
  containerEl.appendChild(note);

  ALL_ITEMS.forEach((item) => {
    const row = document.createElement("div");
    row.className = "survey-row";
    const label = document.createElement("label");
    label.textContent = item.text;
    row.appendChild(label);
    const scale = document.createElement("div");
    scale.className = "survey-scale";
    for (let v = 1; v <= 5; v++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "survey-btn";
      btn.textContent = String(v);
      btn.dataset.item = item.id;
      btn.dataset.value = String(v);
      btn.addEventListener("click", () => {
        scale.querySelectorAll(".survey-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        scale.dataset.answered = "1";
      });
      scale.appendChild(btn);
    }
    row.appendChild(scale);
    containerEl.appendChild(row);
  });
}

function collectResponses(containerEl) {
  const responses = {};
  containerEl.querySelectorAll(".survey-scale").forEach((scale) => {
    const selected = scale.querySelector(".survey-btn.selected");
    const itemId = selected ? selected.dataset.item : scale.querySelector(".survey-btn").dataset.item;
    responses[itemId] = selected ? Number(selected.dataset.value) : null;
  });
  return responses;
}

function isComplete(responses) {
  return ALL_ITEMS.every((item) => responses[item.id] !== null && responses[item.id] !== undefined);
}

function missingItemIds(responses) {
  return ALL_ITEMS.filter((item) => responses[item.id] === null || responses[item.id] === undefined).map((item) => item.id);
}

/** Averages the 6 NEP-subset items, reverse-scoring anti-NEP items
 * (score' = 6 - score) first, per the scale's standard convention.
 * Higher = stronger pro-ecological worldview. Returns null if any item
 * is unanswered, rather than silently averaging a partial response. */
function scoreNEP(responses) {
  const values = NEP_ITEMS.map((item) => {
    const raw = responses[item.id];
    if (raw === null || raw === undefined) return null;
    return item.reverse ? 6 - raw : raw;
  });
  if (values.some((v) => v === null)) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Averages the 3 study-specific policy-support items. Higher =
 * stronger support for proactive (vs status-quo) adaptation policy. */
function scorePolicySupport(responses) {
  const values = POLICY_ITEMS.map((item) => responses[item.id]);
  if (values.some((v) => v === null || v === undefined)) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function toCsvRow(record) {
  const fields = [
    "participant_id", "condition", "timestamp",
    "pre_nep_score", "post_nep_score", "pre_policy_score", "post_policy_score",
    "horizon", "flood_policy", "heat_policy", "energy_policy",
    "flood_risk_index", "heat_exposure_index", "energy_vulnerability_index", "composite_risk_index",
  ];
  return fields.map((f) => JSON.stringify(record[f] === undefined ? "" : record[f])).join(",");
}

function csvHeader() {
  return "participant_id,condition,timestamp,pre_nep_score,post_nep_score,pre_policy_score,post_policy_score,horizon,flood_policy,heat_policy,energy_policy,flood_risk_index,heat_exposure_index,energy_vulnerability_index,composite_risk_index";
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { NEP_ITEMS, POLICY_ITEMS, ALL_ITEMS, scoreNEP, scorePolicySupport, isComplete, missingItemIds, toCsvRow, csvHeader };
}
