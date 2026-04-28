# AstraaHire — Data Analytics Intern Assessment
## Apache Spark Proficiency Project (Advanced Tier)

> **Role:** Data Analytics Intern
> **Brand:** AstraaHire
> **Focus:** Apache Spark (PySpark + Spark SQL) — Top-level / Principal-track screening
> **Duration:** 72 hours (soft deadline) — submit whenever ready
> **Difficulty:** ⭐⭐⭐⭐⭐ (5 / 5) — Designed to separate "I used Spark once" from "I ship Spark at scale"

---

## 1. The Scenario

You have just joined **AstraaHire** — an AI-powered career intelligence platform for Indian fresh graduates. Our production data lake ingests millions of events per day across four domains:

1. **User events** — signups, logins, profile updates, session telemetry
2. **Job interactions** — views, applications, saves, rejections
3. **Assessment telemetry** — proctoring events, tab-switch counts, keystroke cadence, webcam frames metadata
4. **Payments** — Razorpay order / payment / refund events

The **Growth** and **Trust & Safety** teams have raised five open questions. The previous intern's notebooks are slow (one query takes 47 minutes on 200 M rows), non-idempotent, and fail on skewed partitions. Your job is to **rewrite the pipeline from scratch** — correct, fast, observable, and production-grade.

This is **not a tutorial**. No hand-holding. If something is ambiguous, decide — and **document the assumption** in your write-up.

---

## 2. The Dataset

Everything you need lives in `./data/`. These are scaled-down samples; your code must behave as if each were **10⁴× larger** (i.e. the `events.csv` is a stand-in for a 1 B-row partitioned Parquet table).

| File | Rows | Description |
|---|---|---|
| `users.csv` | 1 000 | Core user dimension (id, role, signup_ts, state, college_tier) |
| `events.csv` | 50 000 | Clickstream — `event_id, user_id, event_type, ts, session_id, metadata_json` |
| `jobs.csv` | 500 | Job postings (id, title, org, skills[], salary_min, salary_max, posted_ts) |
| `applications.csv` | 8 000 | User → job applications with outcome and stage timestamps |
| `payments.csv` | 3 000 | Razorpay events — `order_id, user_id, amount_paise, status, created_ts, captured_ts` |
| `proctoring_events.jsonl` | 20 000 | Semi-structured — nested flags, webcam frame metadata |

> **Expected pain points on purpose:**
> - `events.csv` is **heavily skewed** — ~30 % of rows belong to 5 power users. Naive `groupBy(user_id)` will hang a real cluster.
> - `metadata_json` is a **stringified JSON column** of varying schema.
> - `proctoring_events.jsonl` contains **nested arrays** and **null-heavy** columns.
> - Timestamps are in **three different timezones** (`Asia/Kolkata`, UTC, US/Pacific from a legacy SDK). You must normalise.
> - `payments.csv` has **duplicate order_id** rows (webhook retries). Dedupe idempotently.

A small schema reference is in `./data/SCHEMA.md`.

---

## 3. The Tasks

Complete **all of Tier 1**, **at least 3 of Tier 2**, and **at least 1 of Tier 3**.
Stretch goals are expected from strong candidates.

### Tier 1 — Fundamentals (must complete all)

**T1.1 — Ingestion layer**
Build a `bronze → silver → gold` medallion pipeline using PySpark DataFrames **and** Spark SQL (show both idioms). Silver tables must be Parquet with partitioning you justify. Explain your choice of partition column and expected file size.

**T1.2 — Timezone + dedup normalisation**
Normalise all timestamps to UTC. Dedupe `payments` idempotently — keep the **latest** status per `order_id` using a window function. Prove correctness with a unit test.

**T1.3 — DAU / WAU / MAU with sessionisation**
Compute daily / weekly / monthly active users. A **session** = events by one user with no > 30 min gap. Return: `avg_session_len`, `sessions_per_user_p50`, `sessions_per_user_p95`.
(Hint: `lag()` + cumulative sum to build session ids.)

### Tier 2 — Applied (pick 3+)

**T2.1 — Skew mitigation, measured**
The `events.groupBy(user_id)` aggregation is the previous intern's bottleneck. Show the skew (spark UI screenshot or `spark.sql("...").explain(True)` output), then fix it using **salting** *and* **AQE** (`spark.sql.adaptive.skewJoin.enabled`). Report wall-clock before/after.

**T2.2 — Funnel conversion**
For every user: compute the funnel `signup → profile_complete → first_application → first_interview → offer`. Output median time between each stage and drop-off % per stage, segmented by `college_tier`.

**T2.3 — Job-recommendation signal**
Using `applications` + `jobs.skills[]` + user profile skills, compute a **skill-match score** per (user, job) pair. Use an `explode` + `array_intersect` approach and a broadcast join on the jobs side. Top-20 recommendations per user.

**T2.4 — Proctoring anomaly detection**
Flag sessions where `tab_switches > 5 AND fullscreen_exits > 2 AND face_absent_frames_pct > 20%`. Output a ranked list of suspicious `session_id`s with a reason string. Use a UDF *only if* you cannot express it in native Spark — and justify.

