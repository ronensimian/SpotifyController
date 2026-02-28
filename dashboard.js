document.addEventListener('DOMContentLoaded', function () {
    // 1. Version Display
    var versionElem = document.getElementById('extVersion');
    if (versionElem && chrome && chrome.runtime && chrome.runtime.getManifest) {
        var manifest = chrome.runtime.getManifest();
        versionElem.textContent = 'v' + manifest.version;
    }

    // 2. Image Modal (Lightbox) Logic
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.close-modal');
    const images = document.querySelectorAll('.image-wrapper img');

    if (modal && modalImg && closeBtn) {
        images.forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', function () {
                modal.style.display = 'flex';
                // Trigger reflow so the transition works
                setTimeout(() => modal.classList.add('show'), 10);
                modalImg.src = this.src;
            });
        });

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target === modalImg) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
        });
    }

    // 3. Chrome Internal Links Logic
    const chromeLinks = document.querySelectorAll('.chrome-link');
    chromeLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            if (chrome && chrome.tabs && chrome.tabs.create) {
                chrome.tabs.create({ url: url });
            } else {
                window.open(url, '_blank');
            }
        });
    });
});