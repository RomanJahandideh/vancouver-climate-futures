# Okanagan Climate Futures

An interactive, place-based serious game about local climate choices and outcomes for three real Kelowna-area places, built in the same tradition as UBC Okanagan's Centre for Culture and Technology's **Future Delta 2.0** (a community-based game about local climate change, evaluated with real participants) and its predecessor **Future Delta** (an immersive simulation combining climate modelling, real places, 3D visualization, and community engagement). This project follows that same real-place, real-data, choice-and-consequence, evaluated-with-a-real-instrument structure, applied to a new region (the Okanagan, not the Fraser Delta) and a new deterministic climate-impact model grounded in real, cited regional projections.

**A full research design, not just a playable demo:** formal research questions and hypotheses, a complete two-condition (interactive vs. static) evaluation instrument built on a real validated attitude scale, a real statistics pipeline verified against synthetic data with a known injected effect, and one hypothesis (H3, about the model itself) that is fully confirmed by real, exhaustive computation today, no human participants required.

## Why this project, and why it isn't a Unity build

Future Delta 2.0 is a Unity game. Unity is not something this environment can build, run, or verify end-to-end, and this project series' whole discipline has been: never claim a result that wasn't actually run and checked. So this project is built in Three.js instead, a real, tested, playable, deployable browser-based 3D experience, exercising the same underlying design pattern (real place, real data, meaningful choices, visible consequences, a genuine evaluation instrument) using technology that could be built, run headlessly, and verified in this session, the same honesty trade this whole series has made consistently rather than describing an unverified Unity build as if it had been tested.

## Research questions and hypotheses

**RQ1 — Does interactive, choice-driven exploration of local climate futures increase climate risk perception more than a static, information-equivalent presentation of the same content?**
*H1: participants in the interactive condition will show a larger pre-to-post increase on a validated climate/ecological risk-perception scale (an adapted NEP subset, see below) than participants in the static condition.*

**RQ2 — Does making the causal link between an adaptation policy choice and its projected outcome visually explicit change stated policy support more than simply reading the same outcome numbers?**
*H2: interactive-condition participants will show a larger pre-to-post increase in support for the three proactive adaptation policies than static-condition participants.*

**RQ3 — Is the deterministic climate-impact model internally consistent with the direction the cited regional science implies, everywhere in the choice space, not just in a couple of anecdotal examples?**
*H3: the model will be monotonic, in the expected direction, across the full combinatorial choice space.*

RQ1 and RQ2 need real human participants; no study with real participants has been run for this project (no IRB, no recruitment, no live deployment). RQ3 needs no human participants at all, it is a claim about the code, and is answered here, today, with real, exhaustive computation.

## Results

**RQ3 / H3 — CONFIRMED, exhaustively.** `test_impact_model.js` checks the full 2 (horizon) x 2x2x2 (per-act policy) = 16-combination choice space, not a sample: the 2080s horizon never improves any of the three acts' risk indices relative to 2050s across all 8 fixed-policy combinations (0 violations), and each act's proactive policy never worsens that act's own index across all 4 fixed-other-choice combinations (0 violations), for all three acts. The single best combination (2050s, proactive everywhere) strictly beats the single worst (2080s, status-quo everywhere) on every one of the three act indices and the composite. 15/15 checks pass.

**RQ1 / H1 and RQ2 / H2 — not yet tested with real participants; the complete instrument and a verified analysis pipeline are ready for a real pilot.** `test_survey.js` verifies the NEP-subset reverse-scoring and averaging logic against hand-computed cases (12/12 checks). `test_analysis.py` verifies the actual statistics pipeline (Welch's t-test, Cohen's d) two ways on SYNTHETIC data with a known ground truth: a **power check** (a real injected 0.4-0.5 point pre-to-post gap between conditions is correctly detected, p<0.05, correct direction, large effect size) and a **specificity check** (with no true injected effect, the false-positive rate across 20 random seeds was 1/20 = 5%, matching the expected alpha=0.05 rate almost exactly, not a broken pipeline that reports significance regardless of the data). 6/6 checks pass. This means: if a real pilot is run, `analysis.py <exported_csv>` will produce a statistically sound answer to RQ1 and RQ2, not an untested script.

## How to test it

```
git clone https://github.com/RomanJahandideh/okanagan-climate-futures.git
cd okanagan-climate-futures
```

