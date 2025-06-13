from flask import Flask, request, jsonify
from flask_cors import CORS
import random

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return 'VAR Mock Backend is running. Use POST /classify_pose for pose classification.'

POSE_LABELS = [
    "Natural Movement",
    "Suspicious Fall",
    "Intentional Hand Movement",
    "Natural Collision",
    "Simulated Contact"
]

def random_importances():
    # Generate random importances for demo
    factors = ["Arm Position", "Hip Direction", "Fall Speed", "Body Angle", "Contact Force"]
    values = [random.randint(10, 100) for _ in factors]
    # Normalize to 100
    total = sum(values)
    values = [int(v * 100 / total) for v in values]
    return dict(zip(factors, values))

@app.route('/classify_pose', methods=['POST'])
def classify_pose():
    data = request.json
    # In a real app, you'd use the keypoints for ML inference
    keypoints = data.get("keypoints", [])
    label = random.choice(POSE_LABELS)
    confidence = random.randint(70, 99)
    importances = random_importances()
    return jsonify({
        "label": label,
        "confidence": confidence,
        "importances": importances
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 