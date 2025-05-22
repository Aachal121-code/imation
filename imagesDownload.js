document.addEventListener('DOMContentLoaded', () => {
    const downloadIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="20px" height="20px">
            <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.67v6h4v-6h3.67L12 2z"/>
        </svg>
    `;

    function createDownloadButton(img) {
        const btn = document.createElement('button');
        btn.classList.add('download-btn');
        btn.innerHTML = downloadIconSVG;
        btn.title = 'Download Image';

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const imageUrl = img.src;
            const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
            fetch(imageUrl)
                .then(response => response.blob())
                .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                })
                .catch(() => alert('Failed to download image.'));
        });

        return btn;
    }

    function wrapImageWithContainer(img) {
        if (!img.parentElement.classList.contains('img-container')) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('img-container');
            img.parentElement.insertBefore(wrapper, img);
            wrapper.appendChild(img);
            return wrapper;
        }
        return img.parentElement;
    }

    function addDownloadButtonsToImages(selector) {
        const images = document.querySelectorAll(selector);
        images.forEach(img => {
            const container = wrapImageWithContainer(img);
            if (!container.querySelector('.download-btn')) {
                const downloadBtn = createDownloadButton(img);
                container.appendChild(downloadBtn);
                container.style.position = 'relative';
            }
        });
    }

    addDownloadButtonsToImages('.album img');
});