1. **Run the unit tests first (no dependencies beyond Node and Python's standard library + scipy).** `node test_impact_model.js` (15 checks, RQ3/H3), `node test_survey.js` (12 checks), `python test_analysis.py` (6 checks, using synthetic data only, clearly labeled).
2. **Play the interactive game.** Serve the folder (`npx serve .`) and open `index.html`. Answer the pre-survey, choose a horizon, make a choice in each of the three real Kelowna-area acts (Fire Vision, Water Vision, Shoreline Vision), watch the 3D scene respond, a thinned/hazy forest, a color-shifted vineyard, a lake level that moves within its real regulated band, see the regional outcome summary, answer the post-survey, and optionally download your own anonymized CSV.
3. **Read the static control condition.** Open `static.html`, same real facts, same choices, same computed numbers, presented as a non-interactive booklet instead of an explorable 3D world. This is the actual experimental manipulation RQ1/RQ2 test.
4. **Reproduce H3 directly.** `node test_impact_model.js` prints every one of the exhaustive monotonicity checks and ends with `H3 CONFIRMED`.
5. **Verify the evaluation pipeline on synthetic data.** `python synthetic_pilot.py` writes `synthetic_pilot_data.csv` (randomly generated, clearly labeled, not real), then `python analysis.py synthetic_pilot_data.csv` runs the real Welch's t-test / Cohen's d comparison on it and prints a result consistent with the injected effect.
6. **Run a real pilot.** Deploy `index.html` and `static.html`, randomly assign participants (the interactive page's `?condition=static` param exists for testing only; a real deployment should link participants to whichever page their random assignment selected), collect each participant's downloaded CSV, concatenate them, and run `python analysis.py <combined_csv>` for a real answer to RQ1/RQ2.

## The three real places and the deterministic impact model

- **Fire Vision — Knox Mountain / Glenmore, Kelowna**: a real wildland-urban interface. Choice: status quo vs. proactive fuel management (prescribed burns/fuel thinning, a real FireSmart BC measure).
- **Water Vision — South East Kelowna benchlands**: real agricultural benchlands (orchards/vineyards). Choice: status quo vs. drip-irrigation efficiency upgrades (a real BC Agriculture / Okanagan Basin Water Board adaptation measure).
- **Shoreline Vision — Okanagan Lake foreshore, Downtown to Mission**: Okanagan Lake's real regulated operating band, 340.4m (lowest desirable) to 342.48m (full pool) (BC government Okanagan Lake Regulation System factsheet). Choice: status quo hard infrastructure vs. wetland restoration and shoreline setbacks.

`impact_model.js` computes every outcome from two real, cited figures (Pacific Climate Impacts Consortium, in partnership with the North Okanagan, Central Okanagan and Okanagan-Similkameen Regional Districts, *Climate Projections for the Okanagan Region*, February 2020, baseline 1961-1990): **23% less summer precipitation** (long-term projection) and **~32 days/year above 30°C in the 2050s, rising to ~52-54 in the 2080s** (valley bottoms), with the report separately noting wildfire risk rises materially near 2.5°C of average annual warming by 2050. The two selectable time horizons are the report's own two real, cited horizons, not an invented emissions-scenario label. Every other numeric coefficient (base risk levels, the size of each policy's mitigating effect, scaling factors) is an explicitly illustrative, order-of-magnitude-reasonable placeholder, the same "PLACEHOLDER, clearly labeled" discipline as `BASE_ELEV_M`/`SLOPE` in `vancouver-view-corridor-massing` and the carbon/wind proxies in `environmental-massing-agents`; see the comments at the top of `impact_model.js` for exactly which numbers are real citations and which are illustrative.

## The evaluation instrument

- **NEP-subset (6 items)**: an adapted subset of the 15-item **revised New Ecological Paradigm scale** (Dunlap, R.E., Van Liere, K.D., Mertig, A.G., & Jones, R.E. (2000). Measuring endorsement of the new ecological paradigm: A revised NEP scale. *Journal of Social Issues*, 56(3), 425-442.), a real, widely used, validated measure of ecological worldview, balanced between pro- and anti-NEP items (reverse-scored per the scale's own convention). This is a subset chosen for a short pre/post pilot administration; a real deployment should use the complete validated instrument from the cited source.
- **Policy-support items (3 items)**: written specifically for this study, one tied to each act's real adaptation choice. Not from a validated scale, and not claimed to be one.
- Administered identically, pre and post, in both conditions (`survey.js`, shared by `index.html` and `static.html`), so only the experience between the two administrations differs.

## Research grounding

- **Future Delta 2.0** (UBC Okanagan Centre for Culture and Technology, with CALP at UBC Forestry): a real, published serious game set in Delta, BC, structured as three acts, each with its own named "vision" tool (CIMA Vision, Carbon Vision, Future Vision) targeting a different local sub-area and climate challenge (sea-level rise, carbon, adaptation), co-designed and evaluated with students and teachers, reported as producing "significant increases in climate change concern and awareness." (Fitzpatrick, K. et al., *Future Delta 2.0: An Experiential Learning Context for a Serious Game about Local Climate Change*, SIGGRAPH Asia 2015 Symposium on Education.) This project follows the same three-act, named-"vision"-tool, real-sub-place structure, applied to three real Okanagan places instead of three Delta neighbourhoods.
- **Future Delta** (the original, SSHRC-funded 2009/2011 predecessor): "an immersive and interactive virtual environment that acts as a tool for communication between researchers and the public," combining climate science and community engagement. The direct precedent for treating a climate visualization as a two-way communication tool, not a one-way presentation.
- **Pacific Climate Impacts Consortium**, in partnership with the North Okanagan, Central Okanagan and Okanagan-Similkameen Regional Districts, *Climate Projections for the Okanagan Region* (February 2020) — the real, cited source for every climate figure in `impact_model.js`.
- BC government, *Okanagan Lake Regulation System* factsheet — the real, cited source for the lake's regulated operating band.
- Dunlap, Van Liere, Mertig & Jones (2000), the revised NEP scale — the real, cited, validated instrument the pre/post evaluation is built on.

## What's a placeholder, and why, keeping uncertainty visible

The two real, cited climate figures (summer precipitation reduction, hot-day counts) are used directly. Everything else in the impact model, base risk levels, how much each policy choice moves the needle, is an explicitly labeled illustrative placeholder chosen to produce a legible, correctly-behaved, directionally-honest worked example, not a claimed regional-science output. The 2050s summer-precipitation figure is an explicitly stated 60%-of-the-cited-long-term-figure interpolation, since the source report gives one long-term number, not a per-horizon split; this is stated plainly in `impact_model.js`'s own comments rather than presented as a separately cited figure. The lake's vertical scale in the 3D scene is deliberately exaggerated for legibility, stated explicitly in `main.js` rather than implied as 1:1.

## What's tested, and what isn't

`test_impact_model.js` (15 checks) exhaustively verifies the deterministic model's monotonicity and exact formula behaviour before any of it reaches the game. `test_survey.js` (12 checks) verifies the scoring logic, including a genuine bug class this catches: a reverse-scoring error would silently invert half the scale, checked directly with hand-computed cases (all-5 and all-1 responses both correctly average to the scale's midpoint, 3.0, a property of a balanced pro/anti-NEP scale). `test_analysis.py` (6 checks) verifies the statistics pipeline's power and specificity on synthetic data with a known ground truth. The full interactive game (`index.html`) and static control (`static.html`) were both driven end-to-end with headless Chrome (every screen transition, survey gating, all three act choices, the 3D scene's visual response, CSV export), catching and fixing two real bugs in the process: a CSS specificity bug where `.screen { display:flex }` silently overrode the browser's own `[hidden] { display:none }` (every screen rendered stacked on top of each other until an explicit `.screen[hidden] { display:none }` rule was added), and a variable-ordering bug where the lake-visualization code referenced a wrapper object before it was defined, throwing an uncaught error that silently killed the entire script before any button worked, caught only because the game was actually driven end-to-end in a browser rather than merely read.

No study with real human participants has been run: no IRB, no recruitment, no live deployment. RQ1 and RQ2 are answerable only with real participant data; what exists today is the complete, real instrument and a verified analysis pipeline, demonstrated correctly on clearly-labeled synthetic data, ready for a real pilot, not a claimed result.

## Run it locally

```
node test_impact_model.js && node test_survey.js && python test_analysis.py
npx serve .
```
Then open `index.html` (interactive) or `static.html` (control) in a browser.
