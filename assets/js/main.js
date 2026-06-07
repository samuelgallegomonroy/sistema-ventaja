const doc = document;
const win = window;
const prefersReducedMotion = win.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SITE_CONFIG = {
  mercadoPagoUrl: 'https://mpago.la/2gqKFbG',
  /** Formspree: crea un formulario en https://formspree.io y pega la URL aquí */
  formspreeEndpoint: 'https://formspree.io/f/xeewagky',
  totalValue: 72000,
  launchPrice: 19990,
  spotsTotal: 100,
  /**
   * CUPOS OCUPADOS (automático según la hora del visitante)
   * ─────────────────────────────────────────────────────
   * scarcityLaunchDate → cuándo empieza en 0 (usa hora Chile: 16:00 = 4 p.m.)
   * Hora 1: sube de 0 → 30 gradualmente
   * Después: cada 15 min suma 2 o 3 (alternado), tope 95
   *
   * Para cambiar la fecha de lanzamiento, edita solo esta línea y vuelve a subir a GitHub.
   */
  scarcityLaunchDate: '2026-06-07T16:00:00',
  scarcityFirstHourTarget: 30,
  scarcityIntervalMinutes: 15,
  scarcityIncrementMin: 2,
  scarcityIncrementMax: 3,
  scarcityMaxOccupied: 95,
  redirectDelayMs: 1800,
};

function formatCLP(amount) {
  return `$${amount.toLocaleString('es-CL')}`;
}

function setupPricingSavings() {
  const savingsEl = doc.getElementById('savingsLabel');
  const totalEl = doc.getElementById('totalValue');
  if (!savingsEl) return;

  const total = SITE_CONFIG.totalValue || 72000;
  const price = SITE_CONFIG.launchPrice || 19990;
  const savings = Math.max(0, total - price);

  if (totalEl) totalEl.textContent = formatCLP(total);
  savingsEl.innerHTML = `Ahorras <strong>${formatCLP(savings)}</strong> hoy`;
}

function getMercadoPagoUrl() {
  return SITE_CONFIG.mercadoPagoUrl || 'https://mpago.la/2gqKFbG';
}

async function submitLead(payload) {
  const endpoint = (SITE_CONFIG.formspreeEndpoint || '').trim();
  if (!endpoint) return true;

  try {
    const controller = new AbortController();
    const timeout = win.setTimeout(() => controller.abort(), 4000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        age: payload.age,
        submittedAt: payload.submittedAt,
        _subject: `Nuevo lead Sistema Ventaja — ${payload.name}`,
      }),
      signal: controller.signal,
    });
    win.clearTimeout(timeout);
    return response.ok;
  } catch (_) {
    return false;
  }
}

function redirectToMercadoPago() {
  win.location.assign(getMercadoPagoUrl());
}

function setupCursor() {
  if (prefersReducedMotion || 'ontouchstart' in win) return;
  const cursor = doc.getElementById('cursor');
  if (!cursor) return;

  let raf = 0;
  const pos = { x: 0, y: 0 };

  function render() {
    cursor.style.transform = `translate3d(${pos.x - 6}px, ${pos.y - 6}px, 0)`;
    raf = 0;
  }

  doc.addEventListener('mousemove', (e) => {
    cursor.style.opacity = '1';
    pos.x = e.clientX;
    pos.y = e.clientY;
    if (!raf) raf = requestAnimationFrame(render);
  }, { passive: true });
}

