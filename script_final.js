// Download button logic for generated and demo images
function addDownloadButtons() {
    // For demo gallery
    document.querySelectorAll('.gallery div').forEach(div => {
        if (!div.querySelector('.download-btn')) {
            const img = div.querySelector('img');
            const btn = document.createElement('button');
            btn.className = 'download-btn';
            btn.title = 'Download image';
            btn.innerHTML = '<i class="fa-solid fa-download"></i>';
            btn.onclick = e => {
                e.stopPropagation();
                downloadImage(img.src, img.alt || 'demo-image.jpg');
            };
            div.appendChild(btn);
        }
    });
}

function downloadImage(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || url.split('/').pop();
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// Enhanced image loading with error handling
function loadImageWithRetry(imgElement, url, maxRetries = 3) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        function attemptLoad() {
            attempts++;
            imgElement.onload = () => resolve();
            imgElement.onerror = () => {
                if (attempts < maxRetries) {
                    setTimeout(attemptLoad, 1000 * attempts); // Exponential backoff
                } else {
                    reject(new Error('Failed to load image'));
                }
            };
            imgElement.src = url;
        }
        
        attemptLoad();
    });
}

// Handle AI form submission with enhanced error handling
document.getElementById('ai-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const prompt = document.getElementById('prompt').value.trim();
    const output = document.getElementById('generated-image');
    const img = document.getElementById('ai-output-img');

    if (!prompt) {
        showStatus('Please enter your idea!', '#ffbaba');
        return;
    }

    // Hide image while generating
    img.style.display = 'none';
    showStatus('Generating image...', '#00e6d8');

    try {
        const res = await fetch('http://127.0.0.1:5000/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (data.image_url) {
            // Create container for generated image
            let container = output.querySelector('.generated-img-box');
            if (!container) {
                container = document.createElement('div');
                container.className = 'generated-img-box';
                output.appendChild(container);
                container.appendChild(img);
            }

            // Load image with retry mechanism
            try {
                await loadImageWithRetry(img, data.image_url);
                
                // Ensure image stays visible
                img.style.display = 'block';
                img.style.visibility = 'visible';
                img.style.opacity = '1';
                
                // Add download button
                if (!container.querySelector('.download-btn')) {
                    const btn = document.createElement('button');
                    btn.className = 'download-btn';
                    btn.title = 'Download image';
                    btn.innerHTML = '<i class="fa-solid fa-download"></i>';
                    btn.onclick = () => downloadImage(data.image_url, 'generated-image.jpg');
                    container.appendChild(btn);
                }
                
                removeStatus();
            } catch (loadError) {
                showStatus('Failed to load generated image. Please try again.', '#ffbaba');
            }
        } else {
            showStatus('Failed to generate image.', '#ffbaba');
        }
    } catch (err) {
        console.error('Error generating image:', err);
        showStatus('Failed to generate image. Please check your connection.', '#ffbaba');
    }
});

// Helper functions for status messages
function showStatus(message, color) {
    let status = document.getElementById('status-msg');
    if (!status) {
        status = document.createElement('p');
        status.id = 'status-msg';
        document.getElementById('generated-image').appendChild(status);
    }
    status.style.color = color;
    status.textContent = message;
}

function removeStatus() {
    document.getElementById('status-msg')?.remove();
}

// Prevent image from disappearing on error
function preventImageDisappearance() {
    const img = document.getElementById('ai-output-img');
    if (img) {
        img.addEventListener('error', function() {
            console.error('Image failed to load:', this.src);
            this.style.display = 'block'; // Keep it visible even on error
            showStatus('Image failed to load. Please try again.', '#ffbaba');
        });
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    preventImageDisappearance();
    addDownloadButtons();
});
