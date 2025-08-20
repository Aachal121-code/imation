from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
import torch
from flask import url_for
from diffusers import StableDiffusionPipeline
import time

app = Flask(__name__)
CORS(app, origins=['http://localhost:*', 'http://127.0.0.1:*', 'file://*'])

# Load the Stable Diffusion pipeline once at startup
print("Loading Stable Diffusion model...")
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
)
if torch.cuda.is_available():
    pipe = pipe.to("cuda")
    print("Using CUDA for faster generation")
else:
    print("Using CPU - generation will be slower")

@app.route('/generate-image', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400

    try:
        print(f"Generating image for prompt: {prompt}")
        
        # Generate image
        image = pipe(prompt, num_inference_steps=15, guidance_scale=7.5).images[0]

        # Save image to images folder
        images_dir = os.path.join(app.root_path, 'images')
        os.makedirs(images_dir, exist_ok=True)
        
        # Use timestamp to ensure unique filenames
        timestamp = int(time.time())
        filename = f"generated_{timestamp}_{random.randint(1000,9999)}.jpg"
        image_path = os.path.join(images_dir, filename)
        image.save(image_path, quality=95)

        # Generate the full URL
        image_url = url_for('serve_image', filename=filename, _external=True)
        print(f"Generated image: {image_url}")
        
        return jsonify({
            'image_url': image_url,
            'filename': filename,
            'success': True
        })
        
    except Exception as e:
        print(f"Error generating image: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve images with proper headers to prevent caching issues"""
    try:
        images_dir = os.path.join(app.root_path, 'images')
        response = send_from_directory(images_dir, filename)
        
        # Add headers to prevent caching issues
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        
        return response
    except Exception as e:
        return jsonify({'error': 'Image not found'}), 404

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'model_loaded': True})

if __name__ == '__main__':
    print("Starting Imation AI server...")
    print("Server will be available at http://127.0.0.1:5000")
    app.run(debug=True, host='127.0.0.1', port=5000)
