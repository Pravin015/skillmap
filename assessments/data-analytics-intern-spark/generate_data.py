"""
AstraaHire — Data Analytics Intern Assessment
Dummy data generator. Run once: `python generate_data.py`

Produces the files described in data/SCHEMA.md with the pain-points
(skew, tz mixing, duplicates, nested nulls) intentionally built in.
"""
from __future__ import annotations
import csv
import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

random.seed(42)

OUT = Path(__file__).parent / "data"
OUT.mkdir(exist_ok=True)

STATES = ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Telangana",
          "Gujarat", "West Bengal", "Kerala", "Punjab", "Rajasthan"]
SKILLS_POOL = ["python", "sql", "spark", "pyspark", "hadoop", "airflow",
               "kafka", "delta", "iceberg", "pandas", "numpy", "scala",
               "aws", "gcp", "azure", "dbt", "snowflake", "tableau"]
ROLES = ["STUDENT", "MENTOR", "HR", "ORG", "INSTITUTION"]
EVENT_TYPES = ["page_view", "job_view", "apply_click", "quiz_start",
               "quiz_submit", "payment_init"]
STAGES = ["APPLIED", "SCREENED", "INTERVIEW", "OFFER", "REJECTED"]

TZS = ["+05:30", "+00:00", "-08:00"]  # IST, UTC, US/Pacific legacy


def rand_skills(n_min=2, n_max=6) -> str:
    return "|".join(random.sample(SKILLS_POOL, random.randint(n_min, n_max)))


def rand_ts(base: datetime, jitter_days: int = 180) -> datetime:
    return base - timedelta(
        seconds=random.randint(0, jitter_days * 86400)
    )


def iso_mixed_tz(dt: datetime) -> str:
    """Render in one of three timezones for the users table."""
    tz = random.choice(TZS)
    return dt.strftime("%Y-%m-%dT%H:%M:%S") + tz


def iso_utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


NOW = datetime(2026, 4, 20, tzinfo=timezone.utc)

# ───────────────────────── USERS ─────────────────────────
print("→ users.csv")
users = []
for i in range(1, 1001):
    uid = f"U_{i:04d}"
    role = random.choices(ROLES, weights=[70, 5, 10, 5, 10])[0]
    users.append({
        "user_id": uid,
        "role": role,
        "signup_ts": iso_mixed_tz(rand_ts(NOW, 365)),
        "state": "" if random.random() < 0.03 else random.choice(STATES),
        "college_tier": random.choice([1, 2, 3]) if role == "STUDENT" else "",
        "skills": rand_skills(),
    })

