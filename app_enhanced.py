from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
import torch
from flask import url_for
from diffusers import StableDiffusionPipeline
import time
import logging
from datetime import datetime
import glob

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['http://localhost:*', 'http://127.0.0.1:*', 'file://*', 'http://localhost:3000', 'http://127.0.0.1:3000'])

# Get absolute path for images directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, 'images')
os.makedirs(IMAGES_DIR, exist_ok=True)

# Clean up old images on startup (keep last 50 images)
def cleanup_old_images():
    """Clean up old generated images, keeping only the most recent ones"""
    try:
        image_files = glob.glob(os.path.join(IMAGES_DIR, 'generated_*.jpg'))
        image_files.sort(key=os.path.getmtime, reverse=True)
        
        if len(image_files) > 50:
            files_to_delete = image_files[50:]
            for file_path in files_to_delete:
                try:
                    os.remove(file_path)
                    logger.info(f"Cleaned up old image: {os.path.basename(file_path)}")
                except Exception as e:
                    logger.warning(f"Failed to delete {file_path}: {e}")
    except Exception as e:
        logger.error(f"Error during image cleanup: {e}")

# Load the Stable Diffusion pipeline once at startup
print("Loading Stable Diffusion model...")
try:
    pipe = StableDiffusionPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
    )
    if torch.cuda.is_available():
        pipe = pipe.to("cuda")
        print("Using CUDA for faster generation")
    else:
        print("Using CPU - generation will be slower")
    
    # Clean up old images on startup
    cleanup_old_images()
    print("Model loaded successfully and old images cleaned up")
    
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    pipe = None

@app.route('/generate-image', methods=['POST'])
def generate_image():
    if pipe is None:
        return jsonify({'error': 'Model not loaded', 'success': False}), 500
        
    data = request.json
    prompt = data.get('prompt', '').strip()
    if not prompt:
        return jsonify({'error': 'No prompt provided', 'success': False}), 400

    try:
        logger.info(f"Generating image for prompt: {prompt}")
        
        # Generate image with error handling
        with torch.no_grad():
            result = pipe(
                prompt, 
                num_inference_steps=20,  # Increased steps for better quality
                guidance_scale=7.5,
                width=512,
                height=512
            )
            image = result.images[0]

        # Ensure images directory exists
        os.makedirs(IMAGES_DIR, exist_ok=True)
        
        # Generate unique filename with timestamp and random number
        timestamp = int(time.time())
        random_suffix = random.randint(1000, 9999)
        filename = f"generated_{timestamp}_{random_suffix}.jpg"
        image_path = os.path.join(IMAGES_DIR, filename)
        
        # Save image with error handling
        try:
            image.save(image_path, quality=95, optimize=True)
            logger.info(f"Image saved successfully: {filename}")
        except Exception as save_error:
            logger.error(f"Failed to save image {filename}: {save_error}")
            return jsonify({'error': f'Failed to save image: {save_error}', 'success': False}), 500

        # Generate URL without _external=True to avoid absolute URL issues
        image_url = url_for('serve_image', filename=filename)
        
        logger.info(f"Generated image successfully: {filename}")
        
        return jsonify({
            'image_url': image_url,
            'filename': filename,
            'success': True,
            'prompt': prompt,
            'timestamp': timestamp
        })
        
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}", exc_info=True)
        return jsonify({'error': f'Generation failed: {str(e)}', 'success': False}), 500

@app.route('/images/<path:filename>')
def serve_image(filename):
    """Serve images with proper headers and error handling"""
    try:
        # Security check: only allow jpg files from images directory
        if not filename.endswith('.jpg') or '..' in filename or filename.startswith('/'):
            return jsonify({'error': 'Invalid filename'}), 400
            
        # Check if file exists
        image_path = os.path.join(IMAGES_DIR, filename)
        if not os.path.exists(image_path):
            logger.warning(f"Image not found: {filename}")
            return jsonify({'error': 'Image not found'}), 404
        
        # Serve the file with proper caching headers
        response = send_from_directory(IMAGES_DIR, filename)
        
        # Add headers to prevent caching and ensure proper content type
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        response.headers['Content-Type'] = 'image/jpeg'
        response.headers['Access-Control-Allow-Origin'] = '*'
        
        return response
        
    except Exception as e:
        logger.error(f"Error serving image {filename}: {e}")
        return jsonify({'error': 'Failed to serve image'}), 500

@app.route('/list-images')
def list_images():
    """List all generated images"""
    try:
        image_files = glob.glob(os.path.join(IMAGES_DIR, 'generated_*.jpg'))
        images = []
        for file_path in image_files:
            filename = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)
            modified_time = os.path.getmtime(file_path)
            images.append({
                'filename': filename,
                'size': file_size,
                'modified': datetime.fromtimestamp(modified_time).isoformat(),
                'url': url_for('serve_image', filename=filename)
            })
        
        return jsonify({'images': images, 'count': len(images)})
    except Exception as e:
        logger.error(f"Error listing images: {e}")
        return jsonify({'error': 'Failed to list images'}), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    status = {
        'status': 'healthy' if pipe is not None else 'unhealthy',
        'model_loaded': pipe is not None,
        'cuda_available': torch.cuda.is_available(),
        'images_directory': IMAGES_DIR,
        'images_count': len(glob.glob(os.path.join(IMAGES_DIR, '*.jpg')))
    }
    return jsonify(status)

@app.route('/cleanup', methods=['POST'])
def cleanup_images():
    """Clean up old images endpoint"""
    try:
        cleanup_old_images()
        return jsonify({'success': True, 'message': 'Cleanup completed'})
    except Exception as e:
        logger.error(f"Cleanup failed: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Imation AI server...")
    print(f"Images will be stored in: {IMAGES_DIR}")
    print("Server will be available at http://127.0.0.1:5000")
    print("Endpoints:")
    print("  POST /generate-image - Generate image from prompt")
    print("  GET  /images/<filename> - Serve generated image")
    print("  GET  /list-images - List all generated images")
    print("  GET  /health - Health check")
    print("  POST /cleanup - Clean up old images")
    
    app.run(debug=True, host='127.0.0.1', port=5000)
