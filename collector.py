import docker
import time
import threading
import shared_state

client = docker.from_env()

SERVICE_NAMES = ["frontend-service", "order-service", "inventory-service"]

KEY_MAP = {
    "frontend-service":  "frontend",
    "order-service":     "order",
    "inventory-service": "inventory",
}

def calculate_cpu_percent(stats):
    cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                stats["precpu_stats"]["cpu_usage"]["total_usage"]
    system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                   stats["precpu_stats"]["system_cpu_usage"]
    num_cpus = stats["cpu_stats"].get("online_cpus",
               len(stats["cpu_stats"]["cpu_usage"].get("percpu_usage", [1])))
    if system_delta == 0:
        return 0.0
    return round((cpu_delta / system_delta) * num_cpus * 100.0, 2)

def calculate_mem_percent(stats):
    usage = stats["memory_stats"].get("usage", 0)
    limit = stats["memory_stats"].get("limit", 1)
    return round((usage / limit) * 100.0, 2)

def collect_loop():
    print("[collector] Starting...")
    while True:
        for container_name in SERVICE_NAMES:
            try:
                container = client.containers.get(container_name)
                raw = container.stats(stream=False)
                cpu = calculate_cpu_percent(raw)
                mem = calculate_mem_percent(raw)
                key = KEY_MAP[container_name]
                shared_state.metrics[key]["cpu"] = cpu
                shared_state.metrics[key]["mem"] = mem
                print(f"  {key}: cpu={cpu}%  mem={mem}%")
            except Exception as e:
                print(f"  [ERROR] {container_name}: {e}")
        time.sleep(2)

def start_background():
    t = threading.Thread(target=collect_loop, daemon=True)
    t.start()

if __name__ == "__main__":
    collect_loop()