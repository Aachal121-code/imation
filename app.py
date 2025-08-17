from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random

app = Flask(__name__)
CORS(app)

@app.route('/generate-image', methods=['POST'])
def generate_image():
    images_dir = os.path.join(app.root_path, 'images')
    images = [f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    if not images:
        return jsonify({'error': 'No images found'}), 404
    image_file = random.choice(images)
    return jsonify({'image_url': f'/images/{image_file}'})

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(os.path.join(app.root_path, 'images'), filename)

if __name__ == '__main__':
    app.run(debug=True)