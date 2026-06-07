/**
 * Premium app showcase timeline — plays when section enters viewport.
 */
(function () {
  const root = document.getElementById('app-showcase');
  if (!root) return;

  const stage = root.querySelector('.app-showcase-stage');
  if (!stage) return;

  const video = document.getElementById('appShowcaseVideo');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const floats = [...root.querySelectorAll('.app-float')];

  function setupShowcaseVideo() {
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    const pause = () => {
      video.pause();
    };

    video.addEventListener('loadeddata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    if (video.readyState >= 2) tryPlay();
    else video.load();

    document.addEventListener('touchstart', tryPlay, { once: true, passive: true });

    const videoObs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) tryPlay();
        else pause();
      },
      { threshold: 0.2 },
    );
    videoObs.observe(video);
  }

  setupShowcaseVideo();

  const PHASE = {
    IDLE: 'idle',
    PLAY: 'playing',
    F1: 'focus-1',
    F2: 'focus-2',
    F3: 'focus-3',
    F4: 'focus-4',
    RETURN: 'return',
    FINALE: 'finale',
  };

  let timers = [];
  let playing = false;

  function clearTimers() {
    timers.forEach((id) => clearTimeout(id));
    timers = [];
  }

  function setPhase(phase) {
    root.classList.remove(
      'app-showcase--playing',
      'app-showcase--focus-1',
      'app-showcase--focus-2',
      'app-showcase--focus-3',
      'app-showcase--focus-4',
      'app-showcase--return',
      'app-showcase--finale',
    );

    floats.forEach((el) => {
      el.classList.remove('app-float--out', 'app-float--in', 'app-float--focus');
    });

    if (phase === PHASE.PLAY) {
      root.classList.add('app-showcase--playing');
      floats.forEach((el) => {
        el.classList.add('app-float--out');
        el.classList.remove('app-float--focus');
      });
      return;
    }

    if (phase.startsWith('focus-')) {
      root.classList.add('app-showcase--playing');
      const n = phase.split('-')[1];
      root.classList.add(`app-showcase--focus-${n}`);
      floats.forEach((el) => {
        el.classList.add('app-float--out');
        el.classList.toggle('app-float--focus', el.classList.contains(`app-float--${n}`));
      });
      return;
    }

    if (phase === PHASE.RETURN) {
      root.classList.add('app-showcase--return');
      floats.forEach((el) => {
        el.classList.remove('app-float--out', 'app-float--focus');
        el.classList.add('app-float--in');
      });
      return;
    }

    if (phase === PHASE.FINALE) {
      root.classList.add('app-showcase--finale');
      return;
    }
  }

  function schedule(fn, ms) {
    timers.push(window.setTimeout(fn, ms));
  }

  function runTimeline() {
    if (playing || reduced) return;
    playing = true;
    clearTimers();

    setPhase(PHASE.IDLE);
    schedule(() => setPhase(PHASE.PLAY), 350);
    schedule(() => setPhase(PHASE.F1), 2000);
    schedule(() => setPhase(PHASE.F2), 3800);
    schedule(() => setPhase(PHASE.F3), 5600);
    schedule(() => setPhase(PHASE.F4), 7400);
    schedule(() => setPhase(PHASE.RETURN), 9200);
    schedule(() => setPhase(PHASE.FINALE), 10400);
    schedule(() => {
      playing = false;
    }, 12000);
  }

  function resetStatic() {
    clearTimers();
    playing = false;
    root.classList.add('app-showcase--finale');
    floats.forEach((el) => {
      el.classList.add('app-float--out');
      el.classList.remove('app-float--in', 'app-float--focus');
    });
  }

  if (reduced) {
    resetStatic();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          runTimeline();
        } else {
          clearTimers();
          playing = false;
          setPhase(PHASE.IDLE);
        }
      });
    },
    { threshold: 0.25 },
  );

  observer.observe(root);

  /* Replay when user taps stage (mobile friendly) */
  stage.addEventListener('click', () => {
    if (!playing) runTimeline();
  });
})();
