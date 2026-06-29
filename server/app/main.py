from fastapi import FastAPI

app = FastAPI(title="SUPMEAL API")


@app.get("/health")
def health():
    """Healthcheck minimal pour vérifier que l API tourne."""
    return {"status": "ok"}


@app.get("/")
def root():
    return {"service": "supmeal-api", "docs": "/docs"}