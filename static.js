(function () {
  "use strict";

  var condition = "static";
  var participantId = "p_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
  document.getElementById("condition-note").textContent =
    "You are in the STATIC (control) condition (participant " + participantId + "). This page presents the same " +
    "real facts and choices as the interactive game, as static reading with no explorable 3D scene.";

  var state = { horizon: null, floodPolicy: null, heatPolicy: null, energyPolicy: null, pre: null, post: null };

  function show(id) {
    document.querySelectorAll(".screen").forEach(function (el) { el.hidden = true; });
    document.getElementById(id).hidden = false;
    window.scrollTo(0, 0);
  }

  // The Continue button is ALWAYS clickable: clicking while incomplete
  // visibly highlights every unanswered question rather than doing
  // nothing, the same forgiving pattern as the interactive version.
  function wireSurveyCompletion(containerId, btnId, hintId, onComplete) {
    var container = document.getElementById(containerId);
    var btn = document.getElementById(btnId);
    var hint = document.getElementById(hintId);
    container.addEventListener("click", function (e) {
      if (e.target.classList.contains("survey-btn")) e.target.closest(".survey-row").classList.remove("missing");
    });
    btn.addEventListener("click", function () {
      var responses = collectResponses(container);
      var missing = missingItemIds(responses);
      if (missing.length > 0) {
        container.querySelectorAll(".survey-row.missing").forEach(function (row) { row.classList.remove("missing"); });
        missing.forEach(function (id) {
          var el = container.querySelector('.survey-btn[data-item="' + id + '"]');
          if (el) el.closest(".survey-row").classList.add("missing");
        });
        hint.textContent = missing.length + " question" + (missing.length > 1 ? "s" : "") + " still need an answer, highlighted below.";
        var first = container.querySelector(".survey-row.missing");
        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      hint.textContent = "";
      onComplete(responses);
    });
  }

  document.getElementById("btn-start").addEventListener("click", function () {
    show("screen-pre-survey");
    renderSurvey(document.getElementById("pre-survey-container"), "pre");
    wireSurveyCompletion("pre-survey-container", "btn-pre-survey-continue", "pre-survey-hint", function (responses) {
      state.pre = responses;
      show("screen-horizon");
    });
  });

  document.querySelectorAll("#screen-horizon .choice-card").forEach(function (btn) {
    btn.addEventListener("click", function () { state.horizon = btn.dataset.horizon; startAct1(); });
  });

  function bar(value100) {
    return '<div class="static-bar-track"><div class="static-bar-fill" style="width:' + value100 + '%"></div></div>';
  }

  function startAct1() {
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Heat Vision</div>' +
      "<h2>A lower-canopy Vancouver neighbourhood</h2>" +
      "<p>The 2021 BC heat dome killed 619 people province-wide, the deadliest weather event in BC history, and researchers found real, documented temperature gaps of roughly 20°C between lower-tree-canopy neighbourhoods and higher-canopy ones during the event, tied directly to neighbourhood greenness.</p>" +
      '<div class="choice-row">' +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>No new investment in tree canopy or cooling infrastructure.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Tree canopy &amp; cooling investment</h3><p>Expand street trees and cooling infrastructure in this neighbourhood.</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.heatPolicy = btn.dataset.policy;
        var result = heatExposure(state.horizon, state.heatPolicy);
        showActOutcome("Heat Vision", result.index, [
          ["Heat exposure index", result.index + " / 100"],
          ["Horizon severity factor used", "+" + result.horizonFactor + " points (illustrative)"],
          ["Canopy/cooling investment effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
        ], startAct2);
      });
    });
  }

  function startAct2() {
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Energy Vision</div>' +
      "<h2>Older rental-housing blocks</h2>" +
      "<p>Much of Vancouver's existing rental housing stock relies on aging, emissions-heavy heating with no cooling at all, a real vulnerability during extreme heat. The City's real RARA program funds heat-pump and electrification retrofits for market rental buildings.</p>" +
      '<div class="choice-row">' +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>No new investment in building retrofits.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Heat-pump retrofit investment</h3><p>Fund heat-pump/electrification retrofits (the real City of Vancouver RARA program).</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.energyPolicy = btn.dataset.policy;
        var result = energyVulnerability(state.horizon, state.energyPolicy);
        showActOutcome("Energy Vision", result.index, [
          ["Building energy vulnerability index", result.index + " / 100"],
          ["Horizon severity factor used", "+" + result.horizonFactor + " points (illustrative)"],
          ["Retrofit investment effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
        ], startAct3);
      });
    });
  }

  function startAct3() {
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Flood Vision</div>' +
      "<h2>False Creek foreshore</h2>" +
      "<p>The City of Vancouver's real coastal Flood Construction Level is 4.6m, set to protect waterfront structures through 2100 against a real, cited ~1m of sea level rise. False Creek is one of the areas the City's own coastal adaptation planning (Sea2City) is actively working through right now.</p>" +
      '<div class="choice-row">' +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>Hard shoreline infrastructure, no new green adaptation investment.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Coastal green infrastructure</h3><p>Invest in green infrastructure and setbacks (the real Sea2City / False Creek Coastal Adaptation Plan approach).</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.floodPolicy = btn.dataset.policy;
        var result = floodRisk(state.horizon, state.floodPolicy);
        showActOutcome("Flood Vision", result.index, [
          ["Coastal flood risk index", result.index + " / 100"],
          ["Sea level rise used", result.seaLevelRiseM + " m (real, cited)"],
          ["Real Flood Construction Level", FCL_M + " m (City of Vancouver, cited)"],
          ["Green infrastructure effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
        ], showSummary);
      });
    });
  }

  function showActOutcome(actName, barValue, rows, next) {
    var content = document.getElementById("act-content");
    var box = document.createElement("div");
    box.className = "outcome-box";
    var html = "<h3>" + actName + " outcome</h3>" + bar(barValue);
    rows.forEach(function (r) { html += '<div class="outcome-row"><span>' + r[0] + "</span><b>" + r[1] + "</b></div>"; });
    box.innerHTML = html;
    content.appendChild(box);
    var btn = document.createElement("button");
    btn.className = "btn-primary";
    btn.textContent = "Continue";
    btn.addEventListener("click", next);
    content.appendChild(btn);
  }

  function showSummary() {
    var outcome = computeOutcome({ horizon: state.horizon, floodPolicy: state.floodPolicy, heatPolicy: state.heatPolicy, energyPolicy: state.energyPolicy });
    state.outcome = outcome;
    var html =
      "<p>Your choices, computed together across the whole city:</p>" +
      '<table class="summary-table"><tr><th>Act</th><th>Choice</th><th>Index</th></tr>' +
      "<tr><td>Heat Vision</td><td>" + state.heatPolicy + "</td><td>" + outcome.heat.index + " / 100</td></tr>" +
      "<tr><td>Energy Vision</td><td>" + state.energyPolicy + "</td><td>" + outcome.energy.index + " / 100</td></tr>" +
      "<tr><td>Flood Vision</td><td>" + state.floodPolicy + "</td><td>" + outcome.flood.index + " / 100</td></tr>" +
      "</table>" +
      "<p><b>Composite regional risk index: " + outcome.compositeRiskIndex + " / 100</b> (horizon: " + state.horizon + ")</p>";
    document.getElementById("summary-content").innerHTML = html;
    show("screen-summary");
  }

  document.getElementById("btn-summary-continue").addEventListener("click", function () {
    show("screen-post-survey");
    renderSurvey(document.getElementById("post-survey-container"), "post");
    wireSurveyCompletion("post-survey-container", "btn-post-survey-continue", "post-survey-hint", function (responses) {
      state.post = responses;
      finish();
    });
  });

  function finish() {
    var record = {
      participant_id: participantId, condition: condition, timestamp: new Date().toISOString(),
      pre_nep_score: scoreNEP(state.pre), post_nep_score: scoreNEP(state.post),
      pre_policy_score: scorePolicySupport(state.pre), post_policy_score: scorePolicySupport(state.post),
      horizon: state.horizon, flood_policy: state.floodPolicy, heat_policy: state.heatPolicy, energy_policy: state.energyPolicy,
      flood_risk_index: state.outcome.flood.index, heat_exposure_index: state.outcome.heat.index,
      energy_vulnerability_index: state.outcome.energy.index, composite_risk_index: state.outcome.compositeRiskIndex,
    };
    try {
      window.localStorage.setItem("vancouver_climate_futures_" + participantId, JSON.stringify(record));
    } catch (e) { /* localStorage unavailable; export below still works from memory */ }

    document.getElementById("participant-id-note").textContent = "Participant ID: " + participantId + " (condition: " + condition + ")";
    document.getElementById("btn-download").addEventListener("click", function () {
      var csv = csvHeader() + "\n" + toCsvRow(record) + "\n";
      var blob = new Blob([csv], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "vancouver_climate_futures_" + participantId + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    show("screen-end");
  }

  window.__game = { state: state, condition: condition, participantId: participantId };
})();
