"""
The real statistics pipeline for RQ1/H1 and RQ2/H2: reads a CSV of
participant records (the same schema survey.js's toCsvRow/csvHeader
produce, one row per participant, pre and post scores already
computed), computes each participant's pre->post change, and compares
the two conditions with an independent-samples Welch's t-test (does not
assume equal variances, the standard, more conservative default for a
two-group comparison of this kind) plus Cohen's d effect size.

This script is intended to run on REAL pilot or study data once
collected (see README.md's "How to test it" for how responses are
exported from the game). It is verified here, before any real data
exists, against SYNTHETIC data with a known injected effect
(synthetic_pilot.py, test_analysis.py), the same "verify against a
known-answer case first" discipline as the rest of this project series.

Run with: python analysis.py <csv_path>
"""

import csv
import sys
from scipy import stats


def load_rows(path):
    with open(path) as f:
        return list(csv.DictReader(f))


def compute_deltas(rows):
    deltas = {"interactive": {"nep": [], "policy": []}, "static": {"nep": [], "policy": []}}
    for r in rows:
        cond = r["condition"]
        if cond not in deltas:
            continue
        deltas[cond]["nep"].append(float(r["post_nep_score"]) - float(r["pre_nep_score"]))
        deltas[cond]["policy"].append(float(r["post_policy_score"]) - float(r["pre_policy_score"]))
    return deltas


def cohens_d(a, b):
    na, nb = len(a), len(b)
    ma, mb = sum(a) / na, sum(b) / nb
    va = sum((x - ma) ** 2 for x in a) / (na - 1)
    vb = sum((x - mb) ** 2 for x in b) / (nb - 1)
    pooled_sd = (((na - 1) * va + (nb - 1) * vb) / (na + nb - 2)) ** 0.5
    return (ma - mb) / pooled_sd if pooled_sd > 0 else 0.0


def compare(deltas, outcome_key, label):
    interactive = deltas["interactive"][outcome_key]
    static = deltas["static"][outcome_key]
    t, p = stats.ttest_ind(interactive, static, equal_var=False)
    d = cohens_d(interactive, static)
    mean_i = sum(interactive) / len(interactive)
    mean_s = sum(static) / len(static)
    print("%s: interactive mean pre->post change = %+.3f (n=%d), static = %+.3f (n=%d)"
          % (label, mean_i, len(interactive), mean_s, len(static)))
    print("  Welch's t = %.3f, p = %.4f, Cohen's d = %.3f (%s)"
          % (t, p, d, "significant at alpha=0.05" if p < 0.05 else "not significant at alpha=0.05"))
    return {"outcome": outcome_key, "mean_interactive": mean_i, "mean_static": mean_s,
            "t": t, "p": p, "cohens_d": d, "n_interactive": len(interactive), "n_static": len(static)}


def run(path):
    rows = load_rows(path)
    is_synthetic = any(r.get("synthetic") == "1" for r in rows)
    if is_synthetic:
        print("*** SYNTHETIC DATA: this file contains randomly generated rows for pipeline "
              "verification, NOT real participant responses. See README.md. ***\n")
    deltas = compute_deltas(rows)
    print("N: interactive=%d, static=%d\n" % (len(deltas["interactive"]["nep"]), len(deltas["static"]["nep"])))
    results = [
        compare(deltas, "nep", "RQ1/H1 (climate risk perception, NEP-subset delta)"),
        compare(deltas, "policy", "RQ2/H2 (adaptation policy support delta)"),
    ]
    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python analysis.py <csv_path>")
        raise SystemExit(1)
    run(sys.argv[1])
