# Running UbuntuLink locally

The one-page version: three services, three terminals, three ports. For first-time setup (keys,
accounts, installing Java/Node/Python) see [INSTRUCTIONS.md](INSTRUCTIONS.md); for what every key
is and where it goes, [KEYS.md](KEYS.md).

## The short version

From the repo root:

```
start-all.bat
```

That opens all three services in their own windows. Then go to **http://localhost:5173**.

To run them by hand, one terminal each:

| Service | Terminal starts in | Command | Port |
|---|---|---|---|
| Backend (Spring Boot) | `backend/` | `mvnw.cmd spring-boot:run` | 8080 |
| ML service (FastAPI) | `python/` | `python -m uvicorn app.main:app --reload --port 8000` | 8000 |
| Frontend (Vite) | `frontend/` | `npm run dev` | 5173 |

On macOS or Linux the backend command is `./mvnw spring-boot:run`.

---

## Where you stand matters

Each command runs from its own service folder, **not** from the folder below it.

```
python/                 <- stand here for the ML service
├── app/                <- do NOT cd into this
│   └── main.py         <- what runs, but you never call it directly
└── check_llm.py
```

`app.main:app` means "the object called `app` inside `app/main.py`". From inside `python/app/`
that name can't resolve, and you get a `ModuleNotFoundError` or a missing-file error.

You never run a `.py` file directly for the ML service, and the `__init__.py` files are empty
markers that say "this folder is a package" — there is nothing to run in them.

---

## What each service needs before it starts

| Service | File | Must contain |
|---|---|---|
| Backend | `backend/.env` | `SUPABASE_DB_URL`, `JWT_SECRET` |
| ML service | `python/.env` | `LLM_API_KEY` (or `GEMINI_API_KEY` / `Gemini_key`) |
| Frontend | `frontend/.env.local` | `VITE_API_BASE_URL=http://localhost:8080`, `VITE_ML_API_BASE_URL=http://localhost:8000` |

All three exist on this machine already. None of them are committed — a fresh clone needs them
created by hand.

First run only, in `frontend/`:

```
npm install
```

---

## Checking it came up

**Backend** — ready when the log says `Started BackendApplication`. Then:

```
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/services
```

`401` is correct, not a failure: every route except `/auth/**` needs a token. To get one:

```
curl -X POST http://localhost:8080/auth/login -H "Content-Type: application/json" ^
  -d "{\"email\":\"customer@ubuntulink.demo\",\"password\":\"Demo1234!\"}"
```

That returns the raw JWT, not a JSON object with a `token` field.

**ML service** — ready when the log says `Application startup complete`.

```
curl http://localhost:8000/health
```

Interactive docs: **http://localhost:8000/docs**.

To check the Gemini key and model without generating anything:

```
cd python
python check_llm.py
```

It prints the provider, which env variable the key came from, and the models your key can use.
Add `--call` to also send one short test prompt.

**Frontend** — Vite prints the URL. Open **http://localhost:5173**.

---

## Demo logins

| Role | Email | Password |
|---|---|---|
| Customer | `customer@ubuntulink.demo` | `Demo1234!` |
| Provider | `provider@ubuntulink.demo` | `Demo1234!` |

---

## Stopping

Ctrl-C in each window. If you started something in the background and Ctrl-C isn't available,
the Maven wrapper and `uvicorn --reload` both fork a child that survives — kill it by port:

```
netstat -ano | findstr ":8080.*LISTENING"
taskkill /PID <pid> /F
```

Same for 8000 and 5173.

---

## When it doesn't work

| What you see | What it means |
|---|---|
| `Could not resolve placeholder 'SUPABASE_DB_URL'` or `'JWT_SECRET'` | `backend/.env` missing or incomplete. It must be at `backend/.env`. |
| `ModuleNotFoundError: No module named 'app'` | You're inside `python/app/`. Go up to `python/`. |
| Backend: `HikariPool-1 - Connection is not available` after the laptop slept | The pooled database connections died while the JVM was suspended. Restart the backend; nothing is corrupted. |
| Backend: `Port 8080 was already in use` | An earlier run is still alive — kill it by port (above). |
| Frontend loads but every call fails with a CORS error | The backend isn't running, or you opened the app on a port that isn't 5173. |
| `Couldn't reach the ML service` on "Describe your problem" | ML service isn't running on 8000, or `LLM_API_KEY` is wrong — run `python check_llm.py`. |
| Provider search still works but AI classification doesn't | Expected. The search falls back to local keyword matching when the ML service is down; only classification needs the model. |
| ML service: "rate limit or free-tier quota reached" | Gemini's free tier is per-minute limited. Wait a minute, or point `LLM_BASE_URL`/`LLM_MODEL` at another provider (KEYS.md §1.4). |
| Empty or truncated AI answers | Don't set `LLM_REASONING_EFFORT` above `none` without raising `LLM_MAX_TOKENS` — on Gemini 2.5 thinking tokens eat the answer. See KEYS.md §1.4. |

---

## Two things worth knowing

**The database is shared and live.** All three services point at the same Supabase instance your
teammates and the deployed app use. Anything you create locally is visible to everyone, and the
backend seeds demo accounts and fills gaps in provider data on every start.

**Only the running app calls the model.** There are no demo scripts that generate text — they
were removed so nothing burns provider quota outside the product. `check_llm.py` is the exception
and only generates with `--call`; every model call in `python/tests/` is mocked.
