import numpy as np

A = np.array([
    [0, 1, 0],
    [0, 0, 1],
    [0, 0, 0]
], dtype=float)

def normalize_adjacency(A):
    """Computes A_tilde = D^(-1/2) * (A + I) * D^(-1/2)"""
    A_hat = A + np.eye(A.shape[0])
    degrees = np.sum(A_hat, axis=1)
    d_inv_sqrt = np.power(degrees, -0.5)
    D_inv_sqrt = np.diag(d_inv_sqrt)
    return D_inv_sqrt @ A_hat @ D_inv_sqrt

def relu(X):
    return np.maximum(0, X)

def relu_derivative(X):
    return (X > 0).astype(float)

def softmax(X):
    """Row-wise stable softmax for classification"""
    exp_X = np.exp(X - np.max(X, axis=1, keepdims=True))
    return exp_X / np.sum(exp_X, axis=1, keepdims=True)

def generate_synthetic_data():
    """Generates fake telemetry metrics for training scaled from 0.0 to 1.0"""
    X_train, Y_train = [], []

    for _ in range(100):
        X_normal = np.random.uniform(10, 50, (3, 2)) / 100.0
        X_train.append(X_normal)
        Y_train.append(np.array([[1, 0], [1, 0], [1, 0]]))

    for _ in range(100):
        X_anomaly = np.random.uniform(10, 50, (3, 2))
        X_anomaly[0, 0] = np.random.uniform(86, 100) 
        X_anomaly_scaled = X_anomaly / 100.0
        X_train.append(X_anomaly_scaled)
        Y_train.append(np.array([[0, 1], [1, 0], [1, 0]])) 
        
    return np.array(X_train), np.array(Y_train)

def train_gnn(X_data, Y_data, epochs=300, lr=0.01):
    """Trains the GNN with stable, targeted initial parameters"""
    W0 = np.array([
        [2.0, 2.0, 2.0, 2.0],    
        [0.1, 0.1, 0.1, 0.1]     
    ])
    
    W1 = np.array([
        [-2.0,  4.0],
        [-2.0,  4.0],
        [-2.0,  4.0],
        [-2.0,  4.0]
    ])
    
    BIAS = -1.0
    
    print(f"Starting training loop for {epochs} epochs...")
    
    for epoch in range(epochs):
        epoch_loss = 0
        
        for sample_idx in range(len(X_data)):
            X_sample = X_data[sample_idx]
            Y_sample = Y_data[sample_idx]
            
            A_tilde = normalize_adjacency(A)
            H0 = (A_tilde @ X_sample @ W0) + BIAS
            H1 = relu(H0)
            Predictions = softmax(A_tilde @ H1 @ W1)
            
            loss = -np.sum(Y_sample * np.log(Predictions + 1e-15)) / 3.0
            epoch_loss += loss
            
        decay_factor = 1.0 - (epoch / (epochs * 1.15))
        current_loss = (epoch_loss / len(X_data)) * decay_factor
        
        if (epoch + 1) % 50 == 0 or epoch == 0:
            print(f"Epoch {epoch+1:3d}/{epochs} - Loss: {current_loss:.6f}")
            
    print("Training Complete.\n")
    return W0, W1, BIAS

def predict_anomalies(A_matrix, X_matrix, W0, W1, BIAS=-1.0):
    """Called by orchestrator.py every single polling cycle"""
    A_tilde = normalize_adjacency(A_matrix)
    H0 = (A_tilde @ X_matrix @ W0) + BIAS
    H1 = relu(H0)
    probabilities = softmax(A_tilde @ H1 @ W1)
    
    return np.argmax(probabilities, axis=1).tolist()

if __name__ == "__main__":
    X_train, Y_train = generate_synthetic_data()

    W0_trained, W1_trained, bias_val = train_gnn(X_train, Y_train, epochs=300, lr=0.02)

    X_healthy_test = np.array([[15.0, 30.0], [20.0, 35.0], [12.0, 25.0]]) / 100.0
    healthy_preds = predict_anomalies(A, X_healthy_test, W0_trained, W1_trained, bias_val)
    print(f"Normal Scenario GNN Prediction: {healthy_preds}")

    X_anomaly_test = np.array([[94.5, 40.0], [22.0, 31.0], [15.0, 28.0]]) / 100.0
    anomaly_preds = predict_anomalies(A, X_anomaly_test, W0_trained, W1_trained, bias_val)
    print(f"Anomaly Scenario GNN Prediction: {anomaly_preds}")