import time
import threading
import docker
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
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
CONTAINER_NAMES = {
    "frontend":  "frontend-service",
    "order":     "order-service",
    "inventory": "inventory-service",
}

anomaly_frames = {s: 0 for s in SERVICES}
gnn_status     = {s: "healthy" for s in SERVICES}
live_metrics   = {s: {"cpu": 0.0, "mem": 0.0} for s in SERVICES}
recent_actions = []
docker_client  = docker.from_env()

def read_container_metrics(container_name):
    try:
        container = docker_client.containers.get(container_name)
        raw = container.stats(stream=False)
        cpu_delta = raw["cpu_stats"]["cpu_usage"]["total_usage"] - \
                    raw["precpu_stats"]["cpu_usage"]["total_usage"]
        sys_delta = raw["cpu_stats"]["system_cpu_usage"] - \
                    raw["precpu_stats"]["system_cpu_usage"]
        num_cpus  = raw["cpu_stats"].get("online_cpus", 1)
        cpu = round((cpu_delta / sys_delta) * num_cpus * 100.0, 2) if sys_delta > 0 else 0.0
        usage = raw["memory_stats"].get("usage", 0)
        limit = raw["memory_stats"].get("limit", 1)
        mem = round((usage / limit) * 100.0, 2)
        return cpu, mem
    except Exception as e:
        print(f"[orchestrator] Error reading {container_name}: {e}")
        return 0.0, 0.0

def restart_container(service):
    try:
        container = docker_client.containers.get(CONTAINER_NAMES[service])
        container.restart()
        msg = f"restarted {service} at {time.strftime('%H:%M:%S')}"
        print(f"[orchestrator] {msg}")
        recent_actions.append(msg)
    except Exception as e:
        print(f"[orchestrator] Could not restart {service}: {e}")

def gnn_loop():
    X_train, Y_train = gnn_brain.generate_synthetic_data()
    W0, W1, bias = gnn_brain.train_gnn(X_train, Y_train)
    while True:
        for service in SERVICES:
            cpu, mem = read_container_metrics(CONTAINER_NAMES[service])
            live_metrics[service]["cpu"] = cpu
            live_metrics[service]["mem"] = mem

        graph_manager.update_metrics(live_metrics)
        A = graph_manager.get_adjacency_matrix()
        X = graph_manager.get_feature_matrix()

        gnn_predictions = gnn_brain.predict_anomalies(A, X, W0, W1, bias)
        print(f"[orchestrator] metrics={live_metrics}")
        print(f"[orchestrator] predictions={gnn_predictions}")

        for i, service in enumerate(SERVICES):
            if gnn_predictions[i] == 1:
                gnn_status[service] = "anomaly"
                anomaly_frames[service] += 1
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
        nodes[service] = {
            "status": gnn_status[service],
            "cpu":    live_metrics[service]["cpu"],
            "mem":    live_metrics[service]["mem"],
        }
    return {
        "timestamp": int(time.time()),
        "nodes":     nodes,
        "actions":   recent_actions[-5:],
    }

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)