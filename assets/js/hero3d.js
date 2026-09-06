/* Brandora 3D hero — layered particle galaxy + rotating wireframe cube + parallax.
   Pure vanilla JS, zero dependencies. No-ops on pages without #heroCanvas.
   Respects prefers-reduced-motion and pauses off-screen via rAF throttling. */
(function () {
  'use strict';
  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, t = 0;
  var starsFar = [], starsMid = [], starsNear = [];
  var core = [];
  var cubeVerts = [], cubeEdges = [];
  var CORE_R = 1, CUBE_R = 1;
  var ROTX = 0, ROTY = 0, curRX = 0, curRY = 0;
  var COLORS = ['#5B5CFF', '#7C5CFF', '#8C8DFF', '#B9AFFF', '#F5F3EE'];
  var running = true;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CORE_R = Math.min(W, H) * 0.21;
    CUBE_R = Math.min(W, H) * 0.34;
    var nFar = reduced ? 0 : Math.min(110, Math.max(34, Math.floor(W * H / 14000)));
    var nMid = reduced ? 0 : Math.min(60, Math.max(20, Math.floor(W * H / 26000)));
    var nNear = reduced ? 0 : Math.min(26, Math.max(8, Math.floor(W * H / 60000)));
    var nCore = reduced ? 0 : Math.min(120, Math.max(40, Math.floor(W * H / 15500)));
    starsFar = []; starsMid = []; starsNear = []; core = [];
    [[starsFar, nFar, 0.9], [starsMid, nMid, 1.6], [starsNear, nNear, 2.4]].forEach(function (g) {
      for (var i = 0; i < g[1]; i++) {
        g[0].push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), s: Math.random() * 1.3 + 0.3, sp: g[2], tw: Math.random() * 6.283 });
      }
    });
    for (var j = 0; j < nCore; j++) {
      var th = Math.acos(2 * Math.random() - 1), ph = Math.random() * 6.283;
      core.push({ x: Math.sin(th) * Math.cos(ph), y: Math.cos(th), z: Math.sin(th) * Math.sin(ph),
                  c: COLORS[Math.floor(Math.random() * COLORS.length)], s: Math.random() * 1.8 + 0.6 });
    }
    /* cube vertices */
    var h = 1;
    cubeVerts = [
      [-h, -h, -h], [h, -h, -h], [h, h, -h], [-h, h, -h],
      [-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]
    ];
    cubeEdges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  }

  function rot3d(x, y, z, rx, ry) {
    var x1 = x * Math.cos(ry) + z * Math.sin(ry);
    var z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    var y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
    var z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
    return { x: x1, y: y2, z: z2 };
  }

  function project(x, y, z, fov, camZ) {
    var s = fov / (fov + z * camZ);
    return { x: x * s, y: y * s, s: s };
  }

  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    var fov = W * 0.9, cx = W / 2, cy = H * 0.46;
    for (var j = 0; j < core.length; j++) {
      var q = rot3d(core[j].x, core[j].y, core[j].z, 0.35, 0.6);
      var p = project(q.x * CORE_R, q.y * CORE_R, q.z * CORE_R, fov, 2.2);
      ctx.globalAlpha = 0.45 + 0.55 * (q.z * 0.5 + 0.5);
      ctx.fillStyle = core[j].c;
      ctx.beginPath(); ctx.arc(cx + p.x, cy + p.y, core[j].s * p.s * 0.8, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawStarLayer(layer, fov, cx, cy, par) {
    var px = curRX * 260 * par, py = curRY * 300 * par;
    for (var i = 0; i < layer.length; i++) {
      var st = layer[i];
      st.z -= st.sp * 0.0011;
      if (st.z <= 0) st.z = 1;
      var zz = st.z * 2 - 1;
      var p0 = project(st.x * W * 0.95 + px, st.y * H * 0.95 + py, zz, fov, 1.1);
      if (p0.x < 0 || p0.x > W || p0.y < 0 || p0.y > H) continue;
      var a = (0.18 + 0.5 * Math.abs(zz)) * (0.55 + 0.45 * Math.sin(t * 0.0015 + st.tw));
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = '#C9CDFF';
      var sz = st.s * p0.s;
      ctx.fillRect(cx + p0.x, cy + p0.y, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var fov = W * 0.9, cx = W / 2, cy = H * 0.46;
    var rx = curRX + Math.sin(t * 0.00016) * 0.2;
    var ry = curRY + t * 0.0002;

    /* depth-layered starfield with parallax */
    drawStarLayer(starsFar, fov, 0, 0, 0.2);
    drawStarLayer(starsMid, fov, 0, 0, 0.55);
    drawStarLayer(starsNear, fov, 0, 0, 1);

    /* rotating wireframe cube (behind core) */
    var vp = [];
    for (var vi = 0; vi < cubeVerts.length; vi++) {
      var v = cubeVerts[vi];
      var qv = rot3d(v[0], v[1], v[2], rx * 0.7, -ry * 1.1);
      var pv = project(qv.x * CUBE_R, qv.y * CUBE_R, qv.z * CUBE_R, fov, 2.0);
      vp.push({ x: cx + pv.x, y: cy + pv.y, z: qv.z, ss: pv.s });
    }
    for (var e = 0; e < cubeEdges.length; e++) {
      var A = vp[cubeEdges[e][0]], B = vp[cubeEdges[e][1]];
      var depth = (A.z + B.z) / 2;
      var al = 0.05 + 0.13 * (depth * 0.5 + 0.5);
      /* glow pass */
      ctx.strokeStyle = '#7C5CFF'; ctx.globalAlpha = al * 0.35; ctx.lineWidth = 3.2 * A.ss;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
      /* crisp pass */
      ctx.strokeStyle = depth > 0 ? '#8C8DFF' : '#5B5CFF'; ctx.globalAlpha = al; ctx.lineWidth = 1.1 * A.ss;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    }

    /* rotating particle core */
    var pts = [];
    for (var j = 0; j < core.length; j++) {
      var q = rot3d(core[j].x, core[j].y, core[j].z, rx, ry);
      var p = project(q.x * CORE_R, q.y * CORE_R, q.z * CORE_R, fov, 2.2);
      pts.push({ x: cx + p.x, y: cy + p.y, z: q.z, s: core[j].s, c: core[j].c, ss: p.s });
    }
    /* constellation lines */
    for (var a = 0; a < pts.length; a++) {
      for (var b = a + 1; b < pts.length; b++) {
        var dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 9000) {
          ctx.globalAlpha = 0.04 * (1 - d2 / 9000);
          ctx.strokeStyle = '#8C8DFF'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
        }
      }
    }
    /* dots */
    for (var k = 0; k < pts.length; k++) {
      var d = pts[k];
      var al = 0.4 + 0.6 * (d.z * 0.5 + 0.5);
      var r = d.s * d.ss * 0.8;
      ctx.globalAlpha = al * 0.2; ctx.fillStyle = d.c;
      ctx.beginPath(); ctx.arc(d.x, d.y, r * 4, 0, 6.283); ctx.fill();
      ctx.globalAlpha = al; ctx.fillStyle = d.c;
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    t++;
    if (running && !reduced) requestAnimationFrame(draw);
  }

  function easeLoop() {
    curRX += (ROTX - curRX) * 0.05;
    curRY += (ROTY - curRY) * 0.05;
    if (running && !reduced) requestAnimationFrame(easeLoop);
  }

  if (matchMedia('(pointer:fine)').matches && !reduced) {
    document.addEventListener('mousemove', function (e) {
      ROTX = (e.clientY / Math.max(H, 1) - 0.5) * 1.0;
      ROTY = (e.clientX / Math.max(W, 1) - 0.5) * 1.4;
      /* wordmark tilt */
      var hero = document.querySelector('.hero3d');
      if (hero) {
        var rx2 = (0.5 - e.clientY / Math.max(H, 1)) * 9;
        var ry2 = (e.clientX / Math.max(W, 1) - 0.5) * 13;
        hero.style.setProperty('--tx', rx2.toFixed(2) + 'deg');
        hero.style.setProperty('--ty', ry2.toFixed(2) + 'deg');
      }
    });
  }

  /* pause when hero off-screen or tab hidden */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { running = en.isIntersecting; });
    }, { threshold: 0.02 });
    io.observe(canvas);
  }

  window.addEventListener('resize', function () {
    resize();
    if (reduced) drawStatic();
  });

  resize();
  if (reduced) { drawStatic(); }
  else { requestAnimationFrame(easeLoop); requestAnimationFrame(draw); }
})();
