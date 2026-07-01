// --- MAIN APPLICATION LOGIC & INTERACTIVE UI ELEMENTS ---

document.addEventListener('DOMContentLoaded', () => {
  // 1. REMOVE PRELOADER ONCE FULLY LOADED
  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 800);
    }

    // Trigger GSAP entry animations after preloader fades out
    initAnimationsAndScroll();
  });

  // Backup in case load event takes too long
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader && preloader.style.display !== 'none') {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 800);
      initAnimationsAndScroll();
    }
  }, 3000);

  // 2. CUSTOM CURSOR TRACKING WITH SMOOTH EASING
  const cursor = document.getElementById('custom-cursor');
  const follower = document.getElementById('custom-cursor-follower');

  let posX = 0, posY = 0;
  let mouseX = 0, mouseY = 0;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  if (cursor && follower && !isTouchDevice) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    });

    // Follower easing interpolation loop
    gsap.ticker.add(() => {
      posX += (mouseX - posX) * 0.15;
      posY += (mouseY - posY) * 0.15;

      follower.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-50%, -50%)`;
    });

    // Hover states for links and interactive items
    const hoverables = document.querySelectorAll('a, button, input, textarea, .skill-card, .skill-badge, .project-card, .strength-tag');
    hoverables.forEach(item => {
      item.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
        follower.classList.add('hover');
      });
      item.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        follower.classList.remove('hover');
      });
    });
  }

  // 3. SCROLL TRIGGERS AND NAV HIGHLIGHTING MANAGED BY GSAP SCROLLTRIGGER IN INIT

  // 4. MOBILE NAVIGATION DRAWER
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');

  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('open');
      const icon = mobileBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars-staggered');
        icon.classList.toggle('fa-xmark');
      }
    });

    // Close menu when clicking outside or on a link
    document.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        const icon = mobileBtn.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars-staggered');
          icon.classList.remove('fa-xmark');
        }
      }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        const icon = mobileBtn.querySelector('i');
        if (icon) {
          icon.classList.add('fa-bars-staggered');
          icon.classList.remove('fa-xmark');
        }
      });
    });
  }

  // 5. 3D CARD TILT EFFECT (VANILLA JS TRANSFORM MAPPING)
  const cards = document.querySelectorAll('[data-tilt]');
  const hasHover = window.matchMedia('(hover: hover)').matches;

  if (hasHover) {
    cards.forEach(card => {
      const cardInner = card.querySelector('.project-inner') || card.querySelector('.hero-image-inner') || card.querySelector('.cert-card');
      const targetElement = cardInner || card;
      if (!targetElement) return;

      let rect = null;

      card.addEventListener('mouseenter', () => {
        rect = card.getBoundingClientRect();
      });

      card.addEventListener('mousemove', (e) => {
        if (!rect) rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate tilt degrees (-10 to 10)
        const tiltX = ((x / rect.width) - 0.5) * 20;
        const tiltY = -(((y / rect.height) - 0.5) * 20);

        gsap.to(targetElement, {
          rotateY: tiltX,
          rotateX: tiltY,
          scale: 1.03,
          boxShadow: `0 15px 40px rgba(0, 242, 254, 0.15)`,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });

      card.addEventListener('mouseleave', () => {
        rect = null;
        gsap.to(targetElement, {
          rotateY: 0,
          rotateX: 0,
          scale: 1,
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37)`,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      });
    });
  }

  // 5.5 HERO AND CERTIFICATE PARALLAX HANDLED BY GSAP SCROLLTRIGGER IN INIT

  // 6. GSAP & LENIS INTEGRATED SCROLL & TRANSITIONS
  function initAnimationsAndScroll() {
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      smoothTouch: false
    });

    // Connect Lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Disable lag smoothing to prevent animation jitter during scroll
    gsap.ticker.lagSmoothing(0);

    // Handle smooth scroll anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          lenis.scrollTo(target, {
            offset: this.classList.contains('logo') ? 0 : -80 // custom offset for nav bar
          });
        }
      });
    });

    // Scroll Progress Line
    const scrollProgress = document.getElementById('scroll-progress');
    if (scrollProgress) {
      gsap.to(scrollProgress, {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: true
        },
        width: '100%',
        ease: 'none'
      });
    }

    // Shade header on scroll
    const header = document.getElementById('header');
    if (header) {
      ScrollTrigger.create({
        start: 'top -50',
        onToggle: (self) => {
          header.classList.toggle('scrolled', self.isActive);
        }
      });
    }

    // Active Navigation Highlighting depending on section position
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    sections.forEach(section => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 150px',
        end: 'bottom 150px',
        onToggle: (self) => {
          if (self.isActive) {
            const id = section.getAttribute('id');
            navLinks.forEach(link => {
              link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
          }
        }
      });
    });

    // Hero Entry animations
    const tlHero = gsap.timeline();
    tlHero.from('.hero-tagline', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' })
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
      .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
      .from('.hero-buttons', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
      .from('.hero-visual', { scale: 0.5, opacity: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, '-=0.8');

    // Hero Image Scroll Parallax & Zoom
    const heroImg = document.querySelector('.hero-img');
    if (heroImg) {
      gsap.to(heroImg, {
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        },
        y: 100,
        scale: 1.15,
        ease: 'none'
      });
    }

    // Certificate preview image parallax animations
    document.querySelectorAll('.cert-card').forEach((card, index) => {
      const img = card.querySelector('.cert-preview-img');
      if (img) {
        const speed = 0.5 + (index * 0.15);
        gsap.to(img, {
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
          },
          y: 40 * speed,
          ease: 'none'
        });
      }
    });

    // Section Titles reveal
    document.querySelectorAll('.section-title').forEach(title => {
      gsap.from(title, {
        scrollTrigger: {
          trigger: title,
          start: 'top 85%'
        },
        opacity: 0,
        x: -40,
        duration: 0.8,
        ease: 'power2.out'
      });
    });

    // About card and education timeline
    gsap.from('.about-info', {
      scrollTrigger: {
        trigger: '.about-info',
        start: 'top 80%'
      },
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.from('.edu-timeline-item', {
      scrollTrigger: {
        trigger: '.education-container',
        start: 'top 80%'
      },
      opacity: 0,
      x: 40,
      duration: 0.8,
      ease: 'power2.out'
    });

    // Skills Row staggering for table layout
    gsap.from('.skills-row', {
      scrollTrigger: {
        trigger: '.skills-table-wrapper',
        start: 'top 75%'
      },
      opacity: 0,
      x: -50,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power2.out'
    });

    // Skill badges animation with stagger
    gsap.from('.skill-badge', {
      scrollTrigger: {
        trigger: '.skills-table-wrapper',
        start: 'top 75%'
      },
      opacity: 0,
      scale: 0.5,
      duration: 0.6,
      stagger: 0.05,
      ease: 'back.out(1.5)'
    });

    // Project grid cards staggering
    gsap.from('.project-card', {
      scrollTrigger: {
        trigger: '.projects-grid',
        start: 'top 75%'
      },
      opacity: 0,
      y: 60,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out'
    });

    // Certifications timeline staggering
    gsap.from('.cert-card', {
      scrollTrigger: {
        trigger: '.certifications-container',
        start: 'top 80%'
      },
      opacity: 0,
      scale: 0.95,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out'
    });

    // Certificate image preview animations
    gsap.from('.cert-preview-img-wrap', {
      scrollTrigger: {
        trigger: '.certifications-container',
        start: 'top 80%'
      },
      opacity: 0,
      rotateY: 90,
      duration: 0.8,
      stagger: 0.25,
      ease: 'back.out(1.5)'
    });

    // Strengths tags staggered entry
    gsap.from('.strength-tag', {
      scrollTrigger: {
        trigger: '.strengths-wrap',
        start: 'top 80%'
      },
      opacity: 0,
      scale: 0.7,
      y: 20,
      duration: 0.5,
      stagger: 0.05,
      ease: 'back.out(1.7)'
    });

    // Languages listing reveal
    gsap.from('.lang-item', {
      scrollTrigger: {
        trigger: '.languages-wrap',
        start: 'top 80%'
      },
      opacity: 0,
      x: 30,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out'
    });

    // Contact info and form layout
    gsap.from('.contact-card-info', {
      scrollTrigger: {
        trigger: '.contact-grid',
        start: 'top 80%'
      },
      opacity: 0,
      x: -40,
      duration: 0.8,
      ease: 'power2.out'
    });

    gsap.from('.contact-form-wrap', {
      scrollTrigger: {
        trigger: '.contact-grid',
        start: 'top 80%'
      },
      opacity: 0,
      x: 40,
      duration: 0.8,
      ease: 'power2.out'
    });

    // 8. SCROLL-WALKING CHARACTER CONTROLLER
    const character = document.getElementById('walking-character');
    const innerChar = document.getElementById('walking-character-inner');
    const speechBubble = document.getElementById('character-speech');

    if (character && innerChar) {
      let scrollTimeout = null;

      const speechQuotes = [
        "Hi! I'm Sandipan 👋",
        "Keep scrolling! 🚀",
        "Coding is my superpower! 💻",
        "AI & ML student here! 🧠",
        "Designing experiences... ✨",
        "Let's build something epic! 🛠️",
        "Need a developer? Contact me! 📬"
      ];

      function randomizeSpeech() {
        const idx = Math.floor(Math.random() * speechQuotes.length);
        if (speechBubble) speechBubble.textContent = speechQuotes[idx];
      }

      character.addEventListener('mouseenter', randomizeSpeech);
      character.addEventListener('click', () => {
        randomizeSpeech();
        gsap.fromTo(character, { scale: 1 }, { scale: 1.2, duration: 0.15, yoyo: true, repeat: 1 });
      });

      // Move character across the screen
      gsap.to(character, {
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4
        },
        x: '84vw',
        ease: 'none'
      });

      // Track scroll direction and active walking state
      ScrollTrigger.create({
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          // Flip character direction based on scroll direction
          if (self.direction === 1) {
            innerChar.style.transform = 'scaleX(1)';
          } else if (self.direction === -1) {
            innerChar.style.transform = 'scaleX(-1)';
          }

          character.classList.add('is-walking');

          clearTimeout(scrollTimeout);
          scrollTimeout = setTimeout(() => {
            character.classList.remove('is-walking');
          }, 150);
        }
      });
    }
  }
});

