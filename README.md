# Vancouver Climate Futures

An interactive, place-based serious game about local climate choices and outcomes for three real Vancouver places, built in the same tradition as UBC Okanagan's Centre for Culture and Technology's **Future Delta 2.0** (a community-based game about local climate change, evaluated with real participants) and its predecessor **Future Delta**, which is itself set in Delta, BC, in the same Metro Vancouver region this project uses. This project follows that same real-place, real-data, choice-and-consequence, evaluated-with-a-real-instrument structure, grounded in real, cited City of Vancouver and provincial data.

**A full research design, not just a playable demo:** formal research questions and hypotheses, a complete two-condition (interactive vs. static) evaluation instrument built on a real validated attitude scale, a real statistics pipeline verified against synthetic data with a known injected effect, and one hypothesis (H3, about the model itself) that is fully confirmed by real, exhaustive computation today, no human participants required.

## Why this project, and why it isn't a Unity build

Future Delta 2.0 is a Unity game. Unity is not something this environment can build, run, or verify end-to-end, and this project series' whole discipline has been: never claim a result that wasn't actually run and checked. So this project is built in Three.js instead, a real, tested, playable, deployable browser-based 3D experience, exercising the same underlying design pattern (real place, real data, meaningful choices, visible consequences, a genuine evaluation instrument) using technology that could be built, run headlessly, and verified in this session.

## Climate projection forecast

The introduction includes a selectable 2050s/2100s climate-projection forecast. It is a long-range scenario outlook, not a live weather forecast. The flood card uses the cited 0.5 m and 1.0 m sea-level-rise horizons and the City's 4.6 m Flood Construction Level. The heat and energy cards display the deterministic model's status-quo indices, which are explicitly illustrative prototype values rather than official City of Vancouver forecasts. The interface labels this boundary directly so modeled scenarios cannot be mistaken for measured observations or participant results.

## The 3D scene is the point: what changed after real user testing

An earlier version of this project blocked the entire viewport with a full-screen modal at every step, choices, surveys, everything, so the 3D world was never actually visible or explorable, which is exactly backwards for a project whose entire premise is "watch your choices visibly change a real place." Driving the app end-to-end with a real person surfaced that immediately, along with a second, sharper bug: the pre/post survey's Continue button still carried a leftover `disabled` HTML attribute from an earlier draft, so clicking it did nothing at all, not even an error, because a disabled button never fires a click event in the first place. Both are fixed:

- **The scene is never covered.** Only a small, bottom-docked panel captures clicks now; the rest of the viewport stays visible and fully draggable/zoomable at all times, with a persistent "Drag to look around, scroll to zoom" hint. A collapse handle lets you shrink any panel to a thin strip to see the whole scene on demand.
- **Every choice has a visible "watch it happen" beat.** After picking a policy in an act, the panel automatically collapses for about 1.5 seconds, with a "Watch the city respond..." banner, before showing the outcome numbers, so the visual consequence is actually seen, not just reported in text.
- **Continue is never a dead button.** It has no `disabled` state; clicking it while a question is unanswered visibly highlights every missing item in red and scrolls to the first one, rather than silently doing nothing.

## Research questions and hypotheses

**RQ1 — Does interactive, choice-driven exploration of local climate futures increase climate risk perception more than a static, information-equivalent presentation of the same content?**
*H1: participants in the interactive condition will show a larger pre-to-post increase on a validated climate/ecological risk-perception scale (an adapted NEP subset, see below) than participants in the static condition.*

**RQ2 — Does making the causal link between an adaptation policy choice and its projected outcome visually explicit change stated policy support more than simply reading the same outcome numbers?**
*H2: interactive-condition participants will show a larger pre-to-post increase in support for the three proactive adaptation policies than static-condition participants.*

**RQ3 — Is the deterministic climate-impact model internally consistent with the direction the cited regional science implies, everywhere in the choice space, not just in a couple of anecdotal examples?**
*H3: the model will be monotonic, in the expected direction, across the full combinatorial choice space.*

RQ1 and RQ2 need real human participants; no study with real participants has been run for this project (no IRB, no recruitment, no live deployment). RQ3 needs no human participants at all, it is a claim about the code, and is answered here, today, with real, exhaustive computation.

## Results

**RQ3 / H3 — CONFIRMED, exhaustively.** `test_impact_model.js` checks the full 2 (horizon) x 2x2x2 (per-act policy) = 16-combination choice space, not a sample: the 2100 horizon never improves any of the three acts' risk indices relative to 2050 across all 8 fixed-policy combinations (0 violations), and each act's proactive policy never worsens that act's own index across all 4 fixed-other-choice combinations (0 violations), for all three acts. The single best combination (2050s, proactive everywhere) strictly beats the single worst (2100s, status-quo everywhere) on every one of the three act indices and the composite. 18/18 checks pass.

