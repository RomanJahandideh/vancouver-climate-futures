(function () {
  "use strict";

  // ==========================================================================
  // Condition assignment: real between-subjects design. ?condition=static
  // in the URL forces the control condition (used by static.html's own link
  // back here is not used; static.html is a fully separate page). Default is
  // a real 50/50 random assignment, like a genuine pilot deployment would use.
  // ==========================================================================
  var params = new URLSearchParams(window.location.search);
  var condition = params.get("condition") === "static" ? "static" : "interactive";
  var participantId = "p_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);

  document.getElementById("condition-note").textContent =
    "You are in the INTERACTIVE condition (participant " + participantId + "). This page is the interactive game; " +
    "the information-equivalent static control condition is static.html.";

  // ==========================================================================
  // Three.js scene
  // ==========================================================================
  var container = document.getElementById("scene-container");
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fc9e0);
  scene.fog = new THREE.Fog(0x9fc9e0, 60, 260);

  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  var sun = new THREE.DirectionalLight(0xfff2d8, 0.95);
  sun.position.set(60, 80, 30);
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0x88aaff, 0.2);
  fill.position.set(-40, 30, -30);
  scene.add(fill);

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- manual orbit controls + a target the game can animate toward ---
  var camTarget = new THREE.Vector3(0, 3, 0);
  var camTargetGoal = camTarget.clone();
  var radius = 70, radiusGoal = 70, azimuth = 0.5, elevation = 0.5;
  var dragging = false, lastX = 0, lastY = 0;

  function updateCameraPosition() {
    var ce = Math.cos(elevation), se = Math.sin(elevation);
    var ca = Math.cos(azimuth), sa = Math.sin(azimuth);
    camera.position.set(
      camTarget.x + radius * ce * sa,
      camTarget.y + radius * se,
      camTarget.z + radius * ce * ca
    );
    camera.lookAt(camTarget);
  }
  renderer.domElement.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; });
  window.addEventListener("pointerup", function () { dragging = false; });
  window.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    azimuth -= dx * 0.005;
    elevation = Math.max(0.15, Math.min(1.3, elevation + dy * 0.005));
  });
  renderer.domElement.addEventListener("wheel", function (e) {
    radiusGoal = Math.max(18, Math.min(140, radiusGoal + e.deltaY * 0.04));
  }, { passive: true });

  function focusOn(x, z, r) {
    camTargetGoal.set(x, 3, z);
    radiusGoal = r;
  }

  // ==========================================================================
  // Terrain layout, three real sub-areas laid out along X:
  //   x ~ -34 : Knox Mountain / Glenmore wildland-urban interface (Act 1, fire)
  //   x ~   0 : South East Kelowna benchlands (Act 2, water)
  //   x ~  34 : Okanagan Lake foreshore (Act 3, shoreline)
  // A deterministic, dependency-free "noise" (a small sum of sines) gives the
  // hillside terrain rolling variation without an external noise library.
  // ==========================================================================
  function pseudoNoise(x, z) {
    return Math.sin(x * 0.15) * Math.cos(z * 0.12) * 1.6 + Math.sin(x * 0.4 + z * 0.3) * 0.5;
  }

  function buildHillside() {
    var geo = new THREE.PlaneGeometry(26, 40, 24, 24);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i);
      var slope = (z + 20) * 0.22; // rises away from the lake, toward the ridge
      pos.setY(i, slope + pseudoNoise(x, z) * 0.6);
    }
    geo.computeVertexNormals();
    var mat = new THREE.MeshStandardMaterial({ color: 0x6a5a44, roughness: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-34, 0, -6);
    scene.add(mesh);
    return mesh;
  }
  var hillsideMesh = buildHillside();

  function buildBenchland() {
    var geo = new THREE.PlaneGeometry(26, 34, 4, 4);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshStandardMaterial({ color: 0x9c8a5a, roughness: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.4, -4);
    scene.add(mesh);
    return mesh;
  }
  buildBenchland();

  function buildLakebed() {
    var geo = new THREE.PlaneGeometry(30, 40, 4, 4);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshStandardMaterial({ color: 0x8a8064, roughness: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(34, -0.6, -4);
    scene.add(mesh);
    return mesh;
  }
  buildLakebed();

  // Local vertical scale for the lake: real Okanagan Lake operates in a
  // 340.4m-342.48m band (2.08m); exaggerated here to a 0-2.6 local-unit
  // range so the change is visible at this scene's scale, an explicit,
  // stated vertical exaggeration, the same convention landscape
  // visualization commonly uses and states plainly rather than implying
  // a literal 1:1 scale.
  function lakeLevelToLocalY(levelM) {
    var t = (levelM - LAKE_LOWEST_DESIRABLE_M) / (LAKE_FULL_POOL_M - LAKE_LOWEST_DESIRABLE_M);
    return 0.2 + Math.max(0, Math.min(1, t)) * 2.4;
  }
  var lakeGeo = new THREE.PlaneGeometry(26, 34);
  lakeGeo.rotateX(-Math.PI / 2);
  var lakeMat = new THREE.MeshStandardMaterial({ color: 0x2f6fa8, roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.92 });
  var lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
  lakeMesh.position.set(34, lakeLevelToLocalY(342.48), -4);
  scene.add(lakeMesh);

  // Wetland buffer ring, only shown when the proactive shoreline policy is chosen.
  var wetlandGeo = new THREE.RingGeometry(13.2, 15.2, 40);
  wetlandGeo.rotateX(-Math.PI / 2);
  var wetlandMat = new THREE.MeshStandardMaterial({ color: 0x3d7a4a, roughness: 1 });
  var wetlandMesh = new THREE.Mesh(wetlandGeo, wetlandMat);
  wetlandMesh.position.set(34, 0.25, -4);
  wetlandMesh.visible = false;
  scene.add(wetlandMesh);

  // Town cluster near the hillside base (Kelowna's urban edge).
  (function buildTown() {
    var group = new THREE.Group();
    for (var i = 0; i < 14; i++) {
      var w = 1.2 + Math.random() * 1.2, h = 1.5 + Math.random() * 2.5, d = 1.2 + Math.random() * 1.2;
      var box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.9 }));
      box.position.set(-34 + (Math.random() - 0.5) * 16, h / 2, 12 + (Math.random() - 0.5) * 6);
      group.add(box);
    }
    scene.add(group);
  })();

  // --- forest instances (Act 1) ---
  var forestGroup = new THREE.Group();
  scene.add(forestGroup);
  function rebuildForest(fireResult, policy) {
    while (forestGroup.children.length) forestGroup.remove(forestGroup.children[0]);
    // proactive fuel management = visibly thinned (fewer, more evenly
    // spaced trees); status_quo = dense, unmanaged fuel load. This is the
    // real visual signature of FireSmart-style fuel thinning.
    var count = policy === "proactive" ? 70 : 140;
    var stress = fireResult.index / 100; // 0 healthy green -> 1 stressed/grey
    var green = new THREE.Color(0x2f6b3a);
    var stressedColor = new THREE.Color(0x7a6a4a);
    var col = green.clone().lerp(stressedColor, stress);
    var coneMat = new THREE.MeshStandardMaterial({ color: col, roughness: 1 });
    var coneGeo = new THREE.ConeGeometry(0.9, 3, 6);
    var inst = new THREE.InstancedMesh(coneGeo, coneMat, count);
    var m = new THREE.Matrix4();
    for (var i = 0; i < count; i++) {
      var x = (Math.random() - 0.5) * 24;
      var z = -20 + Math.random() * 34;
      var slope = (z + 20) * 0.22 + pseudoNoise(x, z) * 0.6;
      m.makeTranslation(-34 + x, slope + 1.5, -6 + z);
      inst.setMatrixAt(i, m);
    }
    forestGroup.add(inst);

    // smoke/haze overlay, opacity scales directly with the computed fire risk index
    var hazeGeo = new THREE.PlaneGeometry(30, 40);
    hazeGeo.rotateX(-Math.PI / 2);
    var hazeMat = new THREE.MeshBasicMaterial({ color: 0xb8ada0, transparent: true, opacity: stress * 0.45, depthWrite: false });
    var haze = new THREE.Mesh(hazeGeo, hazeMat);
    haze.position.set(-34, 9 + stress * 4, -6);
    forestGroup.add(haze);
  }
  rebuildForest({ index: 35 }, "status_quo"); // initial neutral state before any choice

  // --- vineyard row instances (Act 2) ---
  var vineGroup = new THREE.Group();
  scene.add(vineGroup);
  function rebuildVineyard(waterResult) {
    while (vineGroup.children.length) vineGroup.remove(vineGroup.children[0]);
    var stress = waterResult.index / 100;
    var healthy = new THREE.Color(0x4a8a3f);
    var stressed = new THREE.Color(0xa08a3a);
    var col = healthy.clone().lerp(stressed, stress);
    var rowMat = new THREE.MeshStandardMaterial({ color: col, roughness: 1 });
    var rowGeo = new THREE.BoxGeometry(0.5, 0.6, 20);
    var rows = 16;
    var inst = new THREE.InstancedMesh(rowGeo, rowMat, rows);
    var m = new THREE.Matrix4();
    for (var i = 0; i < rows; i++) {
      var x = -11 + i * 1.45;
      m.makeTranslation(x, 0.7, -4);
      inst.setMatrixAt(i, m);
    }
    vineGroup.add(inst);
  }
  rebuildVineyard({ index: 25 });

  function updateShoreline(shorelineResult, policy) {
    lakeMesh.position.y = lakeLevelToLocalY(shorelineResult.typicalLateSummerLevel);
    wetlandMesh.visible = policy === "proactive";
  }

  function animate() {
    requestAnimationFrame(animate);
    camTarget.lerp(camTargetGoal, 0.06);
    radius += (radiusGoal - radius) * 0.06;
    updateCameraPosition();
    renderer.render(scene, camera);
  }
  focusOn(0, 0, 90);
  animate();

  // impact_model.js's functions (fireRisk, waterScarcity, shorelineOutlook,
  // computeOutcome) and constants (LAKE_FULL_POOL_M, LAKE_LOWEST_DESIRABLE_M)
  // are already plain globals here: its module.exports guard only applies
  // under Node, so loading it as a <script> tag leaves them directly usable
  // without any wrapper object, used directly by name throughout this file.

  // ==========================================================================
  // Game state machine
  // ==========================================================================
  var state = {
    horizon: null,
    firePolicy: null, waterPolicy: null, shorelinePolicy: null,
    pre: null, post: null,
  };

  function show(id) {
    document.querySelectorAll(".screen").forEach(function (el) { el.hidden = true; });
    document.getElementById(id).hidden = false;
  }

  var hudAct = document.getElementById("hud-act");
  function setHudAct(text) {
    hudAct.hidden = !text;
    hudAct.textContent = text || "";
  }

  document.getElementById("btn-start").addEventListener("click", function () {
    show("screen-pre-survey");
    renderSurvey(document.getElementById("pre-survey-container"), "pre");
    wireSurveyCompletion("pre-survey-container", "btn-pre-survey-continue", "pre-survey-hint");
  });

  function wireSurveyCompletion(containerId, btnId, hintId) {
    var container = document.getElementById(containerId);
    var btn = document.getElementById(btnId);
    var hint = document.getElementById(hintId);
    container.addEventListener("click", function () {
      var responses = collectResponses(container);
      var complete = isComplete(responses);
      btn.disabled = !complete;
      hint.style.visibility = complete ? "hidden" : "visible";
    });
  }

  document.getElementById("btn-pre-survey-continue").addEventListener("click", function () {
    state.pre = collectResponses(document.getElementById("pre-survey-container"));
    show("screen-horizon");
  });

  document.querySelectorAll("#screen-horizon .choice-card").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.horizon = btn.dataset.horizon;
      startAct1();
    });
  });

  // --- Act 1: Fire Vision ---
  function startAct1() {
    setHudAct("Act 1 / 3 — Fire Vision");
    focusOn(-34, -6, 55);
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Fire Vision</div>' +
      "<h2>Knox Mountain &amp; Glenmore, Kelowna</h2>" +
      "<p>This wildland-urban interface sits where Kelowna's neighbourhoods meet forested slopes. Hotter, drier summers raise wildfire risk here directly: the regional report ties material increases in wildfire risk to roughly 2.5&deg;C of average annual warming by 2050.</p>" +
      "<div class=\"choice-row\">" +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>No new investment in fuel management.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Proactive fuel management</h3><p>Invest in prescribed burns and fuel thinning near the urban edge (a real FireSmart BC measure).</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.firePolicy = btn.dataset.policy;
        var result = fireRisk(state.horizon, state.firePolicy);
        rebuildForest(result, state.firePolicy);
        showActOutcome("Fire Vision", [
          ["Wildfire risk index", result.index + " / 100"],
          ["Hot days/year (≥30°C) used", result.hotDays + " (real, cited)"],
          ["Fuel management effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
        ], startAct2);
      });
    });
  }

  // --- Act 2: Water Vision ---
  function startAct2() {
    setHudAct("Act 2 / 3 — Water Vision");
    focusOn(0, -4, 55);
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Water Vision</div>' +
      "<h2>South East Kelowna Benchlands</h2>" +
      "<p>These orchard and vineyard benchlands depend on summer irrigation. The regional report projects 23% less summer precipitation, a direct water-supply pressure on agriculture here.</p>" +
      "<div class=\"choice-row\">" +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>No new investment in irrigation efficiency.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Drip-irrigation efficiency upgrades</h3><p>Invest in efficient irrigation (a real BC Agriculture / Okanagan Basin Water Board adaptation measure).</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.waterPolicy = btn.dataset.policy;
        var result = waterScarcity(state.horizon, state.waterPolicy);
        rebuildVineyard(result);
        showActOutcome("Water Vision", [
          ["Water scarcity index", result.index + " / 100"],
          ["Summer precipitation reduction used", "-" + result.precipReductionPct.toFixed(1) + "% (real, cited)"],
          ["Irrigation efficiency effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
        ], startAct3);
      });
    });
  }

  // --- Act 3: Shoreline Vision ---
  function startAct3() {
    setHudAct("Act 3 / 3 — Shoreline Vision");
    focusOn(34, -4, 55);
    var content = document.getElementById("act-content");
    content.innerHTML =
      '<div class="act-badge">Shoreline Vision</div>' +
      "<h2>Okanagan Lake Foreshore, Downtown to Mission</h2>" +
      "<p>Okanagan Lake is managed within a real regulated band, 340.4m (lowest desirable) to 342.48m (full pool). Hotter summers and higher demand pull typical late-summer levels toward the lower end of that band.</p>" +
      "<div class=\"choice-row\">" +
      '<button class="choice-card" data-policy="status_quo"><h3>Status quo</h3><p>Hard shoreline infrastructure, no new wetland investment.</p></button>' +
      '<button class="choice-card" data-policy="proactive"><h3>Wetland restoration &amp; setbacks</h3><p>Restore shoreline wetlands and set back new development.</p></button>' +
      "</div>";
    show("screen-act");
    content.querySelectorAll(".choice-card").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.shorelinePolicy = btn.dataset.policy;
        var result = shorelineOutlook(state.horizon, state.shorelinePolicy);
        updateShoreline(result, state.shorelinePolicy);
        showActOutcome("Shoreline Vision", [
          ["Typical late-summer lake level", result.typicalLateSummerLevel + " m (real regulated band: 340.4–342.48 m)"],
          ["Heat exposure index", result.heatExposureIndex + " / 100"],
          ["Wetland/setback effect", state.shorelinePolicy === "proactive" ? "shoreline buffer visible on the map" : "none"],
        ], showSummary);
      });
    });
  }

  function showActOutcome(actName, rows, next) {
    var content = document.getElementById("act-content");
    var box = document.createElement("div");
    box.className = "outcome-box";
    var html = "<h3>" + actName + " outcome</h3>";
    rows.forEach(function (r) {
      html += '<div class="outcome-row"><span>' + r[0] + "</span><b>" + r[1] + "</b></div>";
    });
    box.innerHTML = html;
    content.appendChild(box);
    var btn = document.createElement("button");
    btn.className = "btn-primary";
    btn.textContent = "Continue";
    btn.addEventListener("click", next);
    content.appendChild(btn);
  }

  // --- Regional outcome summary ---
  function showSummary() {
    setHudAct("Regional Outcome");
    focusOn(0, -2, 110);
    var outcome = computeOutcome({
      horizon: state.horizon, firePolicy: state.firePolicy,
      waterPolicy: state.waterPolicy, shorelinePolicy: state.shorelinePolicy,
    });
    state.outcome = outcome;
    var html =
      "<p>Your choices, computed together across the whole region:</p>" +
      "<table class=\"summary-table\"><tr><th>Act</th><th>Choice</th><th>Index</th></tr>" +
      "<tr><td>Fire Vision</td><td>" + state.firePolicy + "</td><td>" + outcome.fire.index + " / 100</td></tr>" +
      "<tr><td>Water Vision</td><td>" + state.waterPolicy + "</td><td>" + outcome.water.index + " / 100</td></tr>" +
      "<tr><td>Shoreline Vision</td><td>" + state.shorelinePolicy + "</td><td>" + outcome.shoreline.typicalLateSummerLevel + " m</td></tr>" +
      "</table>" +
      "<p><b>Composite regional risk index: " + outcome.compositeRiskIndex + " / 100</b> (horizon: " + state.horizon + ")</p>";
    document.getElementById("summary-content").innerHTML = html;
    show("screen-summary");
  }

  document.getElementById("btn-summary-continue").addEventListener("click", function () {
    setHudAct("");
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
      var key = "okanagan_climate_futures_" + participantId;
      window.localStorage.setItem(key, JSON.stringify(record));
    } catch (e) { /* localStorage unavailable (private mode, etc.); export still works from memory below */ }

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

  // Expose minimal test hooks for headless verification without a human.
  window.__game = { state: state, condition: condition, participantId: participantId };
})();
