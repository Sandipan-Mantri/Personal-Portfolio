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

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSectionId}`) {
        link.classList.add('active');
      }
    });
  });

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
  }
});

// 7. CONTACT FORM — MAILTO HANDLER
// Zero setup required. When user clicks Send, their email app opens pre-filled.
// They click Send in their email app and the message goes straight to your inbox.
function submitForm() {
  const form     = document.getElementById('contact-form');
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const subject  = document.getElementById('subject').value.trim();
  const message  = document.getElementById('message').value.trim();
  const formMsg  = document.getElementById('form-status');

  if (!name || !email || !subject || !message) return;

  // Kill any running GSAP animations on formMsg to avoid conflict
  gsap.killTweensOf(formMsg);

  // Build the full email body including sender details
  const fullBody =
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `\n` +
    `Message:\n${message}`;

  // Encode for mailto URL
  const mailtoLink =
    `mailto:mantrisandipan@icloud.com` +
    `?subject=${encodeURIComponent('Portfolio Contact: ' + subject)}` +
    `&body=${encodeURIComponent(fullBody)}`;

  // Open the user's default email app with everything pre-filled
  window.location.href = mailtoLink;

  // Show a helpful success message
  if (formMsg) {
    formMsg.style.display  = 'block';
    formMsg.style.opacity  = '1';
    formMsg.textContent    = `Almost done, ${name}! Your email app has opened with everything pre-filled — just click Send to deliver your message.`;
    formMsg.className      = 'form-status-msg success';
  }

  // Reset the form fields
  form.reset();

  // Fade out the status banner after 8 seconds
  setTimeout(() => {
    gsap.to(formMsg, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        formMsg.style.display  = 'none';
        formMsg.style.opacity  = '1';
      }
    });
  }, 8000);
}
