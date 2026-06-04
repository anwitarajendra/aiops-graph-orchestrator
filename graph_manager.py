import networkx as nx
import numpy as np

SERVICES = ["frontend", "order", "inventory"]

# Internal metrics store — updated directly by orchestrator
_metrics = {
    "frontend":  {"cpu": 0.0, "mem": 0.0},
    "order":     {"cpu": 0.0, "mem": 0.0},
    "inventory": {"cpu": 0.0, "mem": 0.0},
}

def update_metrics(metrics_dict):
    for service, data in metrics_dict.items():
        if service in SERVICES:
            _metrics[service]["cpu"] = data["cpu"]
            _metrics[service]["mem"] = data["mem"]

def build_graph():
    G = nx.DiGraph()
    for service in SERVICES:
        G.add_node(service)
    G.add_edge("frontend", "order")
    G.add_edge("order", "inventory")
    G.add_edge("inventory", "frontend")
    return G

def get_adjacency_matrix():
    G = build_graph()
    A = nx.to_numpy_array(G, nodelist=SERVICES)
    return A

def get_feature_matrix():
    rows = []
    for service in SERVICES:
        cpu = _metrics[service]["cpu"] / 100.0
        mem = _metrics[service]["mem"] / 100.0
        rows.append([cpu, mem])
    return np.array(rows)