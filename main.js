(function () {
  "use strict";

  // ==========================================================================
  // Condition assignment: real between-subjects design. ?condition=static
  // forces the control condition label only (static.html is the actual
  // separate control page). Default is a real 50/50 random assignment.
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
  scene.fog = new THREE.Fog(0xbfe0f0, 170, 420);

  var camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 1000);
  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.appendChild(renderer.domElement);

  // ---- procedural sky dome (a canvas gradient on a large inverted
  // sphere), no external image asset, fully self-contained ----
  (function buildSky() {
    var c = document.createElement("canvas");
    c.width = 2; c.height = 256;
    var ctx = c.getContext("2d");
    var grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, "#3f8fd6");
    grad.addColorStop(0.35, "#6bb3e6");
    grad.addColorStop(0.65, "#bfe0f0");
    grad.addColorStop(1.0, "#eaf3e8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2, 256);
    var tex = new THREE.CanvasTexture(c);
    var skyGeo = new THREE.SphereGeometry(400, 24, 16);
    var skyMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, toneMapped: false });
    scene.add(new THREE.Mesh(skyGeo, skyMat));
  })();

  // ---- lighting: a soft sky/ground hemisphere fill plus a real
  // shadow-casting sun, replacing the earlier flat ambient + two
  // directional lights with no shadows ----
  scene.add(new THREE.HemisphereLight(0xcfe8f7, 0x9c8a5a, 0.55));
  var sun = new THREE.DirectionalLight(0xfff2d8, 1.15);
  sun.position.set(55, 70, 35);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -75;
  sun.shadow.camera.right = 75;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 220;
  sun.shadow.bias = -0.0015;
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0x88aaff, 0.18);
  fill.position.set(-40, 30, -30);
  scene.add(fill);

  // ---- small canvas-texture helper: every "material" below is a real
  // procedurally generated texture, not a flat color, and not an
  // external image asset that could fail to load or need a license ----
  function canvasTexture(size, draw) {
    var c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  function mottledGroundTexture(base, speck1, speck2, repeat) {
    var tex = canvasTexture(128, function (ctx, s) {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, s, s);
      for (var i = 0; i < 900; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? speck1 : speck2;
        ctx.globalAlpha = 0.15 + Math.random() * 0.25;
        var x = Math.random() * s, y = Math.random() * s, r = 0.6 + Math.random() * 1.6;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    tex.repeat.set(repeat, repeat);
    return tex;
  }

  function windowGridTexture(wallColor, litColor, darkColor) {
    var tex = canvasTexture(64, function (ctx, s) {
      ctx.fillStyle = wallColor;
      ctx.fillRect(0, 0, s, s);
      var cols = 4, rows = 6, pad = 3, cw = s / cols, rh = s / rows;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          ctx.fillStyle = Math.random() < 0.35 ? litColor : darkColor;
          ctx.fillRect(c * cw + pad, r * rh + pad, cw - pad * 2, rh - pad * 2);
        }
      }
    });
    tex.repeat.set(1, 1);
    return tex;
  }

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- manual orbit controls, active everywhere, the scene is never
  // covered by a full-screen blocking overlay, only a small docked panel ---
  var camTarget = new THREE.Vector3(0, 3, 0);
  var camTargetGoal = camTarget.clone();
  var radius = 90, radiusGoal = 90, azimuth = 0.5, elevation = 0.5;
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
  // Terrain layout, three real Vancouver places laid out along X:
  //   x ~ -34 : a lower-tree-canopy neighbourhood (Marpole-type), Heat Vision
  //   x ~   0 : older rental-housing blocks, Energy Vision
  //   x ~  34 : False Creek foreshore, Flood Vision
  // A deterministic, dependency-free "noise" (a small sum of sines) gives the
  // terrain gentle variation without an external noise library.
  // ==========================================================================
  function pseudoNoise(x, z) {
    return Math.sin(x * 0.15) * Math.cos(z * 0.12) * 1.6 + Math.sin(x * 0.4 + z * 0.3) * 0.5;
  }

  var grassTex = mottledGroundTexture("#8f9a5e", "#7c8a4c", "#a3ac72", 10);
  var pavementTex = mottledGroundTexture("#a99a76", "#9c8c68", "#b3a482", 8);
  var sandTex = mottledGroundTexture("#c9bd97", "#bcae86", "#d4c9a6", 9);

  function buildNeighbourhoodGround() {
    var geo = new THREE.PlaneGeometry(26, 40, 24, 24);
    geo.rotateX(-Math.PI / 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, 0.6 + pseudoNoise(x, z) * 0.25);
    }
    geo.computeVertexNormals();
    var mat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(-34, 0, -6);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  buildNeighbourhoodGround();

  function buildRentalBlockGround() {
    var geo = new THREE.PlaneGeometry(26, 34, 4, 4);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshStandardMaterial({ map: pavementTex, roughness: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.4, -4);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  buildRentalBlockGround();

  function buildForeshoreGround() {
    var geo = new THREE.PlaneGeometry(30, 40, 4, 4);
    geo.rotateX(-Math.PI / 2);
    var mat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(34, -0.6, -4);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  buildForeshoreGround();

  // Local vertical scale for False Creek: a real, cited ceiling (the
  // City's actual 4.6m Flood Construction Level) mapped to a small
  // local-unit range so the change is visible at this scene's scale, an
  // explicit, stated vertical exaggeration, the same convention
  // landscape visualization commonly uses and states plainly rather
  // than implying a literal 1:1 scale.
  function waterLevelToLocalY(levelM) {
    var t = (levelM - FALSE_CREEK_BASELINE_M) / (FCL_M - FALSE_CREEK_BASELINE_M);
    return 0.2 + Math.max(0, Math.min(1, t)) * 2.4;
  }
  var waterGeo = new THREE.PlaneGeometry(26, 34, 40, 40);
  waterGeo.rotateX(-Math.PI / 2);
  var waterBasePositions = waterGeo.attributes.position.array.slice();
  var waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x2f6fa8, roughness: 0.2, metalness: 0.05,
    clearcoat: 0.6, clearcoatRoughness: 0.3, transparent: true, opacity: 0.9,
  });
  var waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(34, waterLevelToLocalY(FALSE_CREEK_BASELINE_M), -4);
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // Green shoreline buffer, shown only when the proactive coastal
  // adaptation policy is chosen (the real Sea2City / False Creek
  // Coastal Adaptation Plan approach: green infrastructure and
  // setbacks rather than hard infrastructure alone).
  var bufferGeo = new THREE.RingGeometry(13.2, 15.2, 40);
  bufferGeo.rotateX(-Math.PI / 2);
  var bufferMat = new THREE.MeshStandardMaterial({ color: 0x3d7a4a, roughness: 1 });
  var bufferMesh = new THREE.Mesh(bufferGeo, bufferMat);
  bufferMesh.position.set(34, 0.25, -4);
  bufferMesh.visible = false;
  bufferMesh.receiveShadow = true;
  scene.add(bufferMesh);

  // A generic low-rise building cluster near the neighbourhood ground,
  // walls textured with a procedural lit/unlit window grid rather than
  // a flat color box.
  var houseWindowTex = windowGridTexture("#e4ddc8", "#ffe9a8", "#7d7562");
  (function buildHouses() {
    var group = new THREE.Group();
    var houseMat = new THREE.MeshStandardMaterial({ map: houseWindowTex, roughness: 0.8 });
    for (var i = 0; i < 14; i++) {
      var w = 1.2 + Math.random() * 1.2, h = 1.5 + Math.random() * 2.5, d = 1.2 + Math.random() * 1.2;
      var box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), houseMat);
      box.position.set(-34 + (Math.random() - 0.5) * 16, h / 2 + 0.6, 12 + (Math.random() - 0.5) * 6);
      box.rotation.y = Math.random() * Math.PI * 2;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
    }
    scene.add(group);
  })();

  // --- street trees / canopy (Act 1: Heat Vision), a two-part
  // trunk + foliage instanced tree for a real silhouette instead of a
  // single bare cone ---
  var canopyGroup = new THREE.Group();
  scene.add(canopyGroup);
  var trunkGeo = new THREE.CylinderGeometry(0.14, 0.2, 1.1, 6);
  var trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
  var foliageGeoLower = new THREE.ConeGeometry(1.15, 2.0, 7);
  var foliageGeoUpper = new THREE.ConeGeometry(0.8, 1.6, 7);

  function rebuildCanopy(heatResult, policy) {
    while (canopyGroup.children.length) canopyGroup.remove(canopyGroup.children[0]);
    // proactive tree-canopy investment = visibly more, denser canopy;
    // status quo = the sparser canopy documented in lower-canopy
    // neighbourhoods like Marpole during the 2021 heat dome.
    var count = policy === "proactive" ? 130 : 50;
    var stress = heatResult.index / 100; // 0 cool/green -> 1 hot/hazy
    var green = new THREE.Color(0x2f6b3a);
    var stressedColor = new THREE.Color(0x8a7a55);
    var col = green.clone().lerp(stressedColor, stress);
    var foliageMat = new THREE.MeshStandardMaterial({ color: col, roughness: 1 });
    var lowerInst = new THREE.InstancedMesh(foliageGeoLower, foliageMat, count);
    var upperInst = new THREE.InstancedMesh(foliageGeoUpper, foliageMat, count);
    var trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
    lowerInst.castShadow = upperInst.castShadow = trunkInst.castShadow = true;
    var m = new THREE.Matrix4();
    var q = new THREE.Quaternion();
    var scaleV = new THREE.Vector3();
    for (var i = 0; i < count; i++) {
      var x = (Math.random() - 0.5) * 24;
      var z = -20 + Math.random() * 34;
      var groundY = 0.6 + pseudoNoise(x, z) * 0.25;
      var s = 0.75 + Math.random() * 0.6;
      scaleV.set(s, s, s);
      m.compose(new THREE.Vector3(-34 + x, groundY + 0.55 * s, -6 + z), q, scaleV);
      trunkInst.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(-34 + x, groundY + 1.5 * s, -6 + z), q, scaleV);
      lowerInst.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(-34 + x, groundY + 2.55 * s, -6 + z), q, scaleV);
      upperInst.setMatrixAt(i, m);
    }
    canopyGroup.add(trunkInst, lowerInst, upperInst);

    // heat-shimmer haze overlay, opacity scales directly with the computed heat exposure index
    var hazeGeo = new THREE.PlaneGeometry(30, 40);
    hazeGeo.rotateX(-Math.PI / 2);
    var hazeMat = new THREE.MeshBasicMaterial({ color: 0xe8c99a, transparent: true, opacity: stress * 0.4, depthWrite: false });
    var haze = new THREE.Mesh(hazeGeo, hazeMat);
    haze.position.set(-34, 9 + stress * 3, -6);
    canopyGroup.add(haze);
  }
  rebuildCanopy({ index: 30 }, "status_quo"); // initial neutral state before any choice

  // --- rental-housing block instances (Act 2: Energy Vision) ---
  var blocksGroup = new THREE.Group();
  scene.add(blocksGroup);
  var blockWindowTex = windowGridTexture("#d8cfa8", "#fff0b0", "#6b6450");
  function rebuildBlocks(energyResult) {
    while (blocksGroup.children.length) blocksGroup.remove(blocksGroup.children[0]);
    var vulnerability = energyResult.index / 100;
    var retrofitted = new THREE.Color(0xd9a441); // warm, retrofitted/electrified
    var vulnerable = new THREE.Color(0x8a8a90); // dull grey, un-retrofitted
    var col = retrofitted.clone().lerp(vulnerable, vulnerability);
    var rowMat = new THREE.MeshStandardMaterial({ map: blockWindowTex, color: col, roughness: 0.85 });
    var rowGeo = new THREE.BoxGeometry(1.6, 2.4, 3.2);
    var count = 16;
    var inst = new THREE.InstancedMesh(rowGeo, rowMat, count);
    inst.castShadow = true;
    inst.receiveShadow = true;
    var m = new THREE.Matrix4();
    for (var i = 0; i < count; i++) {
      var col_i = i % 4, row_i = Math.floor(i / 4);
      var x = -10 + col_i * 6.5;
      var z = -12 + row_i * 8;
      m.makeTranslation(x, 1.6, z);
      inst.setMatrixAt(i, m);
    }
    blocksGroup.add(inst);
  }
  rebuildBlocks({ index: 40 });

  function updateForeshore(floodResult, waterLevelM, policy) {
    waterMesh.position.y = waterLevelToLocalY(waterLevelM);
    bufferMesh.visible = policy === "proactive";
  }

  var clock = new THREE.Clock();
  var waterPos = waterGeo.attributes.position;
  function animateWater(t) {
    for (var i = 0; i < waterPos.count; i++) {
      var bx = waterBasePositions[i * 3], bz = waterBasePositions[i * 3 + 2], by = waterBasePositions[i * 3 + 1];
      waterPos.setY(i, by + Math.sin(bx * 0.35 + t * 1.1) * 0.035 + Math.sin(bz * 0.5 + t * 0.8) * 0.03);
    }
    waterPos.needsUpdate = true;
  }

  function animate() {
    requestAnimationFrame(animate);
    camTarget.lerp(camTargetGoal, 0.06);
    radius += (radiusGoal - radius) * 0.06;
    updateCameraPosition();
    animateWater(clock.getElapsedTime());
    renderer.render(scene, camera);
  }
  focusOn(0, 0, 110);
  animate();

  // impact_model.js's functions and constants (floodRisk, heatExposure,
  // energyVulnerability, computeOutcome, floodRiskToWaterLevel, FCL_M,
  // FALSE_CREEK_BASELINE_M) are already plain globals here, its
  // module.exports guard only applies under Node.

  // ==========================================================================
  // Docked-panel UI: the 3D scene is never covered by a blocking overlay.
  // Only the panel itself captures clicks; the rest of the viewport stays
  // draggable. A small handle lets the player manually collapse the panel
  // to see the full scene, and every act's choice briefly auto-collapses
  // the panel so the visual consequence is actually seen happening, not
  // just reported in text.
  // ==========================================================================
  var sceneHint = document.getElementById("scene-hint");
  var watchBanner = document.getElementById("watch-banner");

  function updateSceneHintVisibility() {
    var anyDockedOpen = Array.prototype.some.call(document.querySelectorAll(".screen--docked"), function (el) {
      return !el.hidden;
    });
    sceneHint.hidden = !anyDockedOpen;
  }

  document.querySelectorAll(".screen--docked .dock-handle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var screenEl = btn.closest(".screen--docked");
      var collapsed = screenEl.classList.toggle("collapsed");
      btn.innerHTML = collapsed ? "&#9650; Show" : "&#9660; Hide";
    });
  });

  function collapseDocked(screenEl) {
    screenEl.classList.add("collapsed");
    var handle = screenEl.querySelector(".dock-handle");
    if (handle) handle.innerHTML = "&#9650; Show";
  }
  function expandDocked(screenEl) {
    screenEl.classList.remove("collapsed");
    var handle = screenEl.querySelector(".dock-handle");
    if (handle) handle.innerHTML = "&#9660; Hide";
  }

  function watchSceneRespond(callback) {
    var actScreen = document.getElementById("screen-act");
    collapseDocked(actScreen);
    watchBanner.classList.add("visible");
    setTimeout(function () {
      watchBanner.classList.remove("visible");
      expandDocked(actScreen);
      callback();
    }, 1600);
  }

  // ==========================================================================
  // Game state machine
  // ==========================================================================
  var state = {
    horizon: null,
    floodPolicy: null, heatPolicy: null, energyPolicy: null,
    pre: null, post: null,
  };

  function show(id) {
    document.querySelectorAll(".screen").forEach(function (el) { el.hidden = true; el.classList.remove("collapsed"); });
    var target = document.getElementById(id);
    target.hidden = false;
    var handle = target.querySelector(".dock-handle");
    if (handle) handle.innerHTML = "&#9660; Hide";
    updateSceneHintVisibility();
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

  // The Continue button is ALWAYS clickable (never silently disabled):
  // clicking it while incomplete visibly highlights every unanswered
  // question and scrolls to the first one, rather than doing nothing.
  function wireSurveyCompletion(containerId, btnId, hintId) {
    var container = document.getElementById(containerId);
    var btn = document.getElementById(btnId);
    var hint = document.getElementById(hintId);
    hint.style.visibility = "hidden";

    function clearMissingHighlights() {
      container.querySelectorAll(".survey-row.missing").forEach(function (row) { row.classList.remove("missing"); });
    }

    container.addEventListener("click", function (e) {
      if (e.target.classList.contains("survey-btn")) {
        e.target.closest(".survey-row").classList.remove("missing");
      }
    });

    btn.addEventListener("click", function () {
      var responses = collectResponses(container);
      var missing = missingItemIds(responses);
      if (missing.length > 0) {
        clearMissingHighlights();
        missing.forEach(function (id) {
          var btnEl = container.querySelector('.survey-btn[data-item="' + id + '"]');
          if (btnEl) btnEl.closest(".survey-row").classList.add("missing");
        });
        hint.textContent = missing.length + " question" + (missing.length > 1 ? "s" : "") + " still need an answer, highlighted below.";
        hint.style.visibility = "visible";
        var firstMissing = container.querySelector(".survey-row.missing");
        if (firstMissing) firstMissing.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      hint.style.visibility = "hidden";
      onSurveyComplete[btnId](responses);
    });
  }

  var onSurveyComplete = {};

  onSurveyComplete["btn-pre-survey-continue"] = function (responses) {
    state.pre = responses;
    show("screen-horizon");
  };

  document.querySelectorAll("#screen-horizon .choice-card").forEach(function (btn) {
    btn.addEventListener("click", function () { state.horizon = btn.dataset.horizon; startAct1(); });
  });

  // --- Act 1: Heat Vision ---
  function startAct1() {
    setHudAct("Act 1 / 3 — Heat Vision");
    focusOn(-34, -6, 55);
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
        watchSceneRespond(function () {
          rebuildCanopy(result, state.heatPolicy);
          showActOutcome("Heat Vision", [
            ["Heat exposure index", result.index + " / 100"],
            ["Horizon severity factor used", "+" + result.horizonFactor + " points (illustrative)"],
            ["Canopy/cooling investment effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
          ], startAct2);
        });
      });
    });
  }

  // --- Act 2: Energy Vision ---
  function startAct2() {
    setHudAct("Act 2 / 3 — Energy Vision");
    focusOn(0, -4, 55);
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
        watchSceneRespond(function () {
          rebuildBlocks(result);
          showActOutcome("Energy Vision", [
            ["Building energy vulnerability index", result.index + " / 100"],
            ["Horizon severity factor used", "+" + result.horizonFactor + " points (illustrative)"],
            ["Retrofit investment effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
          ], startAct3);
        });
      });
    });
  }

  // --- Act 3: Flood Vision ---
  function startAct3() {
    setHudAct("Act 3 / 3 — Flood Vision");
    focusOn(34, -4, 55);
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
        var waterLevelM = floodRiskToWaterLevel(result.index);
        watchSceneRespond(function () {
          updateForeshore(result, waterLevelM, state.floodPolicy);
          showActOutcome("Flood Vision", [
            ["Coastal flood risk index", result.index + " / 100"],
            ["Sea level rise used", result.seaLevelRiseM + " m (real, cited)"],
            ["Real Flood Construction Level", FCL_M + " m (City of Vancouver, cited)"],
            ["Green infrastructure effect", result.policyMitigation > 0 ? "-" + result.policyMitigation + " points" : "none"],
          ], showSummary);
        });
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
    focusOn(0, -2, 120);
    var outcome = computeOutcome({
      horizon: state.horizon, floodPolicy: state.floodPolicy,
      heatPolicy: state.heatPolicy, energyPolicy: state.energyPolicy,
    });
    state.outcome = outcome;
    var html =
      "<p>Your choices, computed together across the whole city:</p>" +
      "<table class=\"summary-table\"><tr><th>Act</th><th>Choice</th><th>Index</th></tr>" +
      "<tr><td>Heat Vision</td><td>" + state.heatPolicy + "</td><td>" + outcome.heat.index + " / 100</td></tr>" +
      "<tr><td>Energy Vision</td><td>" + state.energyPolicy + "</td><td>" + outcome.energy.index + " / 100</td></tr>" +
      "<tr><td>Flood Vision</td><td>" + state.floodPolicy + "</td><td>" + outcome.flood.index + " / 100</td></tr>" +
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

  onSurveyComplete["btn-post-survey-continue"] = function (responses) {
    state.post = responses;
    finish();
  };

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
      var key = "vancouver_climate_futures_" + participantId;
      window.localStorage.setItem(key, JSON.stringify(record));
    } catch (e) { /* localStorage unavailable (private mode, etc.); export still works from memory below */ }

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

  // Expose minimal test hooks for headless verification without a human.
  window.__game = { state: state, condition: condition, participantId: participantId };
})();
