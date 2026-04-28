# Dataset Schema Reference

All files live in this directory. Treat them as **samples of production tables** — write code that would work at 10⁴× the size.

---

## `users.csv`
| Column | Type | Notes |
|---|---|---|
| user_id | string | Prefix `U_`. Primary key. |
| role | string | STUDENT / MENTOR / HR / ORG / INSTITUTION |
| signup_ts | string | ISO-8601, **mixed timezones** (IST, UTC, US/Pacific) |
| state | string | Indian state; ~3 % nulls |
| college_tier | int | 1 / 2 / 3; null for non-students |
| skills | string | Pipe-delimited: `python|sql|spark` |

## `events.csv` — heavily skewed
| Column | Type | Notes |
|---|---|---|
| event_id | string | UUID |
| user_id | string | FK → users |
| event_type | string | `page_view` / `job_view` / `apply_click` / `quiz_start` / `quiz_submit` / `payment_init` |
| ts | string | ISO-8601 UTC |
| session_id | string | NOT pre-computed — you derive it (T1.3) |
| metadata_json | string | Stringified JSON, schema varies by event_type |

> ⚠️ Distribution: 5 users (`U_0001..U_0005`) own ~30 % of rows. Treat as skew.

## `jobs.csv`
| Column | Type | Notes |
|---|---|---|
| job_id | string | Prefix `J_` |
| title | string | |
| org | string | |
| skills | string | Pipe-delimited |
| salary_min | int | INR |
| salary_max | int | INR |
| posted_ts | string | ISO-8601 UTC |
| remote | boolean | |

## `applications.csv`
| Column | Type | Notes |
|---|---|---|
| application_id | string | |
| user_id | string | FK |
| job_id | string | FK |
| applied_ts | string | UTC |
| stage | string | APPLIED / SCREENED / INTERVIEW / OFFER / REJECTED |
| stage_ts | string | UTC — latest stage transition |

## `payments.csv` — contains duplicates
| Column | Type | Notes |
|---|---|---|
| order_id | string | **Not unique** — webhook retries! |
| user_id | string | FK |
| amount_paise | long | |
| status | string | CREATED / AUTHORIZED / CAPTURED / FAILED / REFUNDED |
| created_ts | string | UTC |
| captured_ts | string | UTC; null if not captured |
| source | string | `api` / `webhook` — prefer the later-timestamped row |

## `proctoring_events.jsonl` — nested
```json
{
  "session_id": "S_...",
  "user_id": "U_...",
  "assessment_id": "A_...",
  "started_at": "2026-03-14T08:22:11Z",
  "duration_s": 2734,
  "flags": {
    "tab_switches": 3,
    "fullscreen_exits": 1,
    "face_absent_frames_pct": 12.4,
    "multiple_faces_detected": false,
    "copy_paste_events": 0
  },
  "webcam_frames": [
    {"t": 0, "faces": 1, "confidence": 0.98},
    {"t": 30, "faces": 0, "confidence": null},
    ...
  ],
  "network_drops": [12, 47, 901]
}
```
Nulls expected in `webcam_frames[*].confidence` and empty `network_drops` arrays.