// 7. CONTACT FORM — FORMSUBMIT.CO HANDLER
// ═══════════════════════════════════════════════════════════════════
// Zero setup required. FormSubmit.co routes submissions directly to 
// mantrisandipan@icloud.com.
//
// NOTE: On the VERY FIRST submission, you will receive a confirmation
// email from FormSubmit.co. Click "Activate Form" in that email once,
// and all future submissions will land directly in your inbox!
// ═══════════════════════════════════════════════════════════════════

const FORMSUBMIT_ENDPOINT = 'https://formsubmit.co/ajax/mantrisandipan@icloud.com';

async function submitForm() {
  const form = document.getElementById('contact-form');
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();
  const formMsg = document.getElementById('form-status');
  const btn = document.getElementById('submit-btn');

  if (!name || !email || !subject || !message) return;

  gsap.killTweensOf(formMsg);

  // Silently discard honeypot spam
  const botcheck = document.getElementById('botcheck');
  if (botcheck && botcheck.checked) { form.reset(); return; }

  // ── Local File Protocol (CORS Bypass) ──────────────────────────
  // If index.html is opened directly as a local file (file://),
  // AJAX fetch is blocked by CORS. We bypass this by submitting traditionally.
  if (window.location.protocol === 'file:') {
    formMsg.style.display = 'block';
    formMsg.style.opacity = '1';
    formMsg.textContent = 'Submitting message via secure browser redirect...';
    formMsg.className = 'form-status-msg info';

    form.action = 'https://formsubmit.co/mantrisandipan@icloud.com';
    form.method = 'POST';

    // Add config fields dynamically
    let templateInput = form.querySelector('input[name="_template"]');
    if (!templateInput) {
      templateInput = document.createElement('input');
      templateInput.type = 'hidden';
      templateInput.name = '_template';
      templateInput.value = 'box';
      form.appendChild(templateInput);
    }

    form.submit();
    return;
  }

  // ── Lock UI while sending (For Web Server HTTP/HTTPS) ──────────
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Sending… <i class="fa-solid fa-circle-notch fa-spin" style="color:#030308;margin-left:6px;"></i>';
  form.querySelectorAll('.form-control').forEach(el => el.disabled = true);

  formMsg.style.display = 'block';
  formMsg.style.opacity = '1';
  formMsg.textContent = 'Sending your message…';
  formMsg.className = 'form-status-msg info';

  // ── POST to FormSubmit.co ──────────────────────────────────────
  try {
    const response = await fetch(FORMSUBMIT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        email: email,
        _subject: `Portfolio Contact: ${subject}`,
        message: message,
        _template: 'box' // Beautiful boxed template
      })
    });

    const result = await response.json();

    if (result.success === 'true' || result.success === true) {
      formMsg.textContent = `✅ Message sent, ${name}! I'll get back to you soon.`;
      formMsg.className = 'form-status-msg success';
      form.reset();
    } else {
      // Check if it's the activation email requirement
      if (result.message && (result.message.toLowerCase().includes('activate') || result.message.toLowerCase().includes('confirm') || result.message.toLowerCase().includes('first'))) {
        formMsg.textContent = `📩 Check your mail: FormSubmit sent an activation email to mantrisandipan@icloud.com. Please click the link inside it to activate your form!`;
        formMsg.className = 'form-status-msg info';
        form.reset();
      } else {
        throw new Error(result.message || 'Something went wrong.');
      }
    }

  } catch (err) {
    console.error('Send error:', err);
    formMsg.textContent = `❌ Failed to send: ${err.message || 'Please check your connection and try again.'}`;
    formMsg.className = 'form-status-msg error';
  }

  // ── Restore UI ─────────────────────────────────────────────────
  btn.disabled = false;
  btn.innerHTML = originalHTML;
  form.querySelectorAll('.form-control').forEach(el => el.disabled = false);

  // Auto-fade banner after 10 s
  setTimeout(() => {
    gsap.to(formMsg, {
      opacity: 0, duration: 1,
      onComplete: () => {
        formMsg.style.display = 'none';
        formMsg.style.opacity = '1';
      }
    });
  }, 10000);
}
