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
    initGSAPAnimations();
    initSkillInteractions();
  });

  // Backup in case load event takes too long
  setTimeout(() => {
    const preloader = document.getElementById('preloader');
    if (preloader && preloader.style.display !== 'none') {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 800);
      initGSAPAnimations();
      initSkillInteractions();
    }
  }, 3000);

  // 2. CUSTOM CURSOR TRACKING WITH SMOOTH EASING
  const cursor = document.getElementById('custom-cursor');
  const follower = document.getElementById('custom-cursor-follower');

  let posX = 0, posY = 0;
  let mouseX = 0, mouseY = 0;

  if (cursor && follower) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    // Follower easing interpolation loop
    gsap.ticker.add(() => {
      posX += (mouseX - posX) * 0.15;
      posY += (mouseY - posY) * 0.15;

      follower.style.left = posX + 'px';
      follower.style.top = posY + 'px';
    });

    // Hover states for links and interactive items
    const hoverables = document.querySelectorAll('a, button, input, textarea, .skill-card, .project-card, .strength-tag');
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

  // 3. SCROLL PROGRESS & FLOATING NAV SHADING
  const header = document.getElementById('header');
  const scrollProgress = document.getElementById('scroll-progress');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    // Shade nav bar
    if (header) {
      if (currentScroll > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    // Scroll progress line
    if (scrollProgress && maxScroll > 0) {
      const percentage = (currentScroll / maxScroll) * 100;
      scrollProgress.style.width = percentage + '%';
    }

    // Active Navigation Highlighting depending on section position
    let currentSectionId = 'hero';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150; // offset for nav bar height
      const sectionHeight = section.offsetHeight;
      if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
        currentSectionId = section.getAttribute('id');
      }
    });

    // 3D character scroll movement is handled by character-3d.js

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  });

  // 4. RUNNER POPUP INTERACTION — now handled by character-3d.js

  // 5. MOBILE NAVIGATION DRAWER
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

    navLinks.forEach(link => {
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

  cards.forEach(card => {
    const cardInner = card.querySelector('.project-inner') || card.querySelector('.hero-image-inner') || card.querySelector('.cert-card');
    const targetElement = cardInner || card;
    if (!targetElement) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
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
      gsap.to(targetElement, {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        boxShadow: card.classList.contains('glass-card') ? `0 8px 32px 0 rgba(0, 0, 0, 0.37)` : `0 8px 32px 0 rgba(0, 0, 0, 0.37)`,
        duration: 0.6,
        ease: 'power3.out',
        overwrite: 'auto'
      });
    });
  });

  // 5.5 HERO IMAGE SCROLL PARALLAX & ZOOM
  window.addEventListener('scroll', () => {
    const heroImg = document.querySelector('.hero-img');
    if (heroImg) {
      const rect = heroImg.parentElement.getBoundingClientRect();
      const yOffset = window.scrollY;
      const elementOffset = heroImg.offsetTop;
      const distance = yOffset - elementOffset;

      if (distance < 800 && distance > -400) {
        gsap.to(heroImg, {
          y: distance * 0.3,
          scale: 1 + (distance * 0.0002),
          duration: 0.1,
          overwrite: 'auto'
        });
      }
    }

    // Certificate images parallax
    document.querySelectorAll('.cert-preview-img').forEach((img, index) => {
      const rect = img.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const speed = 0.5 + (index * 0.1);
        gsap.to(img, {
          y: (window.scrollY - img.offsetTop) * speed * 0.1,
          duration: 0.1,
          overwrite: 'auto'
        });
      }
    });
  });

  // 6. GSAP SCROLLTRIGGER SCROLL-IN TRANSITIONS
  function initGSAPAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Entry animations
    const tlHero = gsap.timeline();
    tlHero.from('.hero-tagline', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' })
      .from('.hero-title', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.4')
      .from('.hero-subtitle', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
      .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
      .from('.hero-buttons', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
      .from('.hero-visual', { scale: 0.5, opacity: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, '-=0.8')
      .from('.hero-badge', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.2 }, '-=0.8');

    if (document.querySelector('.scroll-character')) {
      gsap.from('.scroll-character', {
        y: 120,
        opacity: 0,
        duration: 1.1,
        ease: 'elastic.out(1, 0.6)',
        delay: 0.6
      });
      gsap.to('.scroll-character', {
        y: '+=8',
        repeat: -1,
        yoyo: true,
        duration: 2.4,
        ease: 'sine.inOut',
        delay: 1.8
      });
    }

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

    // Skills Card staggering
    gsap.from('.skills-category', {
      scrollTrigger: {
        trigger: '.skills-grid',
        start: 'top 75%'
      },
      opacity: 0,
      y: 50,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out'
    });

    // Each skills row (the white inner panels) slide in with alternating directions
    const skillRows = gsap.utils.toArray('.skills-row');
    skillRows.forEach((row, i) => {
      gsap.from(row, {
        scrollTrigger: {
          trigger: row,
          start: 'top 90%'
        },
        opacity: 0,
        y: 18,
        x: (i % 2 === 0) ? -30 : 30,
        duration: 0.7,
        delay: i * 0.04,
        ease: 'power2.out'
      });
      // stagger badges inside the row after the row slides in
      gsap.from(row.querySelectorAll('.skill-badge'), {
        scrollTrigger: {
          trigger: row,
          start: 'top 90%'
        },
        opacity: 0,
        y: 10,
        duration: 0.5,
        stagger: 0.06,
        delay: 0.08,
        ease: 'power2.out'
      });
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

    // Skill badges entrance -- staggered, nice for desktop and mobile
    gsap.from('.skill-badge', {
      scrollTrigger: {
        trigger: '.skills-grid',
        start: 'top 80%'
      },
      opacity: 0,
      y: 18,
      scale: 0.98,
      duration: 0.7,
      stagger: 0.06,
      ease: 'back.out(1.2)'
    });
  }
});

// Initialize touch/tap interactions for skill badges
function initSkillInteractions() {
  const badges = document.querySelectorAll('.skill-badge');
  if (!badges || badges.length === 0) return;

  // Add tap effects for touch devices and mouse click press effect
  badges.forEach(b => {
    // make badges keyboard-focusable and accessible
    try {
      b.setAttribute('role', 'button');
      b.setAttribute('aria-label', b.innerText.trim());
      b.tabIndex = 0;
    } catch (e) {
      // ignore if DOM property not writable
    }

    // keyboard activation (Enter / Space)
    b.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        gsap.fromTo(b, { scale: 1 }, { scale: 0.96, duration: 0.06, yoyo: true, repeat: 1, ease: 'power2.out' });
      }
    });

    // pointerdown covers touch and mouse press
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      gsap.to(b, { scale: 0.96, duration: 0.12, ease: 'power2.out' });
    });

    // pointerup and pointerleave restore
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(evt => {
      b.addEventListener(evt, () => {
        gsap.to(b, { scale: 1, duration: 0.18, ease: 'elastic.out(1, 0.6)' });
      });
    });

    // small hover pulse on mouseenter for non-touch
    b.addEventListener('mouseenter', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        gsap.to(b, { y: -6, scale: 1.03, duration: 0.18, ease: 'power1.out' });
      }
    });

    b.addEventListener('mouseleave', () => {
      if (window.matchMedia('(hover: hover)').matches) {
        gsap.to(b, { y: 0, scale: 1, duration: 0.28, ease: 'elastic.out(1, 0.6)' });
      }
    });

    // ensure pointerenter works for touch+mouse hybrid devices
    b.addEventListener('pointerenter', () => {
      if (window.matchMedia('(hover: hover)').matches) return;
      gsap.to(b, { scale: 1.02, duration: 0.12, ease: 'power1.out' });
    });
    b.addEventListener('pointerleave', () => {
      gsap.to(b, { scale: 1, duration: 0.12, ease: 'power1.out' });
    });
  });
}

