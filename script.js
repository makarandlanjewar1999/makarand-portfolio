// Timeline scrubber: acts as both a section nav and a scroll-position playhead,
// like the timeline ruler in a video editor.
// Silent background clips: block the casual "save video" paths.
// (Note: this deters right-click / drag-save, it can't make a video
// technically unextractable — the browser always has the bytes to play it.)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('video').forEach(v => {
    v.setAttribute('controlsList', 'nodownload noplaybackrate nofullscreen');
    v.setAttribute('disablePictureInPicture', '');
    v.setAttribute('playsinline', '');
    v.oncontextmenu = () => false;
    v.addEventListener('dragstart', e => e.preventDefault());
    // Keep silent loops playing even if a browser pauses on tab blur/slow connections.
    v.addEventListener('pause', () => {
      if (!document.hidden) v.play().catch(() => {});
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const segs = Array.from(document.querySelectorAll('.scrubber-seg'));
  const playhead = document.querySelector('.playhead');
  const code = document.querySelector('.scrubber-code');
  const track = document.querySelector('.scrubber-track');
  if (!segs.length) return;

  const sections = segs
    .map(seg => document.getElementById(seg.dataset.target))
    .filter(Boolean);

  function frameCode(totalProgress){
    // Fake SMPTE-style timecode derived from scroll progress, purely decorative.
    const totalFrames = Math.floor(totalProgress * 24 * 60); // pretend 60s runtime @24fps
    const secs = Math.floor(totalFrames / 24);
    const frames = totalFrames % 24;
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    const ff = String(frames).padStart(2, '0');
    return `00:${mm}:${ss}:${ff}`;
  }

  function update(){
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const progress = Math.min(1, Math.max(0, scrollTop / max));

    if (playhead && track){
      const w = track.getBoundingClientRect().width;
      playhead.style.left = `${progress * w}px`;
    }
    if (code) code.textContent = frameCode(progress);

    let activeIdx = 0;
    sections.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.4) activeIdx = i;
    });
    segs.forEach((seg, i) => seg.classList.toggle('active', i === activeIdx));
  }

  segs.forEach(seg => {
    seg.addEventListener('click', () => {
      const target = document.getElementById(seg.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
});
