(() => {
  const tracker = {
    canvas: null,
    ctx: null,
    prevGray: null,
    w: 0,
    h: 0,
    lastTs: 0,
    raf: 0
  };

  function cleanup() {
    tracker.canvas = null;
    tracker.ctx = null;
    tracker.prevGray = null;
    tracker.w = 0;
    tracker.h = 0;
    tracker.lastTs = 0;
    cancelAnimationFrame(tracker.raf);
  }

  function captureGray() {
    tracker.ctx.drawImage(els.video, 0, 0, tracker.w, tracker.h);
    const rgba = tracker.ctx.getImageData(0, 0, tracker.w, tracker.h).data;
    const gray = new Uint8Array(tracker.w * tracker.h);
    for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
      gray[j] = (rgba[i] * 77 + rgba[i + 1] * 150 + rgba[i + 2] * 29) >> 8;
    }
    return gray;
  }

  function trackPoint(prev, curr, px, py, w, h) {
    const patchR = 3;
    const searchR = 7;
    const x0 = Math.round(px);
    const y0 = Math.round(py);

    if (x0 < patchR + searchR || y0 < patchR + searchR ||
        x0 >= w - patchR - searchR || y0 >= h - patchR - searchR) {
      return { x: px, y: py };
    }

    let bestScore = Infinity;
    let bestX = x0;
    let bestY = y0;

    for (let dy = -searchR; dy <= searchR; dy++) {
      for (let dx = -searchR; dx <= searchR; dx++) {
        const cx = x0 + dx;
        const cy = y0 + dy;
        let score = 0;

        for (let yy = -patchR; yy <= patchR; yy++) {
          const row0 = (y0 + yy) * w;
          const row1 = (cy + yy) * w;
          for (let xx = -patchR; xx <= patchR; xx++) {
            score += Math.abs(prev[row0 + x0 + xx] - curr[row1 + cx + xx]);
          }
        }

        if (score < bestScore) {
          bestScore = score;
          bestX = cx;
          bestY = cy;
        }
      }
    }

    if (bestScore / 49 > 42) return { x: px, y: py };
    return { x: bestX, y: bestY };
  }

  function init() {
    cleanup();
    const vw = els.video.videoWidth;
    const vh = els.video.videoHeight;
    const scale = Math.min(1, 320 / vw);

    tracker.w = Math.max(160, Math.round(vw * scale));
    tracker.h = Math.max(120, Math.round(vh * scale));
    tracker.canvas = document.createElement('canvas');
    tracker.canvas.width = tracker.w;
    tracker.canvas.height = tracker.h;
    tracker.ctx = tracker.canvas.getContext('2d', { willReadFrequently: true });
    tracker.prevGray = captureGray();

    state.currentCamPoints = state.camPoints.map(p => ({ ...p }));
    state.smoothedCamPoints = state.camPoints.map(p => ({ ...p }));
    state.neutralCamPoints = state.camPoints.map(p => ({ ...p }));
  }

  function startLightTracking() {
    if (!state.stream || state.photoPoints.length !== 11 || state.camPoints.length !== 11) return;
    buildMesh();
    init();
    state.tracking = true;
    updateButtons();
    setStatus('表情リンク中です。スマホ向け軽量トラッカーで目・口・眉を追跡しています。', 'ok');
    tracker.raf = requestAnimationFrame(loop);
  }

  function stopLightTracking() {
    state.tracking = false;
    cleanup();
    if (state.photoImg) renderPhotoBase(true);
    if (state.stream) renderCamBase();
    updateButtons();
  }

  function loop(ts) {
    if (!state.tracking) return;

    if (tracker.lastTs && ts - tracker.lastTs < 70) {
      tracker.raf = requestAnimationFrame(loop);
      return;
    }
    tracker.lastTs = ts;

    try {
      const curr = captureGray();
      const sx = tracker.w / els.video.videoWidth;
      const sy = tracker.h / els.video.videoHeight;
      const next = [];

      for (const p of state.currentCamPoints) {
        const q = trackPoint(tracker.prevGray, curr, p.x * sx, p.y * sy, tracker.w, tracker.h);
        next.push({ x: q.x / sx, y: q.y / sy });
      }

      state.currentCamPoints = next;
      const alpha = Math.max(0.08, 1 - Number(els.smooth.value) / 100);
      state.smoothedCamPoints = state.smoothedCamPoints.map((p, i) => ({
        x: p.x + (state.currentCamPoints[i].x - p.x) * alpha,
        y: p.y + (state.currentCamPoints[i].y - p.y) * alpha
      }));

      tracker.prevGray = curr;
      renderPhotoWarp();
      renderCamBase();
    } catch (err) {
      console.error(err);
      stopLightTracking();
      setStatus('追跡中にエラーが発生しました。カメラ側のポイントを設定し直してください。', 'bad');
      return;
    }

    tracker.raf = requestAnimationFrame(loop);
  }

  // The original page expects an OpenCV-ready flag. Keep the UI contract, but use our lightweight tracker.
  state.cvReady = true;
  try {
    const label = els.cvDiag.parentElement.querySelector('span');
    if (label) label.textContent = '軽量トラッカー';
    setDiag(els.cvDiag, '準備完了', 'good');
    const sub = document.querySelector('.sub');
    if (sub) sub.innerHTML = sub.innerHTML.replace('顔AIは使わず、OpenCV.jsのOptical Flowで', '顔AIもOpenCVも使わず、スマホ向け軽量トラッカーで');
  } catch (_) {}

  // The old click handler captured the old startTracking function, so intercept it first.
  els.startTrackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!state.tracking) startLightTracking();
  }, true);

  els.stopTrackBtn.addEventListener('click', (e) => {
    if (!state.tracking) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    stopLightTracking();
    setStatus('追跡を停止しました。', 'ok');
  }, true);

  // Functions such as stopCamera resolve this name at call time.
  try { stopTracking = stopLightTracking; } catch (_) {}

  updateButtons();
  setStatus('軽量トラッカーの準備が完了しました。写真とカメラの11点を登録してください。', 'ok');
})();