// CONTACT CONFIGURATION
const CONTACT_CONFIG = {
  email: "mantrisandipan@icloud.com",
  whatsappPhone: "917797711005",
  // TO ENABLE SILENT BACKGROUND WHATSAPP MESSAGES:
  // 1. Add +34 644 66 21 54 (CallMeBot) to your phone contacts.
  // 2. Send "I allow callmebot to send me messages" on WhatsApp.
  // 3. You will receive an API Key. Put it below:
  callmebotApiKey: ""
};

// 7. SECURE FORM SUBMIT HANDLER (Email via FormSubmit & Silent WhatsApp via CallMeBot)
function submitForm() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const message = document.getElementById('message').value.trim();
  const formMsg = document.getElementById('form-status');
  const form = document.getElementById('contact-form');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!name || !email || !phone || !message) return;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `Sending... <i class="fa-solid fa-spinner fa-spin" style="color: #030308;"></i>`;
  }

  const formData = new FormData(form);
  formData.set('_replyto', email);
  formData.set('_subject', `New Portfolio Message from ${name}`);

  fetch(`https://formsubmit.co/ajax/${CONTACT_CONFIG.email}`, {
    method: "POST",
    body: formData
  })
    .then(response => response.json())
    .then(() => {
      const waText = `Hello Sandipan,\n\nNew Portfolio message:\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n📱 *Phone:* ${phone}\n💬 *Message:* ${message}`;
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${CONTACT_CONFIG.whatsappPhone}&text=${encodeURIComponent(waText)}${CONTACT_CONFIG.callmebotApiKey ? `&apikey=${CONTACT_CONFIG.callmebotApiKey}` : ''}`;

      fetch(callmebotUrl, { mode: 'no-cors' })
        .catch(() => {
          window.open(`https://wa.me/${CONTACT_CONFIG.whatsappPhone}?text=${encodeURIComponent(waText)}`, "_blank");
        });

      if (formMsg) {
        formMsg.style.display = 'block';
        formMsg.textContent = `Success! Message sent to email and WhatsApp.`;
        formMsg.className = 'form-status-msg success';
        formMsg.style.opacity = '1';
      }

      if (form) form.reset();
    })
    .catch(err => {
      console.error("AJAX form submission failed: ", err);
      if (formMsg) {
        formMsg.style.display = 'block';
        formMsg.textContent = `Oops! Email delivery failed. Opening WhatsApp chat...`;
        formMsg.className = 'form-status-msg error';
        formMsg.style.opacity = '1';
      }

      const waText = `Hello Sandipan,\n\nNew Portfolio message:\n👤 *Name:* ${name}\n📧 *Email:* ${email}\n📱 *Phone:* ${phone}\n💬 *Message:* ${message}`;
      window.open(`https://wa.me/${CONTACT_CONFIG.whatsappPhone}?text=${encodeURIComponent(waText)}`, "_blank");
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Send Message <i class="fa-solid fa-paper-plane" style="color: #030308;"></i>`;
      }
    });
}
