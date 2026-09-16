// Custom JavaScript for interactive features

// Example 1: Smooth scroll to anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Example 2: Reading progress bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    
    let progressBar = document.getElementById('reading-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.id = 'reading-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, #0ea5e9, #8b5cf6);
            z-index: 9999;
            transition: width 0.3s ease;
        `;
        document.body.prepend(progressBar);
    }
    progressBar.style.width = scrolled + '%';
});

// Example 3: Copy code button enhancement
document.querySelectorAll('.highlight').forEach(block => {
    const button = block.querySelector('.copy-code');
    if (button) {
        button.addEventListener('click', () => {
            // Add success animation
            button.textContent = '✓ Copied!';
            setTimeout(() => {
                button.textContent = 'Copy';
            }, 2000);
        });
    }
});

// Example 4: Table of contents highlight on scroll
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const id = entry.target.getAttribute('id');
        const tocLink = document.querySelector(`.toc a[href="#${id}"]`);
        
        if (tocLink) {
            if (entry.isIntersecting) {
                document.querySelectorAll('.toc a').forEach(link => {
                    link.classList.remove('active');
                });
                tocLink.classList.add('active');
            }
        }
    });
}, { rootMargin: '-20% 0px -80% 0px' });

document.querySelectorAll('h2[id], h3[id]').forEach(heading => {
    observer.observe(heading);
});

// Example 5: Dark mode toggle enhancement
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        document.body.classList.add('theme-transitioning');
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
    });
}

// Example 6: External link icons
document.querySelectorAll('.post-content a[href^="http"]').forEach(link => {
    if (!link.hostname.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.innerHTML += ' <span style="font-size: 0.8em;">↗</span>';
    }
});

// Example 7: Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

console.log('Custom JS loaded successfully! 🚀');
