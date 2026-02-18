# FlowLens

LINK TO DEPLOYED WEBSITE: https://flow-lens-v2-bl5q.vercel.app

<img width="2388" height="1600" alt="image" src="https://github.com/user-attachments/assets/fb46ed92-a8a0-41a6-85d9-87d63a173ea6" />






Interactive linked-list visualizer and teaching app (React + FastAPI).

Summary
- Frontend: Vite + React — visualizer, tutorial, hints, quiz, responsive UI.
- Backend: FastAPI — linked-list processing, save/load endpoints, presigned S3 uploads.
- Storage: S3 (AWS) or local fallback; LocalStack support for local S3 testing.

Quick Start (local)

Prerequisites
- Python 3.10+ (venv)
- Node 18+ and npm
- Docker (optional — for LocalStack)

1) Backend

```bash
# from repo root
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# start backend (no S3):
uvicorn api.handlers:app --reload

# if you want S3 enabled locally or in AWS, set S3_BUCKET (and optionally credentials):
export S3_BUCKET=flowlens123
# for LocalStack testing:
# export S3_ENDPOINT_URL=http://localhost:4566
uvicorn api.handlers:app --reload
```

2) Frontend

```bash
cd frontend
npm install
npm run dev
# open the Local URL printed by Vite (e.g. http://localhost:5174)
```

Local S3 with LocalStack (optional)

```bash
# start LocalStack (from repo root)
docker compose -f docker-compose.localstack.yml up -d

# create bucket and CORS using LocalStack endpoint
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=ca-central-1
aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket flowlens123 --region ca-central-1
aws --endpoint-url=http://localhost:4566 s3api put-bucket-cors --bucket flowlens123 --cors-configuration file://cors.json

# start backend pointing to LocalStack
export S3_BUCKET=flowlens123
export S3_ENDPOINT_URL=http://localhost:4566
uvicorn api.handlers:app --reload
```

Features to test
- Export/Import JSON via the frontend.
- Save to Cloud: POST `/api/save` (server-side S3 upload) — returns `storage: "s3"` when S3 is active.
- Upload Direct to S3: uses `/api/s3/presign` + client PUT to presigned URL.
- Load by id: GET `/api/load/{id}`.

Security notes
- Never commit AWS credentials or .env files. Use `.gitignore` to exclude them.
- Prefer IAM roles for deployed servers. Limit policies to `arn:aws:s3:::flowlens123/lists/*` with `s3:PutObject` and `s3:GetObject` permissions.

Developer tips
- Add `S3_ENDPOINT_URL` to point boto3 to LocalStack for local dev.
- `docker-compose.localstack.yml` is provided to run LocalStack for testing without touching AWS.

Deploying
- Frontend: Vercel/Netlify — build `frontend` and serve static assets.
- Backend: Host FastAPI on a serverless or container platform (AWS ECS, Lambda via API Gateway, or a small VM). Provide IAM role or credentials and set `S3_BUCKET` in the environment.

Files of interest
- `api/handlers.py` — backend routes and S3/presign logic.
- `frontend/src` — React app and components (visualizer, hints, quiz).
- `docker-compose.localstack.yml` — LocalStack compose file for local S3 emulation.

License & Contact
- Public
