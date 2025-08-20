from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
import torch
from flask import url_for
from diffusers import StableDiffusionPipeline

app = Flask(__name__)
CORS(app)

# Load the Stable Diffusion pipeline once at startup
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
)
if torch.cuda.is_available():
    pipe = pipe.to("cuda")

@app.route('/generate-image', methods=['POST'])
def generate_image():
    data = request.json
    prompt = data.get('prompt', '')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400

    # Generate image
    image = pipe(prompt, num_inference_steps=15, guidance_scale=7.5).images[0]

    # Save image to images folder
    images_dir = os.path.join(app.root_path, 'images')
    os.makedirs(images_dir, exist_ok=True)
    filename = f"generated_{random.randint(100000,999999)}.jpg"
    image_path = os.path.join(images_dir, filename)
    image.save(image_path)

    return jsonify({'image_url': url_for('serve_image', filename=filename, _external=True)})

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(os.path.join(app.root_path, 'images'), filename)

if __name__ == '__main__':
    app.run(debug=True)
