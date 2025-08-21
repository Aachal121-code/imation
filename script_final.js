// Local storage for recent images
let recentImages = [];

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

// Function to add image to recent storage
function addToRecent(imageUrl, prompt) {
    recentImages.unshift({
        url: imageUrl,
        prompt: prompt,
        timestamp: new Date().toLocaleString()
    });
    
    // Keep only last 12 images
    recentImages = recentImages.slice(0, 12);
    
    // Update recent images display
    updateRecentImagesDisplay();
}

// Function to update recent images display
function updateRecentImagesDisplay() {
    const container = document.getElementById('recent-images');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (recentImages.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No recent images yet. Generate your first image!</p>';
        return;
    }
    
    recentImages.forEach((image, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'position: relative; overflow: hidden; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);';
        div.innerHTML = `
            <img src="${image.url}" alt="${image.prompt}" style="width: 100%; height: 200px; object-fit: cover;">
            <div style="padding: 10px; background: rgba(0,0,0,0.7); color: white; position: absolute; bottom: 0; left: 0; right: 0;">
                <p style="margin: 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${image.prompt}</p>
                <button class="download-btn" title="Download image" onclick="downloadImage('${image.url}', 'generated-${index}.jpg')" style="position: absolute; top: 5px; right: 5px;">
                    <i class="fa-solid fa-download"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Handle AI form submission with permanent image display
document.getElementById('ai-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const prompt = document.getElementById('prompt').value.trim();
    const output = document.getElementById('generated-image');

    if (!prompt) {
        showStatus('Please enter your idea!', '#ffbaba');
        return;
    }

    // Show loading status
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
            // Create permanent image display container
            let container = output.querySelector('.permanent-image-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'permanent-image-container';
                container.style.cssText = 'position: relative; display: inline-block; margin: 20px 0;';
                output.appendChild(container);
            }

            // Create new image element
            const newImg = document.createElement('img');
            newImg.src = data.image_url;
            newImg.alt = prompt;
            newImg.style.cssText = 'max-width: 350px; width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); display: block;';
            
            // Clear previous image and add new one
            container.innerHTML = '';
            container.appendChild(newImg);
            
            // Add download button
            const btn = document.createElement('button');
            btn.className = 'download-btn';
            btn.title = 'Download image';
            btn.innerHTML = '<i class="fa-solid fa-download"></i>';
            btn.style.cssText = 'position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; border: none; padding: 8px; border-radius: 50%; cursor: pointer;';
            btn.onclick = () => downloadImage(data.image_url, 'generated-image.jpg');
            container.appendChild(btn);
            
            // Add to recent images
            addToRecent(data.image_url, prompt);
            
            removeStatus();
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
        status.style.cssText = 'text-align: center; margin: 10px 0; font-weight: bold;';
        document.getElementById('generated-image').appendChild(status);
    }
    status.style.color = color;
    status.textContent = message;
}

function removeStatus() {
    const status = document.getElementById('status-msg');
    if (status) {
        status.remove();
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    addDownloadButtons();
    updateRecentImagesDisplay();
});
