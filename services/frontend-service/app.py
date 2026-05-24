from flask import Flask, jsonify
import requests, os, time, random

app = Flask(__name__)
ORDER_URL = os.getenv("ORDER_SERVICE_URL", "http://localhost:3001")

@app.route("/health")
def health():
    return jsonify({"service": "frontend", "status": "ok"})

@app.route("/")
def index():
    start = time.time()
    try:
        order = requests.get(f"{ORDER_URL}/order", timeout=2).json()
    except Exception as e:
        order = {"error": str(e)}
    latency = (time.time() - start) * 1000
    return jsonify({"page": "home", "order_data": order, "latency_ms": round(latency, 2)})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000)