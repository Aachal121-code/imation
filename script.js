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

// Handle AI form submission
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

        const data = await res.json();
        if (data.image_url) {
            img.src = data.image_url;
            img.style.display = 'block';
            removeStatus();
        } else {
            showStatus('Failed to generate image.', '#ffbaba');
        }
    } catch (err) {
        showStatus('Failed to generate image.', '#ffbaba');
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

addDownloadButtons();