function setupHeroVideo() {
  const video = doc.getElementById('heroVideo');
  const media = doc.getElementById('heroMedia');
  if (!video || !media) return;

  if (prefersReducedMotion) {
    media.classList.add('hero-video-paused');
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.playsInline = true;
  video.autoplay = true;

  const markReady = () => {
    media.classList.add('hero-video-ready');
    media.classList.remove('hero-video-paused');
  };

  const markPaused = () => {
    media.classList.add('hero-video-paused');
    media.classList.remove('hero-video-ready');
  };

  const tryPlay = () => {
    const start = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => markReady()).catch(markPaused);
      } else {
        markReady();
      }
    };

    if (video.readyState >= 2) {
      start();
      return;
    }

    video.addEventListener('canplay', start, { once: true });
    video.load();
  };

  video.addEventListener('loadeddata', markReady);
  video.addEventListener('canplay', tryPlay);
  video.addEventListener('playing', markReady);
  video.addEventListener('error', markPaused);

  tryPlay();

  doc.addEventListener('touchstart', tryPlay, { once: true, passive: true });
  doc.addEventListener('click', tryPlay, { once: true, passive: true });

  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'visible') tryPlay();
  });

  win.addEventListener('pageshow', (event) => {
    if (event.persisted) tryPlay();
  });

  const hero = doc.getElementById('hero');
  if (hero && 'IntersectionObserver' in win) {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) tryPlay();
      else video.pause();
    }, { threshold: 0.12 });
    io.observe(hero);
  }
}

function createLines(containerId, className, count, widthMin, widthMax, durMin, durMax) {
  const container = doc.getElementById(containerId);
  if (!container || prefersReducedMotion) return;

  for (let i = 0; i < count; i += 1) {
    const line = doc.createElement('div');
    line.className = className;
    line.style.top = `${8 + Math.random() * 84}%`;
    line.style.width = `${widthMin + Math.random() * (widthMax - widthMin)}px`;
    line.style.animationDuration = `${durMin + Math.random() * (durMax - durMin)}s`;
    line.style.animationDelay = `${Math.random() * 4}s`;
    line.style.opacity = `${0.3 + Math.random() * 0.6}`;
    container.appendChild(line);
  }
}

function setupReveal() {
  const revealEls = doc.querySelectorAll(
    '.reveal, .check-item, .step-item, .benefit-card, .feature-card, .result-card, .pricing-item, .program-step, .testimonial-card',
  );
  if (!revealEls.length) return;

  const show = (el, delay = 0) => {
    win.setTimeout(() => el.classList.add('visible'), delay);
  };

  const showAll = () => revealEls.forEach((el) => el.classList.add('visible'));

  if (!('IntersectionObserver' in win)) {
    showAll();
    return;
  }

  const isMobile = win.matchMedia('(max-width: 767px)').matches;
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const className = el.classList[0];
      const siblings = [...el.parentElement.children].filter((node) => node.classList.contains(className));
      const index = Math.max(0, siblings.indexOf(el));
      show(el, index * (isMobile ? 40 : 70));
      obs.unobserve(el);
    });
  }, {
    threshold: isMobile ? 0.06 : 0.14,
    rootMargin: isMobile ? '0px 0px 8% 0px' : '0px 0px -40px 0px',
  });

  revealEls.forEach((el) => observer.observe(el));

  // Safety: never leave content hidden if observer misses (common on mobile)
  win.setTimeout(showAll, isMobile ? 1200 : 2500);
}

function setupStickyCta() {
  const sticky = doc.getElementById('stickyCta');
  const hero = doc.getElementById('hero');
  if (!sticky || !hero) return;

  const io = new IntersectionObserver((entries) => {
    sticky.classList.toggle('show', !entries[0].isIntersecting);
    sticky.setAttribute('aria-hidden', entries[0].isIntersecting ? 'true' : 'false');
  }, { threshold: 0.05 });

  io.observe(hero);
}

function setupFaq() {
  const list = doc.getElementById('faqList');
  if (!list) return;

  list.addEventListener('click', (event) => {
    const button = event.target.closest('.faq-q');
    if (!button) return;

    const item = button.closest('.faq-item');
    const answer = item.querySelector('.faq-a');
    const wasOpen = item.classList.contains('open');

    list.querySelectorAll('.faq-item').forEach((node) => {
      node.classList.remove('open');
      const panel = node.querySelector('.faq-a');
      if (panel) panel.style.maxHeight = '0px';
    });

    if (!wasOpen && answer) {
      item.classList.add('open');
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    }
  });
}