with open(OUT / "users.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=users[0].keys())
    w.writeheader()
    w.writerows(users)

user_ids = [u["user_id"] for u in users]
# Heavy hitters — first 5 users get 30% of events
HEAVY = user_ids[:5]

# ───────────────────────── JOBS ──────────────────────────
print("→ jobs.csv")
jobs = []
ORGS = ["Zomato", "Swiggy", "Razorpay", "Freshworks", "PhonePe", "CRED",
        "Meesho", "Paytm", "Ola", "Byju's", "Unacademy", "upGrad",
        "TCS", "Infosys", "Wipro", "Accenture"]
TITLES = ["Data Analytics Intern", "Data Engineer Intern", "ML Engineer",
          "Backend Intern", "Frontend Intern", "Full-stack Intern",
          "SDE-1", "Data Scientist", "Analytics Engineer"]
for i in range(1, 501):
    smin = random.choice([15000, 20000, 25000, 30000, 40000, 60000])
    jobs.append({
        "job_id": f"J_{i:04d}",
        "title": random.choice(TITLES),
        "org": random.choice(ORGS),
        "skills": rand_skills(3, 7),
        "salary_min": smin,
        "salary_max": smin + random.randint(5000, 40000),
        "posted_ts": iso_utc(rand_ts(NOW, 120)),
        "remote": random.choice([True, False]),
    })

with open(OUT / "jobs.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=jobs[0].keys())
    w.writeheader()
    w.writerows(jobs)

job_ids = [j["job_id"] for j in jobs]

# ───────────────────────── EVENTS (skewed) ───────────────
print("→ events.csv  (50 000 rows, skewed)")
with open(OUT / "events.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["event_id", "user_id", "event_type", "ts",
                "session_id", "metadata_json"])
    for _ in range(50_000):
        # 30% of events go to heavy users
        uid = random.choice(HEAVY) if random.random() < 0.30 else random.choice(user_ids)
        et = random.choice(EVENT_TYPES)
        ts = rand_ts(NOW, 60)
        # session_id intentionally left blank-ish (pre-computed only sometimes)
        sess = f"S_{uuid.uuid4().hex[:10]}" if random.random() < 0.4 else ""
        # metadata varies by event type
        if et == "job_view":
            meta = {"job_id": random.choice(job_ids), "referrer": random.choice(["home", "search", "rec"])}
        elif et == "apply_click":
            meta = {"job_id": random.choice(job_ids)}
        elif et == "quiz_submit":
            meta = {"score": random.randint(0, 100), "pass": random.choice([True, False])}
        elif et == "payment_init":
            meta = {"amount_paise": random.choice([49900, 99900, 199900])}
        else:
            meta = {"path": random.choice(["/jobs", "/courses", "/profile", "/"])}
        w.writerow([
            uuid.uuid4().hex, uid, et, iso_utc(ts), sess,
            json.dumps(meta, separators=(",", ":"))
        ])

# ───────────────────────── APPLICATIONS ──────────────────
print("→ applications.csv")
apps = []
for i in range(1, 8001):
    applied = rand_ts(NOW, 90)
    stage = random.choices(
        STAGES, weights=[50, 25, 15, 5, 5]
    )[0]
    stage_shift = timedelta(days=random.randint(0, 30))
    apps.append({
        "application_id": f"A_{i:05d}",
        "user_id": random.choice(user_ids),
        "job_id": random.choice(job_ids),
        "applied_ts": iso_utc(applied),
        "stage": stage,
        "stage_ts": iso_utc(applied + stage_shift),
    })

with open(OUT / "applications.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=apps[0].keys())
    w.writeheader()
    w.writerows(apps)

# ───────────────────────── PAYMENTS (dupes) ──────────────
print("→ payments.csv  (with webhook duplicates)")
payments = []
base_orders = []
for i in range(1, 2001):
    oid = f"order_{uuid.uuid4().hex[:14]}"
    base_orders.append(oid)
    uid = random.choice(user_ids)
    amt = random.choice([49900, 99900, 199900, 499900])
    created = rand_ts(NOW, 60)
    # initial CREATED row
    payments.append({
        "order_id": oid, "user_id": uid, "amount_paise": amt,
        "status": "CREATED", "created_ts": iso_utc(created),
        "captured_ts": "", "source": "api",
    })
    # progression
    progression = random.choices(
        [["AUTHORIZED", "CAPTURED"], ["FAILED"], ["AUTHORIZED", "CAPTURED", "REFUNDED"], []],
        weights=[70, 15, 10, 5],
    )[0]
    t = created
    for st in progression:
        t = t + timedelta(seconds=random.randint(5, 400))
        payments.append({
            "order_id": oid, "user_id": uid, "amount_paise": amt,
            "status": st, "created_ts": iso_utc(created),
            "captured_ts": iso_utc(t) if st in ("CAPTURED", "REFUNDED") else "",
            "source": "webhook",
        })
    # inject duplicates for ~15% of orders (webhook retries)
    if random.random() < 0.15 and progression:
        dup = dict(payments[-1])
        payments.append(dup)

# amount mismatch bug for a few rows
for _ in range(12):
    row = random.choice(payments)
    row = dict(row)
    row["amount_paise"] = row["amount_paise"] + random.choice([-100, 100])
    row["source"] = "api"
    payments.append(row)

random.shuffle(payments)
with open(OUT / "payments.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=payments[0].keys())
    w.writeheader()
    w.writerows(payments)

print(f"   payments rows: {len(payments):,} across {len(base_orders):,} orders")

# ───────────────────────── PROCTORING (nested) ───────────
print("→ proctoring_events.jsonl")
with open(OUT / "proctoring_events.jsonl", "w", encoding="utf-8") as f:
    for _ in range(20_000):
        dur = random.randint(600, 5400)
        n_frames = dur // 30
        tab_sw = random.choices([0, 1, 2, 5, 9, 14], weights=[50, 20, 15, 8, 5, 2])[0]
        fs_exits = random.choices([0, 1, 2, 4], weights=[70, 20, 7, 3])[0]
        face_absent = round(random.betavariate(1.5, 8) * 100, 2)
        rec = {
            "session_id": f"S_{uuid.uuid4().hex[:12]}",
            "user_id": random.choice(user_ids),
            "assessment_id": f"A_{random.randint(1, 40):03d}",
            "started_at": iso_utc(rand_ts(NOW, 45)),
            "duration_s": dur,
            "flags": {
                "tab_switches": tab_sw,
                "fullscreen_exits": fs_exits,
                "face_absent_frames_pct": face_absent,
                "multiple_faces_detected": random.random() < 0.03,
                "copy_paste_events": random.choices([0, 1, 3], weights=[85, 10, 5])[0],
            },
            "webcam_frames": [
                {
                    "t": 30 * k,
                    "faces": random.choices([0, 1, 2], weights=[10, 88, 2])[0],
                    "confidence": None if random.random() < 0.08 else round(random.uniform(0.7, 1.0), 3),
                }
                for k in range(min(n_frames, 40))  # cap for file size
            ],
            "network_drops": random.sample(range(0, dur), k=random.randint(0, 4)) if random.random() < 0.6 else [],
        }
        f.write(json.dumps(rec) + "\n")

print("\n✔ All dummy data written to ./data/")
print("  Now read README.md and get to work. Good luck.")