**RQ1 / H1 and RQ2 / H2 — not yet tested with real participants; the complete instrument and a verified analysis pipeline are ready for a real pilot.** `test_survey.js` verifies the NEP-subset reverse-scoring and averaging logic against hand-computed cases (12/12 checks). `test_analysis.py` verifies the actual statistics pipeline (Welch's t-test, Cohen's d) two ways on SYNTHETIC data with a known ground truth: a **power check** (a real injected 0.4-0.5 point pre-to-post gap between conditions is correctly detected, p<0.05, correct direction, large effect size) and a **specificity check** (with no true injected effect, the false-positive rate across 20 random seeds was 1/20 = 5%, matching the expected alpha=0.05 rate almost exactly). 6/6 checks pass.

## How to test it

```
git clone https://github.com/RomanJahandideh/vancouver-climate-futures.git
cd vancouver-climate-futures
```

1. **Run the unit tests first.** `node test_impact_model.js` (18 checks, RQ3/H3), `node test_survey.js` (12 checks), `python test_analysis.py` (6 checks, synthetic data only, clearly labeled).
2. **Play the interactive game.** Serve the folder (`npx serve .`) and open `index.html`. The 3D scene is visible and draggable at every step. Answer the pre-survey (click every question wrong on purpose once, notice the missing ones highlight in red rather than nothing happening), choose a horizon, make a choice in each of the three real Vancouver acts (Heat Vision, Energy Vision, Flood Vision), watch the panel collapse and the scene visibly respond before the outcome appears, see the regional summary, answer the post-survey, and optionally download your own anonymized CSV.
3. **Read the static control condition.** Open `static.html`, same real facts, same choices, same computed numbers, presented as a non-interactive booklet. This is the actual experimental manipulation RQ1/RQ2 test.
4. **Reproduce H3 directly.** `node test_impact_model.js` prints every exhaustive monotonicity check and ends with `H3 CONFIRMED`.
5. **Verify the evaluation pipeline on synthetic data.** `python synthetic_pilot.py` writes `synthetic_pilot_data.csv` (randomly generated, clearly labeled, not real), then `python analysis.py synthetic_pilot_data.csv` runs the real Welch's t-test / Cohen's d comparison on it.
6. **Run a real pilot.** Deploy `index.html` and `static.html`, randomly assign participants, collect each participant's downloaded CSV, concatenate them, and run `python analysis.py <combined_csv>` for a real answer to RQ1/RQ2.

## The three real Vancouver places and the deterministic impact model

- **Heat Vision — a lower-tree-canopy neighbourhood (Marpole-type)**: grounded in the real 2021 BC heat dome (619 deaths province-wide, the deadliest weather event in BC history) and peer-reviewed analyses documenting a roughly 20°C neighbourhood temperature gap tied to tree canopy/greenness during the event. Choice: status quo vs. tree-canopy and cooling infrastructure investment.
- **Energy Vision — older rental-housing blocks**: grounded in the City of Vancouver's real RARA grant program ($3.5M) funding heat-pump/electrification retrofits for existing market rental buildings. Choice: status quo vs. retrofit investment.
- **Flood Vision — the False Creek foreshore**: grounded in the City of Vancouver's real Coastal Flood Risk Assessment, a real **4.6m Flood Construction Level** (Greater Vancouver Regional District datum) set to protect waterfront structures through 2100 against a real, cited **~1m of sea level rise** (~0.5m by 2050), and the City's real, ongoing Sea2City / False Creek Coastal Adaptation Plan. Choice: status quo hard infrastructure vs. coastal green infrastructure and setbacks.

`impact_model.js` uses these real, cited figures directly (0.5m/1m sea level rise, the 4.6m Flood Construction Level) as the actual numeric drivers of two of the three acts. The heat dome's 619-death toll and the documented canopy-temperature gap are cited as the real event motivating the Heat Vision act; that figure is never reproduced as, or compared to, a game output, only the abstract 0-100 heat exposure index is ever shown. Every other numeric coefficient (base risk levels, the size of each policy's mitigating effect, horizon-severity scaling) is an explicitly illustrative, order-of-magnitude-reasonable placeholder, the same "PLACEHOLDER, clearly labeled" discipline as `BASE_ELEV_M`/`SLOPE` in `vancouver-view-corridor-massing` and the carbon/wind proxies in `environmental-massing-agents`; see the comments at the top of `impact_model.js` for exactly which numbers are real citations and which are illustrative.