function setupFounderVideo() {
  const frame = doc.getElementById('founderVideo');
  const video = frame?.querySelector('video');
  if (!frame || !video) return;

  const enableSound = (el) => {
    el.defaultMuted = false;
    el.muted = false;
    el.volume = 1;
    el.removeAttribute('muted');
  };

  const stop = () => {
    video.pause();
    frame.classList.remove('is-playing');
    frame.setAttribute('aria-label', frame.dataset.playLabel || 'Reproducir video del fundador');
  };

  frame.dataset.playLabel = frame.getAttribute('aria-label') || 'Reproducir video del fundador';

  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.preload = 'none';
  video.controls = false;
  enableSound(video);
  video.pause();

  let loadTimer = 0;

  const playWithSound = () => {
    const start = () => {
      if (loadTimer) win.clearTimeout(loadTimer);
      frame.classList.remove('is-loading');
      if (video.ended) video.currentTime = 0;
      enableSound(video);
      frame.classList.add('is-playing');
      frame.setAttribute('aria-label', 'Pausar video del fundador');
      video.play()
        .then(() => enableSound(video))
        .catch(() => stop());
    };

    frame.classList.add('is-loading');
    if (video.readyState >= 2) {
      start();
      return;
    }

    const onReady = () => {
      video.removeEventListener('error', onFail);
      start();
    };
    const onFail = () => {
      if (loadTimer) win.clearTimeout(loadTimer);
      video.removeEventListener('canplay', onReady);
      frame.classList.remove('is-loading');
      frame.classList.add('founder-video--missing');
    };

    video.addEventListener('canplay', onReady, { once: true });
    video.addEventListener('error', onFail, { once: true });
    loadTimer = win.setTimeout(() => {
      if (frame.classList.contains('is-loading') && video.readyState >= 1) start();
    }, 12000);
    video.load();
  };

  const toggle = (event) => {
    if (event) event.preventDefault();
    if (frame.classList.contains('is-loading')) return;
    if (!video.paused && !video.ended) {
      stop();
      return;
    }
    playWithSound();
  };

  frame.addEventListener('click', toggle);
  frame.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle(event);
    }
  });

  video.addEventListener('playing', () => {
    if (frame.classList.contains('is-playing')) enableSound(video);
  });
  video.addEventListener('ended', stop);
  video.addEventListener('error', () => frame.classList.add('founder-video--missing'));
  if (video.error) frame.classList.add('founder-video--missing');
}

function setupProgramPreview() {
  const figure = doc.getElementById('programPreview');
  const img = figure?.querySelector('.program-preview-img');
  if (!figure || !img) return;

  const markMissing = () => figure.classList.add('program-preview--missing');
  img.addEventListener('error', markMissing);
  if (img.complete && !img.naturalWidth) markMissing();
}

function setupPricingStrikes() {
  const offer = doc.getElementById('offer');
  if (!offer) return;

  const run = () => {
    offer.querySelectorAll('.price-strike').forEach((el) => el.classList.add('struck'));
  };

  if (!('IntersectionObserver' in win)) {
    run();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    run();
    observer.disconnect();
  }, { threshold: 0.18 });

  observer.observe(offer);
}

function getOccupiedCount() {
  const launch = new Date(SITE_CONFIG.scarcityLaunchDate || Date.now()).getTime();
  const max = SITE_CONFIG.scarcityMaxOccupied || 95;
  const elapsed = Math.max(0, Date.now() - launch);
  const firstHourMs = 60 * 60 * 1000;
  const firstHourTarget = SITE_CONFIG.scarcityFirstHourTarget || 30;
  const intervalMs = (SITE_CONFIG.scarcityIntervalMinutes || 15) * 60 * 1000;
  const incMin = SITE_CONFIG.scarcityIncrementMin || 2;
  const incMax = SITE_CONFIG.scarcityIncrementMax || 3;

  if (elapsed < firstHourMs) {
    return Math.min(
      firstHourTarget,
      Math.floor((elapsed / firstHourMs) * firstHourTarget),
    );
  }

  let occupied = firstHourTarget;
  const intervals = Math.floor((elapsed - firstHourMs) / intervalMs);

  for (let i = 0; i < intervals; i += 1) {
    occupied += i % 2 === 0 ? incMin : incMax;
    if (occupied >= max) return max;
  }

  return Math.min(max, occupied);
}