**T2.5 — Payments reconciliation**
For every `order_id`, report `final_status`, `capture_latency_seconds`, and flag orders where `amount_paise` does not match the webhook and the API view.

### Tier 3 — Principal-level (pick 1+)

**T3.1 — Streaming version**
Rewrite T1.3 as a **Structured Streaming** job reading from a simulated socket/rate source with a **watermark** of 2 hours and **late-data** handling. Show the output mode choice with reasoning (`append` vs `update` vs `complete`).

**T3.2 — Catalyst deep-dive**
Take one of your queries, show its **logical / optimized logical / physical plan**. Identify one transformation the Catalyst optimizer applied (predicate pushdown, constant folding, projection pruning). Disable it (`spark.sql.optimizer.excludedRules`) and measure the regression.

**T3.3 — Delta / Iceberg upsert**
Re-express the silver-layer ingestion as an idempotent `MERGE INTO` (Delta Lake *or* Iceberg). Prove that re-running the job on the same input is a no-op (byte-equal table state).

**T3.4 — Cost model**
Given: cluster = 1 driver (4 vCPU / 16 GB) + 4 workers (8 vCPU / 32 GB) at ₹42 / hour each. Produce a cost-per-query table for your three heaviest jobs and propose two concrete optimisations with expected ₹ savings.

---

## 4. Deliverables

```
<your-name>-astraahire-spark-assessment/
├── README.md                ← Your write-up (decisions, assumptions, trade-offs)
├── notebooks/
│   └── exploration.ipynb    ← Narrative EDA
├── src/
│   ├── ingest.py            ← Bronze → Silver
│   ├── transform.py         ← Silver → Gold
│   ├── jobs/
│   │   ├── dau_wau_mau.py
│   │   ├── funnel.py
│   │   ├── skew_demo.py
│   │   └── ...
│   └── utils/
│       ├── schema.py        ← Explicit StructType definitions (NO inferSchema in prod)
│       └── spark.py         ← SparkSession builder w/ tuned configs
├── tests/
│   └── test_*.py            ← pytest + chispa (or built-in)
├── sql/
│   └── *.sql                ← Spark SQL variants
├── conf/
│   └── spark-defaults.conf  ← Your tuning choices, commented
└── screenshots/
    └── spark-ui-*.png       ← Evidence of skew + fix
```

**Hard requirements:**
- **No `inferSchema=True`** in production paths. Define `StructType` explicitly.
- **No `.collect()`** on anything that could be > 10 M rows. Use `.take()`, `.show()`, or `.write`.
- **All timestamps in UTC** in silver/gold layers.
- **Every job idempotent.** Re-running on the same input must not double-count.
- **Tests.** At least one `pytest` per Tier-1 task. Use `chispa` or `assertDataFrameEquals`.
- **Type hints** on every Python function.
- **Black + ruff** clean (`make fmt lint` — you write the Makefile).

---

## 5. Evaluation Rubric (100 pts)

| Area | Pts | What we look for |
|---|---|---|
| Correctness | 25 | DAU/WAU/MAU match our golden numbers (±0.1 %). Dedup is exact. |
| Spark fluency | 20 | Idiomatic DataFrame + SQL. No Python loops over rows. Uses `broadcast`, `repartition`, `coalesce` correctly. |
| Performance | 20 | Skew mitigated. Partitioning justified. Spark UI evidence. |
| Code quality | 15 | Modular, typed, tested, lintable. No notebook-driven spaghetti. |
| Observability | 10 | Logging, job metrics, data-quality checks (row counts, null ratios, schema assertions). |
| Write-up | 10 | Clear decisions, honest trade-offs, "what I would do with one more week". |

**Automatic disqualifiers:**
- `inferSchema` in any silver/gold path
- `collect()` followed by a Python `for` loop
- Undocumented use of `udf` where native Spark would work
- Timestamps compared across timezones without explicit conversion

---

## 6. Ground Rules

- **You may use LLMs** (Claude, ChatGPT, Cursor). Disclose prompts for any non-trivial generated block in `PROMPTS.md`. We care how you think, not whether you typed every keystroke.
- **You may use any Spark version ≥ 3.4.** Databricks Community Edition, local `pyspark`, or Docker all fine.
- **Commit incrementally.** We read `git log`. One mega-commit = -5 pts.
- **If stuck, ship partial.** 70 % done + honest README > 40 % done + fake claims.

---

## 7. Submission

- Private GitHub repo, invite `hiring@astraahire.com` (placeholder)
- Or zip & upload via the AstraaHire assessments portal
- Include a **3-minute Loom** walking us through your Spark UI screenshots and your biggest trade-off

---

## 8. A word from the hiring manager

> "We don't need you to know every `pyspark.sql.functions` call — we need you to **reason about data at scale**. When you see 1 B rows, do you think *lazy plan, shuffle boundaries, partition count*? Or do you think *let me just groupBy and hope*? Show us the first. Even a small, correct, well-reasoned submission beats a flashy broken one."
>
> — Head of Data, AstraaHire

Good luck. Ship something you'd be proud to put in production on day one.

— *The AstraaHire Data Team*
