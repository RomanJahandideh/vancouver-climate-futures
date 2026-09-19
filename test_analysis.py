"""
Verifies analysis.py's statistics pipeline two ways, both using
SYNTHETIC data with a KNOWN ground truth, never real participant data:

  1. Power check: when a real, meaningful effect is injected (the
     interactive condition's synthetic pre->post change is generated
     larger than the static condition's), the pipeline must detect it
     (p < 0.05, correct direction).
  2. Specificity check: when NO true effect is injected (both
     conditions generated with the identical distribution), the
     pipeline must NOT falsely report significance most of the time,
     checked across repeated random seeds rather than asserting on a
     single seed's noise, since a single null-case run finding p<0.05
     by chance is expected roughly 5% of the time under a correctly
     working alpha=0.05 test, not evidence of a bug.

Run with: python test_analysis.py
"""

from synthetic_pilot import generate, write_csv
from analysis import compute_deltas, compare

PASS = 0
FAIL = 0


def check(name, cond):
    global PASS, FAIL
    if cond:
        PASS += 1
        print("PASS:", name)
    else:
        FAIL += 1
        print("FAIL:", name)


# --- Power check: a real injected effect must be detected ---
rows = generate(n_per_group=60, interactive_effect=(0.5, 0.45), static_effect=(0.05, 0.05), seed=1)
deltas = compute_deltas(rows)
nep_result = compare(deltas, "nep", "power check: NEP")
policy_result = compare(deltas, "policy", "power check: policy")

check("power check: NEP delta is detected as significant (p<0.05) with a real injected 0.45-point gap", nep_result["p"] < 0.05)
check("power check: NEP effect direction is correct (interactive > static)", nep_result["mean_interactive"] > nep_result["mean_static"])
check("power check: policy delta is detected as significant (p<0.05) with a real injected 0.40-point gap", policy_result["p"] < 0.05)
check("power check: policy effect direction is correct (interactive > static)", policy_result["mean_interactive"] > policy_result["mean_static"])
check("power check: Cohen's d is large (>0.8) for a clearly-injected effect, not just barely significant", abs(nep_result["cohens_d"]) > 0.8)

# --- Specificity check: no true effect, repeated across seeds; the
# false-positive rate should be low, consistent with alpha=0.05, not
# a broken pipeline that "detects" an effect regardless of the data ---
false_positives = 0
n_seeds = 20
for seed in range(100, 100 + n_seeds):
    null_rows = generate(n_per_group=40, interactive_effect=(0.2, 0.2), static_effect=(0.2, 0.2), seed=seed)
    null_deltas = compute_deltas(null_rows)
    r = compare(null_deltas, "nep", "null check seed=%d" % seed)
    if r["p"] < 0.05:
        false_positives += 1

print("\nNull-case false-positive rate: %d / %d seeds (expected roughly ~1/20 at alpha=0.05)" % (false_positives, n_seeds))
check("specificity check: false-positive rate is low (<= 4/20), not a broken always-significant pipeline",
      false_positives <= 4)

print("\n%d passed, %d failed" % (PASS, FAIL))
print("\nNote: every result above is on SYNTHETIC, randomly generated data used only to verify "
      "the analysis code itself. No claim is made here about real human participants.")
if FAIL:
    raise SystemExit(1)
