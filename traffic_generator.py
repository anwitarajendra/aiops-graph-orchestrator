import requests
import threading
import time
import argparse

FRONTEND_URL = "http://localhost:3000"
NORMAL_RPS = 1
STRESS_RPS = 50

def fire_request():
    try:
        r = requests.get(FRONTEND_URL + "/", timeout=3)
        print(f"  [{r.status_code}] latency={r.elapsed.total_seconds()*1000:.0f}ms")
    except Exception as e:
        print(f"  [ERR] {e}")

def normal_mode():
    print("[traffic] Normal mode — 1 req/s")
    while True:
        fire_request()
        time.sleep(1)

def stress_mode():
    print("[traffic] STRESS mode — 50 concurrent req/s")
    while True:
        threads = [threading.Thread(target=fire_request) for _ in range(STRESS_RPS)]
        for t in threads: t.start()
        for t in threads: t.join()
        time.sleep(0.5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["normal", "stress"], default="normal")
    args = parser.parse_args()
    if args.mode == "stress":
        stress_mode()
    else:
        normal_mode()