'use strict';
(() => {
  const audio = document.getElementById('bgm');
  const button = document.getElementById('music-toggle');
  const status = document.getElementById('music-status');
  let requested = false;
  let revision = 0;
  function show(message = '') {
    status.textContent = message;
    status.hidden = !message;
  }
  function update() {
    button.textContent = requested ? '🎵 음악 끄기' : '🎵 음악 켜기';
    button.setAttribute('aria-pressed', String(requested));
  }
  function stop() {
    revision++; requested = false; audio.pause(); update(); show();
  }
  button.addEventListener('click', () => {
    if (requested) { stop(); return; }
    requested = true;
    const attempt = ++revision;
    update(); show('음악을 불러오는 중…');
    // Call play directly in the button gesture for iPhone Safari.
    try {
      const result = audio.play();
      if (result && typeof result.catch === 'function') result.catch(() => {
        if (attempt !== revision) return;
        stop(); show('음악을 재생하지 못했어요. 연결을 확인하고 음악 켜기를 다시 눌러 주세요.');
      });
    } catch {
      stop(); show('음악을 재생하지 못했어요. 음악 켜기를 다시 눌러 주세요.');
    }
  });
  audio.addEventListener('playing', () => {
    if (!requested) { audio.pause(); return; }
    update(); show();
  });
  audio.addEventListener('waiting', () => { if (requested) show('음악을 불러오는 중…'); });
  audio.addEventListener('pause', () => { if (requested && audio.paused) stop(); });
  audio.addEventListener('error', () => {
    stop(); show('음악 파일을 불러오지 못했어요. 연결을 확인하고 다시 눌러 주세요.');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
})();
