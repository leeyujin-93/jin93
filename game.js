'use strict';
(() => {
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');
  const status = document.getElementById('status');
  const pad = document.getElementById('joystick');
  const stick = document.getElementById('stick');
  const zone = window.TEMPLE_WALK_AREA;
  const player = { x: 768, y: 740, facing: 1, step: 0 };
  const input = { x: 0, y: 0, pointer: null };
  const keys = new Set();
  const frames = [[120,74,359,609], [102,115,380,567], [81,27,354,619], [64,75,352,609]];
  let width = 1, height = 1, last = 0;
  function inside(x, y) {
    let result = false;
    const points = zone.points;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a.y > y) !== (b.y > y) && x < (b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) result = !result;
    }
    return result;
  }
  function release() {
    input.x = input.y = 0; input.pointer = null;
    stick.style.transform = 'translate(0px, 0px)';
  }
  function drag(event) {
    if (event.pointerId !== input.pointer) return;
    const rect = pad.getBoundingClientRect();
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(dx, dy), radius = 40;
    const ratio = distance > radius ? radius / distance : 1;
    stick.style.transform = `translate(${dx * ratio}px, ${dy * ratio}px)`;
    const strength = Math.max(0, (Math.min(distance / radius, 1) - 0.12) / 0.88);
    input.x = distance ? dx / distance * strength : 0;
    input.y = distance ? dy / distance * strength : 0;
  }
  pad.addEventListener('pointerdown', event => {
    if (input.pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
    input.pointer = event.pointerId; pad.setPointerCapture(event.pointerId); drag(event);
  });
  pad.addEventListener('pointermove', drag);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    pad.addEventListener(type, event => { if (event.pointerId === input.pointer) release(); });
  }
  window.addEventListener('keydown', event => {
    if (/^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|w|a|s|d)$/i.test(event.key) && event.target.tagName !== 'BUTTON') {
      event.preventDefault(); keys.add(event.key.toLowerCase());
    }
  });
  window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  function stop() { keys.clear(); release(); last = 0; }
  window.addEventListener('blur', stop);
  document.addEventListener('visibilitychange', stop);
  document.getElementById('reset').addEventListener('click', () => {
    stop(); player.x = 768; player.y = 740; player.step = 0; player.facing = 1;
  });
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  new ResizeObserver(resize).observe(canvas);
  function load(src) {
    return new Promise((resolve, reject) => {
      const image = new Image(); image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(src)); image.src = src;
    });
  }
  Promise.all([load('assets/temple-map.png'), load('assets/rabbit-player.png')]).then(([map, rabbit]) => {
    status.hidden = true; resize();
    function tick(time) {
      const dt = last ? Math.min((time-last)/1000, 0.05) : 0; last = time;
      let vx = input.x, vy = input.y;
      if (keys.size) {
        vx = Number(keys.has('arrowright') || keys.has('d')) - Number(keys.has('arrowleft') || keys.has('a'));
        vy = Number(keys.has('arrowdown') || keys.has('s')) - Number(keys.has('arrowup') || keys.has('w'));
        const length = Math.hypot(vx, vy); if (length > 1) { vx /= length; vy /= length; }
      }
      const oldX = player.x, oldY = player.y;
      // Small steps and separate axes keep the character on the original walkable floor.
      const count = Math.max(1, Math.ceil(240 * dt / 3));
      for (let i = 0; i < count; i++) {
        const x = player.x + vx * 240 * dt / count;
        if (inside(x, player.y)) player.x = x;
        const y = player.y + vy * 240 * dt / count;
        if (inside(player.x, y)) player.y = y;
      }
      const moving = Math.hypot(player.x-oldX, player.y-oldY) > 0.01;
      player.step = moving ? player.step + dt : 0;
      if (Math.abs(player.x-oldX) > 0.01) player.facing = player.x < oldX ? -1 : 1;
      ctx.setTransform(canvas.width/width, 0, 0, canvas.height/height, 0, 0);
      ctx.fillStyle = '#171328'; ctx.fillRect(0,0,width,height);
      const scale = Math.min(width/zone.width, height/zone.height);
      ctx.translate((width-zone.width*scale)/2, (height-zone.height*scale)/2); ctx.scale(scale,scale);
      ctx.drawImage(map, 0, 0, zone.width, zone.height);
      ctx.fillStyle = '#0005'; ctx.beginPath(); ctx.ellipse(player.x, player.y-2, 30, 7, 0, 0, Math.PI*2); ctx.fill();
      const index = moving ? Math.floor(player.step/0.14)%4 : 0;
      const [sx,sy,sw,sh] = frames[index], size = 160/724;
      ctx.save(); ctx.translate(player.x,player.y); ctx.scale(player.facing,1);
      ctx.drawImage(rabbit, index*543+sx, sy, sw, sh, -sw*size/2, -sh*size, sw*size, sh*size);
      ctx.restore(); requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }).catch(() => { status.textContent = '이미지를 불러오지 못했습니다. assets 폴더가 함께 있는지 확인해 주세요.'; });
})();
