# Running UbuntuLink locally

The one-page version: three services, three terminals, three ports. For first-time setup (keys,
accounts, installing Java/Node/Python) see [INSTRUCTIONS.md](INSTRUCTIONS.md); for what every key
is and where it goes, [KEYS.md](KEYS.md).

## Running it by hand

Open three terminals, one per service, and start them in this order. Commands are for PowerShell
from the repo root; each one `cd`s into its own service folder first.

**1. Backend (Spring Boot, port 8080)**

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Ready when the log says `Started BackendApplication` (about 20 s).

**2. ML service (FastAPI, port 8000)**

```powershell
cd python
py -3.13 -m pip install -r requirements.txt   # first run, or after requirements.txt changes
py -3.13 -m uvicorn app.main:app --reload --port 8000
```

Ready when the log says `Application startup complete`.

Use `py -3.13` rather than `python`. Plain `python` can resolve to a 32-bit install, and
scipy/qiskit (the quantum match) have no 32-bit Windows builds, so the install fails there. Check
with `py -0p` — you want the entry *without* `-32`. On a 32-bit Python the service still starts,
but the quantum recommendation is unavailable.

**3. Frontend (Vite, port 5173)**

```powershell
cd frontend
npm install     # first run, or after package.json changes
npm run dev
```

Then open **http://localhost:5173**.

| Service | Terminal starts in | Command | Port |
|---|---|---|---|
| Backend (Spring Boot) | `backend/` | `.\mvnw.cmd spring-boot:run` | 8080 |
| ML service (FastAPI) | `python/` | `py -3.13 -m uvicorn app.main:app --reload --port 8000` | 8000 |
| Frontend (Vite) | `frontend/` | `npm run dev` | 5173 |

The leading `.\` is required in PowerShell — it won't run a program from the current directory
without it. On macOS or Linux the backend command is `./mvnw spring-boot:run` and the ML service
uses `python3`.

`start-all.bat` in the repo root still opens all three in their own windows if you'd rather not
run them by hand, but it uses plain `python`, so read the note under step 2.

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

None of them are committed — a fresh clone needs them created by hand. Never commit them, or
copies of them (`.env.bak` and the like).

**Use Supabase's transaction pooler for `SUPABASE_DB_URL`** — port **6543**, with
`&prepareThreshold=0` on the end:

```
SUPABASE_DB_URL=jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:6543/postgres?user=postgres.<project>&password=<password>&prepareThreshold=0
```

The session pooler on port 5432 allows only 15 connections for the whole project, shared by every
teammate's local backend and the deployed one, so once a few are running the next backend fails
with `max clients reached`. The transaction pooler has no such cap. `prepareThreshold=0` is
required with it, because it doesn't keep server-side prepared statements between transactions.

Optional: `ML_SERVICE_URL` (backend) says where the ML service is for the quantum match. It
defaults to `http://localhost:8000`, so you only set it when deploying.

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

Ctrl-C in each terminal. If you started something in the background and Ctrl-C isn't available,
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
| Backend: `EMAXCONNSESSION: max clients reached`, then `Unable to determine Dialect` | `SUPABASE_DB_URL` uses the session pooler (port 5432) and the project's 15 slots are taken. Switch to port 6543 with `&prepareThreshold=0` (see above). |
| Backend: `UnknownHostException: …pooler.supabase.com` | A network or DNS blip. Check your connection and start it again. |
| ML install: `Unknown compiler(s)` / `metadata-generation-failed` while building scipy | You're on 32-bit Python. Use `py -3.13` (see step 2). |
| "Quantum recommendation is unavailable" on the matches page | The ML service isn't running, or is on a Python without qiskit. Everything else on the page still works. |
| AI classification fails, `check_llm.py` says no key found | `python/.env` has no key for the provider in use. The default is Gemini, which reads `LLM_API_KEY`/`GEMINI_API_KEY` and deliberately ignores a leftover `OPEN_ROUTER_API_KEY`. |
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
