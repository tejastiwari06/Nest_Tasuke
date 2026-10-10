# Forest Officer Alert System Backend

A FastAPI backend for processing audio inference and dispatching alerts to forest officers.

## Setup

1. Make sure Python 3.11 is installed.
2. Install FFmpeg and ensure it is in your system PATH.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to suit your setup.

## Running the Server

Start the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

## Gmail App Password

If you are using Gmail for SMTP:
1. Go to your Google Account -> Security.
2. Enable 2-Step Verification if not already enabled.
3. Search for "App Passwords".
4. Create a new App Password (e.g. for "FastAPI Backend").
5. Copy the 16-character password into `SMTP_PASSWORD` in `.env`.

## Smoke Test

You can test the full flow (registration, auth, analyze) using the smoke test script.
```bash
python scripts/smoke_test.py path/to/sample.wav
```

## Example cURLs

**Register**
```bash
curl -X POST http://localhost:8000/api/auth/register -H "Content-Type: application/json" -d '{"email": "test@forest.gov", "full_name": "Test Officer", "designation": "Ranger", "forest_division": "Div1", "forest_range": "Range1"}'
```

**Verify / Login**
```bash
curl -X POST http://localhost:8000/api/auth/verify-email -H "Content-Type: application/json" -d '{"email": "test@forest.gov", "code": "123456"}'
```

**Analyze**
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Cookie: session=<your_jwt_cookie>" \
  -F "audio=@/path/to/test.wav" \
  -F "zone_id=Zone_1"
```
