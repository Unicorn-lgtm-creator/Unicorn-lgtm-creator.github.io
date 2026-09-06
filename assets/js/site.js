/* Brandora site-wide motion engine — scroll progress, reveal (progressive), 3D tilt + glare,
   marquee, cursor glow, nav. Pure vanilla JS, respects reduced motion.
   Content is visible by default; animations are enhancements only. */
(function () {
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(pointer:fine)').matches;

  /* ---------- scroll progress bar ---------- */
  var prog = document.getElementById('progress');
  if (prog) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      prog.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    };
    document.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- reveal on scroll (progressive enhancement) ---------- */
  var targets = document.querySelectorAll(
    '.sect-head, .card, .step, .price, .post, .work-card, .stat, .quote, .loc-intro, ' +
    '.leadbox, .answer-block, .cta-band, .form-card, .stats, .hero-inner .kicker, ' +
    '.hero-inner .lede, .hero-inner .btn-row, .hero-inner .hero-sub, .author-box, .notice'
  );
  if (reduced || !('IntersectionObserver' in window)) {
    /* no animation — leave content visible */
  } else {
    var idx = 0;
    targets.forEach(function (el) {
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(idx % 6, 4) * 70) + 'ms';
      idx++;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    /* safety net: never leave content hidden — force-reveal after 1s */
    setTimeout(function () {
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); });
    }, 1000);
  }

  /* ---------- 3D tilt + glare on cards ---------- */
  if (!reduced && fine) {
    var tiltEls = document.querySelectorAll('.card, .price, .work-card, .post, .step');
    tiltEls.forEach(function (el) {
      var glare = document.createElement('span');
      glare.className = 'tilt-glare';
      el.appendChild(glare);
      el.classList.add('tilt');
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        var rx = (0.5 - py) * 7;
        var ry = (px - 0.5) * 7;
        el.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
        el.style.setProperty('--gx', (px * 100) + '%');
        el.style.setProperty('--gy', (py * 100) + '%');
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ---------- marquee: duplicate track for seamless loop ---------- */
  document.querySelectorAll('.marquee').forEach(function (mq) {
    var track = mq.querySelector('.marquee-track');
    if (track) track.innerHTML = track.innerHTML + track.innerHTML;
  });

  /* ---------- cursor glow ---------- */
  var glow = document.getElementById('cursorGlow');
  if (glow && fine && !reduced) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      glow.style.transform = 'translate(' + (gx - 210) + 'px,' + (gy - 210) + 'px)';
      requestAnimationFrame(loop);
    })();
  }
})();
