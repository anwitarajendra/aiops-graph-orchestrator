from flask import Flask, jsonify
import time, random

app = Flask(__name__)

@app.route("/health")
def health():
    return jsonify({"service": "inventory", "status": "ok"})

@app.route("/inventory")
def inventory():
    time.sleep(random.uniform(0.01, 0.05))
    return jsonify({"items": 142, "warehouse": "BLR-01"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3002)