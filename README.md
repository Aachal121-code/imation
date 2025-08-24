# Imation AI Image Generator

## Overview
Imation AI is a web application that allows users to generate unique images from their ideas using artificial intelligence. Simply enter a prompt, and the AI will create an image for you!

## Key Features
- **Image Generation**: Generate images based on text prompts using the Stable Diffusion model.
- **Recent Images**: View and download your recently generated images.
- **Demo Images**: Explore demo images to see the capabilities of the AI.
- **Download Functionality**: Easily download generated images to your device.
- **Health Check**: Verify if the server and model are running correctly.
- **Image Cleanup**: Automatically cleans up old images to maintain storage efficiency.

## File Structure
- `index_final.html`: Main HTML file for the application.
- `signin.html`: Sign-in page for user authentication.
- `script_final.js`: JavaScript file handling frontend logic.
- `style.css`: CSS file for styling the application.
- `app_enhanced.py`: Backend logic using Flask.

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the Flask server:
   ```bash
   python app_enhanced.py
   ```

4. Open your browser and navigate to `http://127.0.0.1:5000` to access the application.

## Usage
- Enter a description in the input field and click "Generate" to create an image.
- View recently generated images and download them as needed.
- Explore demo images to see examples of generated content.

## License
All images are AI generated. No copyright. Free for any use.

## Acknowledgments
- This project uses the Stable Diffusion model for image generation.
