import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/status")
def status():
    return {
        "timestamp": int(time.time()),
        "nodes": {
            "frontend":  {"status": "healthy", "cpu": 12.0, "mem": 30.0},
            "order":     {"status": "anomaly", "cpu": 88.0, "mem": 71.0},
            "inventory": {"status": "anomaly", "cpu": 95.0, "mem": 89.0}
        },
        "actions": []
    }

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)