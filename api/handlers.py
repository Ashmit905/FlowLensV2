from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import importlib.util
import uuid
import os
import json
from typing import Optional
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:
    boto3 = None


app = FastAPI(title="FlowLens API")

# Allow CORS from local Vite dev servers (multiple ports during dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ListRequest(BaseModel):
    items: list[str]


def _load_linked_list():
    # Load the existing linked_list module by file path so we don't need package imports
    repo_root = Path(__file__).resolve().parent.parent
    target = repo_root / "FlowLens" / "Backend" / "App" / "src" / "linked_list.py"
    spec = importlib.util.spec_from_file_location("flowlens_linked_list", str(target))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.LinkedList


@app.get("/api/ping")
async def ping():
    return {"status": "ok", "service": "flowlens", "version": "0.1"}


def _visualize_values(values: list) -> str:
    return " -> ".join([f"[ {v} ]" for v in values]) + " -> None"


@app.post("/api/linked-list/process")
async def process_linked_list(req: ListRequest):
    LinkedList = _load_linked_list()
    ll = LinkedList(req.items)
    result = ll.to_list()
    visual = _visualize_values(result)
    return {"list": result, "visual": visual}


@app.post("/api/save")
async def save_list(payload: dict):
    # payload expected: {"list": [...]}
    data = payload.get("list") or payload.get("items")
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Missing 'list' array in payload")

    obj = {"list": data}
    key = f"lists/{uuid.uuid4().hex}.json"

    # If S3 is configured (env var S3_BUCKET), try to upload
    s3_bucket = os.environ.get("S3_BUCKET")
    s3_endpoint = os.environ.get("S3_ENDPOINT_URL")
    if boto3 and s3_bucket:
        # allow using LocalStack or custom endpoint in dev via S3_ENDPOINT_URL
        s3 = boto3.client("s3", endpoint_url=s3_endpoint) if s3_endpoint else boto3.client("s3")
        try:
            s3.put_object(Bucket=s3_bucket, Key=key, Body=json.dumps(obj), ContentType="application/json")
            url = f"s3://{s3_bucket}/{key}"
            return {"id": key, "storage": "s3", "uri": url}
        except (BotoCoreError, ClientError) as e:
            # fallback to local
            pass

    # fallback: store under repo data/ directory
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"
    data_dir.mkdir(exist_ok=True)
    local_path = data_dir / key.split('/')[-1]
    with open(local_path, 'w') as f:
        json.dump(obj, f)
    return {"id": str(local_path.name), "storage": "local", "path": str(local_path)}


@app.post("/api/s3/presign")
async def presign_s3():
    """Return a presigned PUT URL and object key for direct client upload."""
    s3_bucket = os.environ.get("S3_BUCKET")
    if not boto3 or not s3_bucket:
        raise HTTPException(status_code=400, detail="S3 not configured")

    key = f"lists/{uuid.uuid4().hex}.json"
    # respect S3_ENDPOINT_URL if provided (LocalStack/testing)
    s3_endpoint = os.environ.get("S3_ENDPOINT_URL")
    s3 = boto3.client("s3", endpoint_url=s3_endpoint) if s3_endpoint else boto3.client("s3")
    try:
        url = s3.generate_presigned_url(
            'put_object',
            Params={"Bucket": s3_bucket, "Key": key, "ContentType": "application/json"},
            ExpiresIn=3600,
            HttpMethod='PUT'
        )
        return {"url": url, "key": key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Presign failed: {e}")


@app.get("/api/load/{id}")
async def load_list(id: str, storage: Optional[str] = None):
    # If id looks like s3 key and S3 is configured, attempt to fetch
    s3_bucket = os.environ.get("S3_BUCKET")
    if boto3 and s3_bucket and (storage == "s3" or id.startswith("lists/")):
        s3 = boto3.client("s3")
        try:
            resp = s3.get_object(Bucket=s3_bucket, Key=id)
            body = resp["Body"].read()
            obj = json.loads(body)
            return obj
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Not found in s3: {e}")

    # fallback: look in local data dir
    repo_root = Path(__file__).resolve().parent.parent
    data_dir = repo_root / "data"
    candidate = data_dir / id
    if candidate.exists():
        with open(candidate, 'r') as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Not found")
