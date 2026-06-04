from flask import Flask, jsonify
import requests, os, time, random

app = Flask(__name__)
INVENTORY_URL = os.getenv("INVENTORY_SERVICE_URL", "http://localhost:3002")

@app.route("/health")
def health():
    return jsonify({"service": "order", "status": "ok"})

@app.route("/order")
def order():
    start = time.time()
    try:
        inv = requests.get(f"{INVENTORY_URL}/inventory", timeout=2).json()
    except Exception as e:
        inv = {"error": str(e)}
    latency = (time.time() - start) * 1000
    return jsonify({"order_id": random.randint(1000, 9999), "inventory": inv, "latency_ms": round(latency, 2)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3001)