# syntax=docker/dockerfile:1
# CPU build. For GPU inference swap the base for an NVIDIA CUDA runtime image (e.g. nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04
# + python3-pip) and install a CUDA build of torch; the code selects cuda automatically when available.
FROM python:3.12-slim AS build
WORKDIR /w
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 TORCH_HOME=/opt/torch
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr libglib2.0-0 && rm -rf /var/lib/apt/lists/*
RUN useradd --create-home --uid 10001 app
WORKDIR /srv
COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir --no-index --find-links=/wheels /wheels/* && rm -rf /wheels
# bake the pretrained weights into the image so the container never needs the network at runtime
RUN python -c "from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights as W; efficientnet_b0(weights=W.DEFAULT)" && chmod -R a+rX /opt/torch
COPY app.py .
USER app
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8001/health')"
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
