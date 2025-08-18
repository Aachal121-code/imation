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

// Handle AI form submission (demo only)
document.getElementById('ai-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const prompt = document.getElementById('prompt').value.trim();
    const output = document.getElementById('generated-image');
    if (!prompt) {
        output.innerHTML = '<p style="color:#ffbaba;">Please enter your idea!</p>';
        return;
    }
    // Demo: Show a static image (replace with real AI API call)
    output.innerHTML = `
        <div class="generated-img-box">
            <img src="images/Designer (22).jpeg" alt="Generated image">
            <button class="download-btn" title="Download image">
                <i class="fa-solid fa-download"></i>
            </button>
            <div style="margin-top:12px;font-size:1.1rem;color:#00e6d8;">
                <i class="fa-solid fa-terminal"></i> <b>${prompt}</b>
            </div>
        </div>
    `;
    // Add download logic for generated image
    const btn = output.querySelector('.download-btn');
    const img = output.querySelector('img');
    btn.onclick = e => {
        e.stopPropagation();
        downloadImage(img.src, 'generated-image.jpg');
    };
});
addDownloadButtons();