import os
from pathlib import Path
from contextlib import asynccontextmanager
import torch
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_DIR = os.getenv("MODEL_DIR", str(Path(__file__).resolve().parent / "koelectra_emotion6_multi_best"))
MAX_LEN = 160  # 학습 때 쓴 max_length
MAX_BATCH = 32
state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작 시 한 번만 로드
    torch.set_num_threads(2)
    state["tok"] = AutoTokenizer.from_pretrained(MODEL_DIR, local_files_only=True, trust_remote_code=False)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR, local_files_only=True, trust_remote_code=False, use_safetensors=True)
    model.eval()
    state["model"] = model
    state["id2label"] = model.config.id2label  # {0:분노, 1:슬픔, ...}
    assert set(state["id2label"].values()) == {'기쁨', '분노', '상처', '슬픔', '당황', '불안'}
    yield


app = FastAPI(lifespan=lifespan)


class Req(BaseModel):
    text: str


class BatchReq(BaseModel):
    texts: list[str]


def _format(probs):
    scores = {state["id2label"][i]: round(p, 4) for i, p in enumerate(probs)}
    top = max(scores, key=scores.get)
    top2 = sorted(scores, key=scores.get, reverse=True)[:2]
    return {"emotion": top, "confidence": scores[top], "top2": top2, "scores": scores}


def _predict(texts):
    enc = state["tok"](texts, return_tensors="pt", truncation=True, max_length=MAX_LEN, padding=True)
    with torch.no_grad():
        logits = state["model"](**enc).logits
    return [_format(p) for p in torch.softmax(logits, dim=-1).tolist()]


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/predict")
def predict(req: Req):
    return _predict([req.text])[0]


@app.post("/predict_batch")
def predict_batch(req: BatchReq):
    texts = [t for t in req.texts if t and t.strip()][:MAX_BATCH]
    return {"results": _predict(texts) if texts else []}
