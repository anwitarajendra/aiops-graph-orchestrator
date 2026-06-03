import networkx as nx
import numpy as np
from shared_state import metrics

# The 3 services and their fixed order
SERVICES = ["frontend", "order", "inventory"]

def build_graph():
    G = nx.DiGraph()

    # Add a node for each service
    for service in SERVICES:
        G.add_node(service)

    # Add edges: frontend → order → inventory → frontend
    # (representing how services call each other)
    G.add_edge("frontend", "order")
    G.add_edge("order", "inventory")
    G.add_edge("inventory", "frontend")

    return G

def get_adjacency_matrix():
    G = build_graph()
    # Returns a 3x3 numpy array
    A = nx.to_numpy_array(G, nodelist=SERVICES)
    return A

def get_feature_matrix():
    # Returns a 3x2 numpy array: each row is [cpu/100, mem/100]
    rows = []
    for service in SERVICES:
        cpu = metrics[service]["cpu"] / 100.0
        mem = metrics[service]["mem"] / 100.0
        rows.append([cpu, mem])
    return np.array(rows)