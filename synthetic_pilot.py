"""
Generates SYNTHETIC pilot data, not real human responses. No study
with real participants has been run for this project (no IRB, no
recruitment, no live deployment); this script exists to verify that
analysis.py's statistics pipeline is implemented correctly, by giving
it data with a KNOWN, injected true effect and checking that it
recovers that effect (see test_analysis.py), the same "verify the
pipeline with a known-answer case before trusting it on anything real"
discipline used throughout this project series (e.g. hypervolume.py
verified against an exact 2D case in environmental-massing-agents).

Every value in the output CSV is randomly generated. The column
`synthetic` is set to 1 on every row as a standing reminder, and the
file is written as synthetic_pilot_data.csv, never a name that could be
mistaken for a real dataset.

Run with: python synthetic_pilot.py [--n-per-group 40] [--effect-nep 0.4 0.1] [--seed 0]
"""

import argparse
import csv
import random


def generate(n_per_group=40, interactive_effect=(0.4, 0.35), static_effect=(0.1, 0.05), seed=0):
    """interactive_effect / static_effect: (nep_delta_mean, policy_delta_mean)
    the TRUE injected pre->post change for each condition. Individual
    participants get gaussian noise around these means, clipped to a
    valid 1-5 scale range."""
    rng = random.Random(seed)
    rows = []
    for condition, (nep_effect, policy_effect) in [("interactive", interactive_effect), ("static", static_effect)]:
        for i in range(n_per_group):
            pre_nep = max(1.0, min(5.0, rng.gauss(3.0, 0.55)))
            pre_policy = max(1.0, min(5.0, rng.gauss(3.0, 0.6)))
            post_nep = max(1.0, min(5.0, pre_nep + rng.gauss(nep_effect, 0.35)))
            post_policy = max(1.0, min(5.0, pre_policy + rng.gauss(policy_effect, 0.4)))
            rows.append({
                "participant_id": "%s_%03d" % (condition, i),
                "condition": condition,
                "synthetic": 1,
                "pre_nep_score": round(pre_nep, 3),
                "post_nep_score": round(post_nep, 3),
                "pre_policy_score": round(pre_policy, 3),
                "post_policy_score": round(post_policy, 3),
            })
    return rows


def write_csv(rows, path="synthetic_pilot_data.csv"):
    fields = ["participant_id", "condition", "synthetic", "pre_nep_score", "post_nep_score", "pre_policy_score", "post_policy_score"]
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    return path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n-per-group", type=int, default=40)
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--out", default="synthetic_pilot_data.csv")
    args = ap.parse_args()
    rows = generate(n_per_group=args.n_per_group, seed=args.seed)
    path = write_csv(rows, args.out)
    print("Wrote %d SYNTHETIC (not real) participant rows to %s" % (len(rows), path))
    print("This data is randomly generated to verify analysis.py's statistics pipeline, "
          "not a real pilot study result. See README.md's 'What's tested, and what isn't'.")