function setupDynamicScarcity() {
  const fill = doc.getElementById('scarcityProgress');
  const takenLabel = doc.getElementById('spotsTakenLabel');
  const spotsLeftBonus = doc.getElementById('spotsLeftBonus');
  const finalSpots = doc.getElementById('spotsLeftFinal');
  if (!fill) return;

  const total = SITE_CONFIG.spotsTotal || 100;

  const update = () => {
    const taken = getOccupiedCount();
    const available = Math.max(0, total - taken);
    const pct = Math.round((taken / total) * 100);

    fill.style.width = `${pct}%`;
    fill.classList.add('animate');
    if (takenLabel) takenLabel.textContent = `${taken} de ${total} ocupados`;
    if (spotsLeftBonus) spotsLeftBonus.textContent = String(available);
    if (finalSpots) finalSpots.textContent = String(available);
  };

  const animateOnView = () => {
    update();
    win.setInterval(update, 60000);
  };

  if (!('IntersectionObserver' in win)) {
    animateOnView();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    animateOnView();
    observer.disconnect();
  }, { threshold: 0.2 });

  observer.observe(fill);
}

function setupShirtImage() {
  const stage = doc.getElementById('shirtStage');
  if (!stage) return;

  const markMissing = () => stage.classList.add('shirt-missing');
  stage.querySelectorAll('.shirt-face-img').forEach((img) => {
    img.addEventListener('error', markMissing);
    if (img.complete && !img.naturalWidth) markMissing();
  });
}

function setupTestimonialVideos() {
  const frames = doc.querySelectorAll('.testimonial-video');
  if (!frames.length) return;

  const enableSound = (video) => {
    video.defaultMuted = false;
    video.muted = false;
    video.volume = 1;
    video.removeAttribute('muted');
  };

  const stopFrame = (frame) => {
    const video = frame.querySelector('video');
    if (!video) return;
    video.pause();
    frame.classList.remove('is-playing');
    frame.setAttribute('aria-label', frame.dataset.playLabel || 'Reproducir testimonio');
  };

  const stopOthers = (activeFrame) => {
    frames.forEach((frame) => {
      if (frame !== activeFrame) stopFrame(frame);
    });
  };

  frames.forEach((frame) => {
    const video = frame.querySelector('video');
    if (!video) return;

    frame.dataset.playLabel = frame.getAttribute('aria-label') || 'Reproducir testimonio';

    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'none';
    video.controls = false;
    enableSound(video);
    video.pause();

    const onError = () => {
      frame.classList.remove('is-loading');
      frame.classList.add('testimonial-video--placeholder');
    };
    video.addEventListener('error', onError);
    if (video.error) onError();

    const playWithSound = () => {
      const start = () => {
        frame.classList.remove('is-loading');
        stopOthers(frame);
        if (video.ended) video.currentTime = 0;
        enableSound(video);
        frame.classList.add('is-playing');
        frame.setAttribute('aria-label', 'Pausar testimonio');
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise
            .then(() => enableSound(video))
            .catch(() => stopFrame(frame));
        }
      };

      frame.classList.add('is-loading');
      if (video.readyState >= 2) {
        start();
        return;
      }

      const onReady = () => {
        video.removeEventListener('error', onFail);
        start();
      };
      const onFail = () => {
        video.removeEventListener('canplay', onReady);
        frame.classList.remove('is-loading');
        frame.classList.add('testimonial-video--placeholder');
      };

      video.addEventListener('canplay', onReady, { once: true });
      video.addEventListener('error', onFail, { once: true });
      video.load();
    };

    const toggle = (event) => {
      if (frame.classList.contains('testimonial-video--placeholder')) return;
      if (event) event.preventDefault();
      if (frame.classList.contains('is-loading')) return;

      if (!video.paused && !video.ended) {
        stopFrame(frame);
        return;
      }

      playWithSound();
    };

    frame.addEventListener('click', toggle);
    frame.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle(event);
      }
    });

    video.addEventListener('playing', () => {
      if (frame.classList.contains('is-playing')) enableSound(video);
    });
    video.addEventListener('ended', () => stopFrame(frame));
  });
}

