(function () {
    'use strict';

  
    window.addEventListener('load', () => {
        setTimeout(() => {
            const preloader = document.querySelector('.preloader');
            if (preloader) preloader.classList.add('hidden');
        }, 800);
    });


 
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    document.body.appendChild(cursorDot);

    const cursorRing = document.createElement('div');
    cursorRing.className = 'cursor-ring';
    document.body.appendChild(cursorRing);

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = '<i class="fas fa-check-circle"></i> Message sent successfully!';
    document.body.appendChild(toast);


   
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    const isTouch = window.matchMedia('(max-width: 900px)').matches;

    if (!isTouch) {
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        function animateRing() {
            ringX += (mouseX - ringX) * 0.18;
            ringY += (mouseY - ringY) * 0.18;
            cursorRing.style.left = ringX + 'px';
            cursorRing.style.top = ringY + 'px';
            requestAnimationFrame(animateRing);
        }
        animateRing();

      
        const hoverTargets = document.querySelectorAll(
            'a, button, .skill-tag, .project-card, .contact-item, .btn'
        );
        hoverTargets.forEach((el) => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('hover'));
        });
    }


   
    const navbar = document.querySelector('nav');
    function handleNavScroll() {
        if (window.scrollY > 30) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();



    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = percent + '%';
    }, { passive: true });


 
    const revealElements = document.querySelectorAll('.fade-up');
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealElements.forEach((el) => revealObserver.observe(el));



    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();
            const navHeight = navbar.offsetHeight;
            const targetPosition =
                target.getBoundingClientRect().top + window.pageYOffset - navHeight - 10;

            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            history.pushState(null, '', targetId);
        });
    });

    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    function highlightNav() {
        const scrollPos = window.scrollY + navbar.offsetHeight + 80;
        sections.forEach((section) => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            if (scrollPos >= top && scrollPos < bottom) {
                navLinks.forEach((link) => {
                    link.classList.toggle(
                        'active',
                        link.getAttribute('href') === '#' + id
                    );
                });
            }
        });
    }
    window.addEventListener('scroll', highlightNav, { passive: true });
    highlightNav();


 
    document.querySelectorAll('.btn').forEach((btn) => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
            ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
        });
    });



    const heroName = document.querySelector('.hero-text h1 span');
    if (heroName) {
        const originalText = heroName.textContent;
        heroName.textContent = '';
        const cursor = document.createElement('span');
        cursor.className = 'type-cursor';

        let i = 0;
        function typeLetter() {
            if (i < originalText.length) {
                heroName.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeLetter, 80);
            } else {
                heroName.appendChild(cursor);
            }
        }
        setTimeout(typeLetter, 1000);
    }


 
    if (!isTouch) {
        document.querySelectorAll('.project-card').forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -6;
                const rotateY = ((x - centerX) / centerX) * 6;

                card.style.transform =
                    `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
            });
        });
    }


  
    const backToTopBtn = document.getElementById('backToTop');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        window.addEventListener('scroll', () => {
            backToTopBtn.style.opacity = window.scrollY > 500 ? '1' : '0.5';
        }, { passive: true });
    }


  
    const form = document.querySelector('.contact-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const btn = form.querySelector('.btn-primary');
            const originalBtnHTML = btn.innerHTML;

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            btn.disabled = true;

            try {
                const formData = new FormData(form);
                const payload = Object.fromEntries(formData);

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (result.success) {
                    form.reset();
                    toast.innerHTML = '<i class="fas fa-check-circle"></i> Message sent! I\'ll get back to you soon.';
                    toast.classList.add('show');
                } else {
                    toast.innerHTML = '<i class="fas fa-times-circle"></i> Something went wrong. Please email me directly.';
                    toast.classList.add('show');
                }
            } catch (error) {
                toast.innerHTML = '<i class="fas fa-times-circle"></i> Network error. Please try again.';
                toast.classList.add('show');
            } finally {
                btn.innerHTML = originalBtnHTML;
                btn.disabled = false;
                setTimeout(() => toast.classList.remove('show'), 4000);
            }
        });
    }


   
    const hero = document.querySelector('.hero');
    if (hero && !isTouch) {
        for (let i = 0; i < 18; i++) {
            const p = document.createElement('span');
            const size = Math.random() * 5 + 2;
            p.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: rgba(37, 99, 235, ${Math.random() * 0.35 + 0.1});
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                pointer-events: none;
                z-index: 1;
                animation: floatParticle ${6 + Math.random() * 8}s ease-in-out infinite;
                animation-delay: -${Math.random() * 6}s;
            `;
            hero.appendChild(p);
        }

        
        if (!document.getElementById('particleKeyframe')) {
            const style = document.createElement('style');
            style.id = 'particleKeyframe';
            style.textContent = `
                @keyframes floatParticle {
                    0%, 100% { transform: translate(0, 0); opacity: 0.4; }
                    50%      { transform: translate(${Math.random() > 0.5 ? '' : '-'}30px, -40px); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

})();