## The evaluation instrument

- **NEP-subset (6 items)**: an adapted subset of the 15-item **revised New Ecological Paradigm scale** (Dunlap, R.E., Van Liere, K.D., Mertig, A.G., & Jones, R.E. (2000). Measuring endorsement of the new ecological paradigm: A revised NEP scale. *Journal of Social Issues*, 56(3), 425-442.), a real, widely used, validated measure of ecological worldview, balanced between pro- and anti-NEP items (reverse-scored per the scale's own convention). A real deployment should use the complete validated instrument from the cited source.
- **Policy-support items (3 items)**: written specifically for this study, one tied to each act's real adaptation choice. Not from a validated scale, and not claimed to be one.
- Administered identically, pre and post, in both conditions (`survey.js`, shared by `index.html` and `static.html`).

## Research grounding

- **Future Delta 2.0** (UBC Okanagan Centre for Culture and Technology, with CALP at UBC Forestry): a real, published serious game set in Delta, BC, structured as three acts, each with its own named "vision" tool (CIMA Vision, Carbon Vision, Future Vision) targeting a different local sub-area and climate challenge, co-designed and evaluated with students and teachers, reported as producing "significant increases in climate change concern and awareness." (Fitzpatrick, K. et al., *Future Delta 2.0: An Experiential Learning Context for a Serious Game about Local Climate Change*, SIGGRAPH Asia 2015 Symposium on Education.) This project follows the same three-act, named-"vision"-tool structure, applied to three real Vancouver places instead of three Delta neighbourhoods, since Future Delta's own real setting (Delta, BC) is itself part of Metro Vancouver.
- **Future Delta** (the original, SSHRC-funded 2009/2011 predecessor): "an immersive and interactive virtual environment that acts as a tool for communication between researchers and the public."
- City of Vancouver, *Coastal Flood Risk Assessment* and "Adapting to sea level rise" (vancouver.ca) — the real, cited source for the 4.6m Flood Construction Level and sea-level-rise projections.
- Peer-reviewed analyses of community deaths during the 2021 BC heat dome (Greater Vancouver) — the real, cited source for the province-wide death toll and the documented canopy-driven temperature gap.
- City of Vancouver energy retrofit programs (RARA) — the real, cited source grounding the Energy Vision act.
- Dunlap, Van Liere, Mertig & Jones (2000), the revised NEP scale — the real, cited, validated instrument the pre/post evaluation is built on.

## What's a placeholder, and why, keeping uncertainty visible

The real, cited figures (sea level rise, the Flood Construction Level, the heat dome death toll and canopy gap, the RARA program) are used directly as the real-world grounding. Everything else in the impact model, base risk levels, how much each policy choice moves the needle, horizon-severity scaling for the two acts without a precise cited per-horizon figure, is an explicitly labeled illustrative placeholder chosen to produce a legible, correctly-behaved, directionally-honest worked example, not a claimed City-of-Vancouver-modeled output. The False Creek water level's vertical scale in the 3D scene is deliberately exaggerated for legibility, stated explicitly in `main.js` rather than implied as 1:1; the 4.6m ceiling it rises toward is real and cited, the low-end baseline is not.

## What's tested, and what isn't

`test_impact_model.js` (18 checks) exhaustively verifies the deterministic model's monotonicity and exact formula behaviour before any of it reaches the game. `test_survey.js` (12 checks) verifies the scoring logic. `test_analysis.py` (6 checks) verifies the statistics pipeline's power and specificity on synthetic data with a known ground truth. The full interactive game (`index.html`) and static control (`static.html`) were both driven end-to-end with headless Chrome, including a full user-facing session that surfaced and led to fixing the two real bugs described above (the scene-blocking overlay and the dead Continue button), re-verified afterward with the same headless walkthrough covering: the missing-answer highlight path, the docked-panel collapse/expand handle, the "watch the scene respond" sequence, all three acts, the regional summary, the post-survey, and CSV export, for both the interactive and static conditions.

No study with real human participants has been run: no IRB, no recruitment, no live deployment. RQ1 and RQ2 are answerable only with real participant data; what exists today is the complete, real instrument and a verified analysis pipeline, demonstrated correctly on clearly-labeled synthetic data, ready for a real pilot, not a claimed result.

## Run it locally

```
node test_impact_model.js && node test_survey.js && python test_analysis.py
npx serve .
```
Then open `index.html` (interactive) or `static.html` (control) in a browser.