function setupParallax() {
  if (prefersReducedMotion || win.matchMedia('(max-width: 767px)').matches) return;
  const heroContent = doc.querySelector('.hero-content');
  if (!heroContent) return;

  win.addEventListener('scroll', () => {
    const y = win.scrollY;
    if (y < win.innerHeight) {
      heroContent.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
    }
  }, { passive: true });
}

function setupPricingReveal() {
  const block = doc.getElementById('pricingReveal');
  if (!block) return;

  const reveal = () => block.classList.add('visible');

  if (!('IntersectionObserver' in win)) {
    reveal();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    reveal();
    observer.disconnect();
  }, { threshold: 0.35 });

  observer.observe(block);
}

function setupCheckoutModal() {
  const modal = doc.getElementById('checkoutModal');
  const form = doc.getElementById('checkoutForm');
  const formView = doc.getElementById('modalFormView');
  const successView = doc.getElementById('modalSuccessView');
  if (!modal || !form || !formView || !successView) return;

  let lastFocus = null;

  const openModal = () => {
    lastFocus = doc.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    doc.body.classList.add('modal-open');
    formView.hidden = false;
    successView.hidden = true;
    form.reset();
    const firstInput = form.querySelector('input, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 120);
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    doc.body.classList.remove('modal-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  doc.querySelectorAll('.cta-trigger').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });
  });

  modal.querySelectorAll('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  doc.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      age: String(data.get('age') || '').trim(),
      submittedAt: new Date().toISOString(),
    };

    if (!payload.name || !payload.email || !payload.age) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
    }

    try {
      localStorage.setItem('sv_checkout_lead', JSON.stringify(payload));
    } catch (_) {
      /* ignore storage errors */
    }

    const mpagoUrl = getMercadoPagoUrl();
    const fallback = doc.getElementById('mpagoFallback');
    if (fallback) fallback.href = mpagoUrl;

    formView.hidden = true;
    successView.hidden = false;

    submitLead(payload);

    win.setTimeout(redirectToMercadoPago, SITE_CONFIG.redirectDelayMs || 1800);
  });
}

function boot() {
  const steps = [
    ['pricing', setupPricingSavings],
    ['cursor', setupCursor],
    ['hero', setupHeroVideo],
    ['program', setupProgramPreview],
    ['lines', () => {
      createLines('speedLines', 'speed-line', 10, 70, 260, 1.6, 3.8);
      createLines('finalLines', 'final-line', 8, 120, 320, 2, 4.5);
    }],
    ['reveal', setupReveal],
    ['sticky', setupStickyCta],
    ['faq', setupFaq],
    ['founder', setupFounderVideo],
    ['pricing-strikes', setupPricingStrikes],
    ['pricing-reveal', setupPricingReveal],
    ['scarcity', setupDynamicScarcity],
    ['testimonials', setupTestimonialVideos],
    ['shirt', setupShirtImage],
    ['parallax', setupParallax],
    ['checkout', setupCheckoutModal],
  ];

  steps.forEach(([name, fn]) => {
    try {
      fn();
    } catch (error) {
      console.error(`[Sistema Ventaja] ${name} init failed:`, error);
    }
  });

  doc.documentElement.classList.add('js-ready');
}

boot();
