'use strict';
(() => {
  const audio = document.getElementById('bgm');
  const button = document.getElementById('music-toggle');
  const status = document.getElementById('music-status');
  let requested = false, revision = 0, recovering = false;
  function show(message = '') { status.textContent = message; status.hidden = !message; }
  function update() {
    button.textContent = requested ? '🎵 음악 끄기' : '🎵 음악 켜기';
    button.setAttribute('aria-pressed', String(requested));
  }
  function stop() {
    revision++; requested = false; recovering = false;
    audio.pause(); update(); show();
  }
  function failure(error) {
    const code = audio.error && audio.error.code;
    stop();
    if (error && error.name === 'NotAllowedError') {
      show('Safari가 재생을 멈췄어요. 음악 켜기를 눌러 다시 시작해 주세요.');
    } else if (code === 2) {
      show('음악 연결이 끊겼어요. 음악 켜기를 눌러 다시 불러와 주세요.');
    } else if (code === 3 || code === 4) {
      show('음악 파일을 읽지 못했어요. 음악 켜기를 눌러 다시 시도해 주세요.');
    } else {
      show('음악이 중단됐어요. 음악 켜기를 눌러 다시 시작해 주세요.');
    }
  }
  function play() {
    const attempt = ++revision;
    try {
      const result = audio.play();
      if (result && typeof result.catch === 'function') result.catch(error => {
        if (attempt === revision && requested) failure(error);
      });
    } catch (error) { if (attempt === revision) failure(error); }
  }
  button.addEventListener('click', () => {
    if (requested) { stop(); return; }
    requested = true;
    update(); show('음악을 불러오는 중…');
    // Reload failed media and play within the Safari user gesture.
    if (audio.error) audio.load();
    play();
  });
  audio.addEventListener('playing', () => {
    if (!requested) { audio.pause(); return; }
    recovering = false; update(); show();
  });
  audio.addEventListener('waiting', () => {
    if (requested) show('음악을 불러오는 중… 잠시 기다려 주세요.');
  });
  audio.addEventListener('stalled', () => {
    if (requested && audio.readyState < 3) show('음악 로딩이 지연되고 있어요. 연결이 돌아오면 이어서 재생합니다.');
  });
  audio.addEventListener('pause', () => {
    if (!requested || !audio.paused || document.hidden || audio.error) return;
    // One attempt per interruption; no repeated retries on blocked playback.
    if (recovering) { failure(); return; }
    recovering = true; show('음악을 이어서 재생하는 중…'); play();
  });
  audio.addEventListener('error', () => failure());
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('pagehide', stop);
})();
