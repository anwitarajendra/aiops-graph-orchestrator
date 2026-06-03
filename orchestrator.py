import time
import threading
import docker
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from shared_state import metrics
import graph_manager
import gnn_brain


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = ["frontend", "order", "inventory"]

# Container names must match docker-compose exactly
CONTAINER_NAMES = {
    "frontend":  "frontend-service",
    "order":     "order-service",
    "inventory": "inventory-service",
}

# Tracks how many consecutive anomaly frames each service has
anomaly_frames = {s: 0 for s in SERVICES}
gnn_status = {s: "healthy" for s in SERVICES}

# Tracks what actions were taken (for /status)
recent_actions = []

def is_anomaly(service):
    cpu = metrics[service]["cpu"]
    mem = metrics[service]["mem"]
    return cpu > 80.0 or mem > 80.0

def restart_container(service):
    try:
        client = docker.from_env()
        container = client.containers.get(CONTAINER_NAMES[service])
        container.restart()
        print(f"[orchestrator] Restarted {service}")
        recent_actions.append(f"restarted {service} at {int(time.time())}")
    except Exception as e:
        print(f"[orchestrator] Could not restart {service}: {e}")

def gnn_loop():
    X_train, Y_train = gnn_brain.generate_synthetic_data()
    W0, W1, bias = gnn_brain.train_gnn(X_train, Y_train)
    while True:
        A = graph_manager.get_adjacency_matrix()
        X = graph_manager.get_feature_matrix()

        print(f"[orchestrator] A=\n{A}")
        print(f"[orchestrator] X=\n{X}")

        gnn_predictions = gnn_brain.predict_anomalies(A, X, W0, W1, bias)
        for i, service in enumerate(SERVICES):
            if gnn_predictions[i] == 1:
                gnn_status[service] = "anomaly"
                anomaly_frames[service] += 1
                print(f"[orchestrator] {service} anomaly frame {anomaly_frames[service]}")
                if anomaly_frames[service] >= 3:
                    restart_container(service)
                    anomaly_frames[service] = 0
            else:
                gnn_status[service] = "healthy"
                anomaly_frames[service] = 0
    
    time.sleep(2)

@app.on_event("startup")
def start_background_thread():
    t = threading.Thread(target=gnn_loop, daemon=True)
    t.start()

@app.get("/status")
def status():
    nodes = {}
    for service in SERVICES:
        cpu = metrics[service]["cpu"]
        mem = metrics[service]["mem"]
        anomalous = is_anomaly(service)
        nodes[service] = {
            "status": gnn_status[service],
            "cpu": cpu,
            "mem": mem,
        }
    return {
        "timestamp": int(time.time()),
        "nodes": nodes,
        "actions": recent_actions[-5:],  # last 5 actions
    }

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)