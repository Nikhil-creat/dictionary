"""Vision microservice: OCR (OpenCV pre-processing + Tesseract LSTM) and object classification (EfficientNet-B0).

Zero-retention: uploaded bytes are decoded in memory and never written to disk; nothing is logged but status codes.
Not exercised by the unit tests (needs OpenCV, Tesseract and PyTorch installed - build the container to run it)."""
from __future__ import annotations

import io
import re

import cv2
import numpy as np
import pytesseract
import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from torchvision.models import EfficientNet_B0_Weights, efficientnet_b0

MAX_BYTES = 5 * 1024 * 1024
ALLOWED = {"image/jpeg", "image/png", "image/webp"}
app = FastAPI(title="Dictionary vision", docs_url=None, redoc_url=None)

_weights = EfficientNet_B0_Weights.DEFAULT
_model = efficientnet_b0(weights=_weights).eval()
_prep = _weights.transforms()
_labels = _weights.meta["categories"]
_device = "cuda" if torch.cuda.is_available() else "cpu"
_model.to(_device)


async def _decode(file: UploadFile) -> np.ndarray:
    if file.content_type not in ALLOWED:
        raise HTTPException(415, "unsupported image type")
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "image too large")
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)  # decoded from RAM, never saved
    del data
    if img is None:
        raise HTTPException(400, "could not decode image")
    h, w = img.shape[:2]
    if max(h, w) > 2400:  # bound the work an attacker can request
        s = 2400 / max(h, w)
        img = cv2.resize(img, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    return img


@app.get("/health")
def health():
    return {"status": "ok", "device": _device}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    img = await _decode(file)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.fastNlMeansDenoising(gray, None, 12, 7, 21)
    bw = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15)
    text = pytesseract.image_to_string(bw, config="--oem 1 --psm 6")
    words = sorted(set(re.findall(r"[A-Za-zÀ-ɏ]{3,}", text)), key=len, reverse=True)
    return {"text": text.strip()[:4000], "words": words[:20]}


@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    img = await _decode(file)
    from PIL import Image

    pil = Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    with torch.inference_mode():
        probs = _model(_prep(pil).unsqueeze(0).to(_device)).softmax(1)[0]
    top = torch.topk(probs, 5)
    return {"labels": [{"label": _labels[i], "score": round(float(s), 4)} for s, i in zip(top.values.tolist(), top.indices.tolist())]}
