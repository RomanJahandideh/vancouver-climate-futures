(function () {
  "use strict";

  var condition = "static";
  var participantId = "p_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
  document.getElementById("condition-note").textContent =
    "You are in the STATIC (control) condition (participant " + participantId + "). This page presents the same " +
    "real facts and choices as the interactive game, as static reading with no explorable 3D scene.";

  var state = { horizon: null, firePolicy: null, waterPolicy: null, shorelinePolicy: null, pre: null, post: null };

  function show(id) {
    document.querySelectorAll(".screen").forEach(function (el) { el.hidden = true; });
    document.getElementById(id).hidden = false;
    window.scrollTo(0, 0);
  }

  function wireSurveyCompletion(containerId, btnId, hintId) {
    var container = document.getElementById(containerId);
    var btn = document.getElementById(btnId);
    var hint = document.getElementById(hintId);
    container.addEventListener("click", function () {
      var complete = isComplete(collectResponses(container));
      btn.disabled = !complete;
      hint.style.visibility = complete ? "hidden" : "visible";
    });
  }

  function bar(value100) {
    return '<div class="static-bar-track"><div class="static-bar-fill" style="width:' + value100 + '%"></div></div>';
  }

  document.getElementById("btn-start").addEventListener("click", function () {
    show("screen-pre-survey");
    renderSurvey(document.getElementById("pre-survey-container"), "pre");
    wireSurveyCompletion("pre-survey-container", "btn-pre-survey-continue", "pre-survey-hint");
  });

  document.getElementById("btn-pre-survey-continue").addEventListener("click", function () {
    state.pre = collectResponses(document.getElementById("pre-survey-container"));
    show("screen-horizon");
  });

  document.querySelectorAll("#screen-horizon .choice-card").forEach(function (btn) {
    btn.addEventListener("click", function () { state.horizon = btn.dataset.horizon; startAct1(); });
  });

  function startAct1() {
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Fire Vision</div>' +
      "<h2>Knox Mountain &amp; Glenmore, Kelowna</h2>" +
      "<p>This wildland-urban interface sits where Kelowna's neighbourhoods meet forested slopes. Hotter, drier summers raise wildfire risk here directly: the regional report ties material increases in wildfire risk to roughly 2.5&deg;C of average annual warming by 2050.</p>" +
      '<div class="choice-row">' +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>No new investment in fuel management.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Proactive fuel management</h3><p>Invest in prescribed burns and fuel thinning near the urban edge (a real FireSmart BC measure).</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.firePolicy = btn.dataset.policy;
        var result = fireRisk(state.horizon, state.firePolicy);
        showActOutcome("Fire Vision", result.index, [
          ["Wildfire risk index", result.index + " / 100"],
          ["Hot days/year (≥30°C) used", result.hotDays + " (real, cited)"],
          ["Fuel management effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
        ], startAct2);
      });
    });
  }

  function startAct2() {
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Water Vision</div>' +
      "<h2>South East Kelowna Benchlands</h2>" +
      "<p>These orchard and vineyard benchlands depend on summer irrigation. The regional report projects 23% less summer precipitation, a direct water-supply pressure on agriculture here.</p>" +
      '<div class="choice-row">' +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>No new investment in irrigation efficiency.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Drip-irrigation efficiency upgrades</h3><p>Invest in efficient irrigation (a real BC Agriculture / Okanagan Basin Water Board adaptation measure).</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.waterPolicy = btn.dataset.policy;
        var result = waterScarcity(state.horizon, state.waterPolicy);
        showActOutcome("Water Vision", result.index, [
          ["Water scarcity index", result.index + " / 100"],
          ["Summer precipitation reduction used", "-" + result.precipReductionPct.toFixed(1) + "% (real, cited)"],
          ["Irrigation efficiency effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
        ], startAct3);
      });
    });
  }

  function startAct3() {
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Shoreline Vision</div>' +
      "<h2>Okanagan Lake Foreshore, Downtown to Mission</h2>" +
      "<p>Okanagan Lake is managed within a real regulated band, 340.4m (lowest desirable) to 342.48m (full pool). Hotter summers and higher demand pull typical late-summer levels toward the lower end of that band.</p>" +
      '<div class="choice-row">' +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>Hard shoreline infrastructure, no new wetland investment.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Wetland restoration &amp; setbacks</h3><p>Restore shoreline wetlands and set back new development.</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.shorelinePolicy = btn.dataset.policy;
        var result = shorelineOutlook(state.horizon, state.shorelinePolicy);
        showActOutcome("Shoreline Vision", result.heatExposureIndex, [
          ["Typical late-summer lake level", result.typicalLateSummerLevel + " m (real regulated band: 340.4–342.48 m)"],
          ["Heat exposure index", result.heatExposureIndex + " / 100"],
          ["Wetland/setback effect", state.shorelinePolicy === "proactive" ? "applied" : "none"],
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
    var outcome = computeOutcome({ horizon: state.horizon, firePolicy: state.firePolicy, waterPolicy: state.waterPolicy, shorelinePolicy: state.shorelinePolicy });
    state.outcome = outcome;
    var html =
      "<p>Your choices, computed together across the whole region:</p>" +
      '<table class="summary-table"><tr><th>Act</th><th>Choice</th><th>Index</th></tr>' +
      "<tr><td>Fire Vision</td><td>" + state.firePolicy + "</td><td>" + outcome.fire.index + " / 100</td></tr>" +
      "<tr><td>Water Vision</td><td>" + state.waterPolicy + "</td><td>" + outcome.water.index + " / 100</td></tr>" +
      "<tr><td>Shoreline Vision</td><td>" + state.shorelinePolicy + "</td><td>" + outcome.shoreline.typicalLateSummerLevel + " m</td></tr>" +
      "</table>" +
      "<p><b>Composite regional risk index: " + outcome.compositeRiskIndex + " / 100</b> (horizon: " + state.horizon + ")</p>";
    document.getElementById("summary-content").innerHTML = html;
    show("screen-summary");
  }

  document.getElementById("btn-summary-continue").addEventListener("click", function () {
    show("screen-post-survey");
    renderSurvey(document.getElementById("post-survey-container"), "post");
    wireSurveyCompletion("post-survey-container", "btn-post-survey-continue", "post-survey-hint");
  });

  document.getElementById("btn-post-survey-continue").addEventListener("click", function () {
    state.post = collectResponses(document.getElementById("post-survey-container"));
    finish();
  });

  function finish() {
    var record = {
      participant_id: participantId, condition: condition, timestamp: new Date().toISOString(),
      pre_nep_score: scoreNEP(state.pre), post_nep_score: scoreNEP(state.post),
      pre_policy_score: scorePolicySupport(state.pre), post_policy_score: scorePolicySupport(state.post),
      horizon: state.horizon, fire_policy: state.firePolicy, water_policy: state.waterPolicy, shoreline_policy: state.shorelinePolicy,
      fire_risk_index: state.outcome.fire.index, water_scarcity_index: state.outcome.water.index,
      shoreline_level_m: state.outcome.shoreline.typicalLateSummerLevel, composite_risk_index: state.outcome.compositeRiskIndex,
    };
    try {
      window.localStorage.setItem("okanagan_climate_futures_" + participantId, JSON.stringify(record));
    } catch (e) { /* localStorage unavailable; export below still works from memory */ }

    document.getElementById("participant-id-note").textContent = "Participant ID: " + participantId + " (condition: " + condition + ")";
    document.getElementById("btn-download").addEventListener("click", function () {
      var csv = csvHeader() + "\n" + toCsvRow(record) + "\n";
      var blob = new Blob([csv], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "okanagan_climate_futures_" + participantId + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    show("screen-end");
  }

  window.__game = { state: state, condition: condition, participantId: participantId };
})();
