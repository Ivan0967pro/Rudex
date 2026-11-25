"use strict";

/**
 * Rudex 5.0 Screenshot Pencil Annotator (browser-safe, zero Node imports).
 * Lets the user draw freehand pencil strokes, arrows, boxes, highlights, text notes,
 * or redaction masks on a screenshot (clipboard, current Antigravity window, chat image,
 * or local file) and paste/attach/send it directly into chat.
 */

const RUDEX_ANNOTATOR_COLORS = [
  "#ef4444",
  "#d97757",
  "#facc15",
  "#22c55e",
  "#38bdf8",
  "#ffffff",
];

const RUDEX_ANNOTATOR_TOOLS = [
  { id: "pencil", icon: "✎", labelRu: "Карандаш", labelEn: "Pencil" },
  { id: "arrow", icon: "↗", labelRu: "Стрелка", labelEn: "Arrow" },
  { id: "rect", icon: "▢", labelRu: "Рамка", labelEn: "Box" },
  { id: "highlight", icon: "🖍", labelRu: "Маркер", labelEn: "Highlight" },
  { id: "text", icon: "T", labelRu: "Текст", labelEn: "Text" },
  { id: "blur", icon: "▦", labelRu: "Скрыть", labelEn: "Redact" },
];

const RUDEX_ANNOTATOR_SIZES = [
  { id: "s", label: "S", width: 2.5 },
  { id: "m", label: "M", width: 4.5 },
  { id: "l", label: "L", width: 8.5 },
];

function annEscapeHtml(str) {
  if (typeof rv5EscapeHtml === "function") return rv5EscapeHtml(str);
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function annDrawStroke(ctx, item) {
  if (!ctx || !item) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const w = Number(item.width) || 4;

  if (item.tool === "pencil" || item.tool === "highlight") {
    const pts = Array.isArray(item.points) ? item.points : [];
    if (pts.length === 0) { ctx.restore(); return; }
    ctx.strokeStyle = item.color || "#ef4444";
    ctx.lineWidth = item.tool === "highlight" ? w * 3.4 : w;
    ctx.globalAlpha = item.tool === "highlight" ? 0.34 : 1;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 1) {
      ctx.lineTo(pts[0].x + 0.1, pts[0].y + 0.1);
    } else {
      for (let i = 1; i < pts.length - 1; i += 1) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      const last = pts[pts.length - 1];
      ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
  } else if (item.tool === "rect") {
    const x = Math.min(item.x1, item.x2);
    const y = Math.min(item.y1, item.y2);
    const rw = Math.abs(item.x2 - item.x1);
    const rh = Math.abs(item.y2 - item.y1);
    ctx.strokeStyle = item.color || "#ef4444";
    ctx.lineWidth = w;
    ctx.strokeRect(x, y, rw, rh);
  } else if (item.tool === "blur") {
    const x = Math.min(item.x1, item.x2);
    const y = Math.min(item.y1, item.y2);
    const rw = Math.abs(item.x2 - item.x1);
    const rh = Math.abs(item.y2 - item.y1);
    ctx.fillStyle = "#18181b";
    ctx.fillRect(x, y, rw, rh);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, rw, rh);
  } else if (item.tool === "arrow") {
    const dx = item.x2 - item.x1;
    const dy = item.y2 - item.y1;
    const ang = Math.atan2(dy, dx);
    const headLen = Math.max(12, w * 3.8);
    ctx.strokeStyle = item.color || "#ef4444";
    ctx.fillStyle = item.color || "#ef4444";
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(item.x1, item.y1);
    ctx.lineTo(item.x2, item.y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(item.x2, item.y2);
    ctx.lineTo(item.x2 - headLen * Math.cos(ang - Math.PI / 6), item.y2 - headLen * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(item.x2 - headLen * Math.cos(ang + Math.PI / 6), item.y2 - headLen * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  } else if (item.tool === "text" && item.text) {
    const fs = Math.max(14, Math.round(w * 4.2));
    ctx.font = `600 ${fs}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const padX = 7;
    const padY = 4;
    const metrics = ctx.measureText(item.text);
    const tw = Math.ceil(metrics.width);
    const th = Math.ceil(fs * 1.25);
    ctx.fillStyle = "rgba(15, 15, 18, 0.82)";
    ctx.fillRect(item.x - padX, item.y - th + 3, tw + padX * 2, th + padY);
    ctx.fillStyle = item.color || "#ef4444";
    ctx.fillText(item.text, item.x, item.y);
  }
  ctx.restore();
}

function annDataUrlToBlob(dataUrl) {
  try {
    const parts = String(dataUrl || "").split(",");
    if (parts.length < 2) return null;
    const mimeMatch = /:([^;]+);/.exec(parts[0]);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const binStr = atob(parts[1]);
    const len = binStr.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) u8[i] = binStr.charCodeAt(i);
    return new Blob([u8], { type: mime });
  } catch (_e) {
    return null;
  }
}

function createScreenshotAnnotator(options) {
  const opts = options && typeof options === "object" ? options : {};
  const mountEl = opts.mountEl || null;
  const doc = opts.doc || (typeof document !== "undefined" ? document : null);
  const win = opts.win || (typeof window !== "undefined" ? window : null);
  const invokeIpc = typeof opts.invokeIpc === "function" ? opts.invokeIpc : () => Promise.resolve(null);
  const getLocale = typeof opts.getLocale === "function" ? opts.getLocale : () => "ru";
  const isGenerating = typeof opts.isGenerating === "function" ? opts.isGenerating : () => false;
  const onSendLiveEdit = typeof opts.onSendLiveEdit === "function" ? opts.onSendLiveEdit : null;
  const onNotify = typeof opts.onNotify === "function" ? opts.onNotify : null;

  const st = {
    open: false,
    tool: "pencil",
    color: "#ef4444",
    sizeId: "m",
    noteText: "",
    statusMsg: "",
    baseImage: null,
    baseDataUrl: "",
    strokes: [],
    redoStack: [],
    drawing: null,
    pendingTextPos: null,
    loading: false,
    sourceCtx: null,
    zoom: 1,
    natW: 0,
    natH: 0,
  };

  let canvasEl = null;
  let stageEl = null;
  let fileInputEl = null;

  function isRu() {
    return getLocale() !== "en";
  }

  function currentStrokeWidth() {
    const found = RUDEX_ANNOTATOR_SIZES.find((s) => s.id === st.sizeId);
    const base = found ? found.width : 4.5;
    // Scale stroke thickness slightly with high-res canvas so strokes feel consistent regardless of image resolution
    const refScale = canvasEl && canvasEl.width > 0 ? Math.max(0.85, Math.min(2.2, canvasEl.width / 1200)) : 1;
    return Math.round(base * refScale * 10) / 10;
  }

  function fitCanvasDisplay() {
    if (!canvasEl || !st.baseImage) return;
    const cw = canvasEl.width || 1280;
    const ch = canvasEl.height || 720;
    let availW = 0;
    let availH = 0;
    if (stageEl && typeof stageEl.getBoundingClientRect === "function") {
      const sr = stageEl.getBoundingClientRect();
      if (sr && sr.width > 80 && sr.height > 80) {
        availW = sr.width - 44;
        availH = sr.height - 44;
      }
    }
    if (!availW || !availH) {
      const vw = (win && win.innerWidth) || 1280;
      const vh = (win && win.innerHeight) || 800;
      availW = Math.max(360, Math.min(1480, Math.round(vw * 0.90)) - 44);
      availH = Math.max(260, Math.min(920, Math.round(vh * 0.88)) - 148);
    }
    // Always fill the available stage generously (upscaling small previews up to 3.5x so they are crisp & easy to draw on)
    const fitScale = Math.min(availW / cw, availH / ch, 3.5);
    const dispW = Math.max(120, Math.round(cw * fitScale * st.zoom));
    const dispH = Math.max(80, Math.round(ch * fitScale * st.zoom));
    if (canvasEl.style) {
      canvasEl.style.width = `${dispW}px`;
      canvasEl.style.height = `${dispH}px`;
    }
    const zLbl = mountEl ? mountEl.querySelector('[data-ann-role="zoomLabel"]') : null;
    if (zLbl) zLbl.textContent = `${Math.round(st.zoom * 100)}%`;
  }

  function redrawCanvas() {
    if (!canvasEl || !st.baseImage) return;
    const img = st.baseImage;
    const natW = img.naturalWidth || img.width || 960;
    const natH = img.naturalHeight || img.height || 540;
    st.natW = natW;
    st.natH = natH;
    // Keep HiDPI internal buffer (>=1280px long side up to 2.5x upscale, capped at 2200px) so annotations stay razor-sharp
    const maxDim = 2200;
    const minDim = 1280;
    const longest = Math.max(natW, natH);
    let scale = 1;
    if (longest > maxDim) scale = maxDim / longest;
    else if (longest < minDim) scale = Math.min(2.5, minDim / longest);
    const cw = Math.max(1, Math.round(natW * scale));
    const ch = Math.max(1, Math.round(natH * scale));
    if (canvasEl.width !== cw || canvasEl.height !== ch) {
      canvasEl.width = cw;
      canvasEl.height = ch;
    }
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    try { ctx.imageSmoothingQuality = "high"; } catch (_e) {}
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    for (let i = 0; i < st.strokes.length; i += 1) {
      annDrawStroke(ctx, st.strokes[i]);
    }
    if (st.drawing) {
      annDrawStroke(ctx, st.drawing);
    }
    fitCanvasDisplay();
  }

  function exportPngDataUrl() {
    if (!canvasEl || !st.baseImage) return "";
    redrawCanvas();
    try {
      return canvasEl.toDataURL("image/png");
    } catch (_e) {
      return st.baseDataUrl || "";
    }
  }

  function loadImageDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== "string") return;
    st.loading = true;
    st.statusMsg = "";
    render();
    const ImgCtor = (win && win.Image) || (typeof Image !== "undefined" ? Image : null);
    if (!ImgCtor) {
      st.loading = false;
      st.baseDataUrl = dataUrl;
      render();
      return;
    }
    const img = new ImgCtor();
    img.onload = () => {
      st.loading = false;
      st.baseImage = img;
      st.baseDataUrl = dataUrl;
      st.strokes = [];
      st.redoStack = [];
      st.drawing = null;
      st.pendingTextPos = null;
      render();
    };
    img.onerror = () => {
      st.loading = false;
      st.statusMsg = isRu() ? "Не удалось загрузить изображение" : "Failed to load image";
      render();
    };
    img.src = dataUrl;
  }

  function captureCleanWindow() {
    st.loading = true;
    // Temporarily hide annotator backdrop so we capture Antigravity cleanly beneath it
    if (mountEl) mountEl.style.visibility = "hidden";
    const runCap = () => {
      invokeIpc("agy-studio:capture-window-screenshot").then((res) => {
        if (mountEl) mountEl.style.visibility = "";
        st.loading = false;
        if (res && res.ok && res.dataUrl) {
          loadImageDataUrl(res.dataUrl);
        } else {
          st.statusMsg = isRu() ? "Снимок окна недоступен — вставьте Ctrl+V или выберите файл" : "Window capture unavailable — paste Ctrl+V or choose a file";
          render();
        }
      });
    };
    if (win && typeof win.setTimeout === "function") win.setTimeout(runCap, 65);
    else runCap();
  }

  function loadFromClipboard() {
    st.loading = true;
    render();
    return invokeIpc("agy-studio:read-clipboard-image").then((res) => {
      st.loading = false;
      if (res && res.ok && res.dataUrl) {
        loadImageDataUrl(res.dataUrl);
        return true;
      }
      st.statusMsg = isRu() ? "В буфере обмена нет картинки" : "No image in clipboard";
      render();
      return false;
    });
  }

  function findComposerAttachmentDataUrl() {
    if (!doc || typeof rv5FindNativeComposer !== "function") return "";
    const { container } = rv5FindNativeComposer(doc);
    if (!container || typeof container.querySelectorAll !== "function") return "";
    const imgs = container.querySelectorAll("img");
    for (let i = imgs.length - 1; i >= 0; i -= 1) {
      const src = imgs[i] && imgs[i].src ? String(imgs[i].src) : "";
      if (src.startsWith("data:image/") || src.startsWith("blob:")) return src;
    }
    return "";
  }

  function open(openOpts) {
    const o = openOpts && typeof openOpts === "object" ? openOpts : {};
    st.open = true;
    st.noteText = String(o.noteText || "");
    st.statusMsg = "";
    st.pendingTextPos = null;
    st.zoom = 1;
    st.sourceCtx = o.sourceImgEl
      ? {
          sourceImgEl: o.sourceImgEl,
          thumbWrapper: o.thumbWrapper || null,
          dialogEl: o.dialogEl || null,
          fromLightbox: Boolean(o.fromLightbox),
        }
      : null;
    render();

    if (o.dataUrl) {
      loadImageDataUrl(o.dataUrl);
      return;
    }
    // Auto-source priority: 1) Clipboard image -> 2) Composer attached image -> 3) Live Antigravity window capture
    invokeIpc("agy-studio:read-clipboard-image").then((res) => {
      if (!st.open) return;
      if (res && res.ok && res.dataUrl) {
        loadImageDataUrl(res.dataUrl);
        return;
      }
      const compImg = findComposerAttachmentDataUrl();
      if (compImg) {
        loadImageDataUrl(compImg);
        return;
      }
      captureCleanWindow();
    });
  }

  function close() {
    st.open = false;
    st.drawing = null;
    st.pendingTextPos = null;
    st.sourceCtx = null;
    if (mountEl) mountEl.innerHTML = "";
  }

  function isOpen() {
    return st.open;
  }

  function canvasCoordsFromEvent(e) {
    if (!canvasEl || typeof canvasEl.getBoundingClientRect !== "function") return { x: 0, y: 0 };
    const r = canvasEl.getBoundingClientRect();
    if (!r.width || !r.height) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - r.left) / r.width) * canvasEl.width,
      y: ((e.clientY - r.top) / r.height) * canvasEl.height,
    };
  }

  function pasteImageIntoNativeComposer(dataUrl, noteText) {
    let pasted = false;
    if (doc && typeof rv5FindNativeComposer === "function") {
      const { editable } = rv5FindNativeComposer(doc);
      if (editable) {
        try {
          if (typeof editable.focus === "function") editable.focus();
          const blob = annDataUrlToBlob(dataUrl);
          if (blob && typeof DataTransfer !== "undefined" && typeof File !== "undefined") {
            const dt = new DataTransfer();
            dt.items.add(new File([blob], `rudex-edit-${Date.now()}.png`, { type: "image/png" }));
            const PasteEvt = (win && win.ClipboardEvent) || (typeof ClipboardEvent !== "undefined" ? ClipboardEvent : null);
            if (PasteEvt) {
              const evt = new PasteEvt("paste", { bubbles: true, cancelable: true, clipboardData: dt });
              editable.dispatchEvent(evt);
              pasted = true;
            }
          }
          if (noteText && noteText.trim() && typeof rv5ReadEditableText === "function" && !rv5ReadEditableText(editable)) {
            if (editable.tagName === "TEXTAREA") {
              const proto = win && win.HTMLTextAreaElement ? win.HTMLTextAreaElement.prototype : null;
              const desc = proto ? Object.getOwnPropertyDescriptor(proto, "value") : null;
              if (desc && typeof desc.set === "function") desc.set.call(editable, noteText.trim());
              else editable.value = noteText.trim();
            } else {
              editable.textContent = noteText.trim();
            }
            editable.dispatchEvent(new ((win && win.Event) || Event)("input", { bubbles: true }));
          }
        } catch (_e) {}
      }
    }
    return pasted;
  }

  function closeNativeLightboxIfAny(srcCtx) {
    if (!srcCtx || !srcCtx.fromLightbox || !srcCtx.dialogEl) return;
    try {
      const dlg = srcCtx.dialogEl;
      if (typeof dlg.querySelector === "function") {
        const closeBtn = dlg.querySelector('button[aria-label*="Close"], button[aria-label*="close"], button[aria-label*="Закрыть"], button[data-slot="dialog-close"]');
        if (closeBtn && !closeBtn.hasAttribute("data-rudex-img-edit-btn") && typeof closeBtn.click === "function") {
          closeBtn.click();
          return;
        }
      }
      if (doc && typeof doc.dispatchEvent === "function") {
        const KeyEvt = (win && win.KeyboardEvent) || (typeof KeyboardEvent !== "undefined" ? KeyboardEvent : null);
        if (KeyEvt) dlg.dispatchEvent(new KeyEvt("keydown", { key: "Escape", code: "Escape", bubbles: true }));
      }
    } catch (_e) {}
  }

  function removeOriginalThumbIfAny(srcCtx) {
    if (!srcCtx || !srcCtx.thumbWrapper) return;
    try {
      const scopes = [srcCtx.thumbWrapper, srcCtx.thumbWrapper.parentElement];
      for (let s = 0; s < scopes.length; s += 1) {
        const box = scopes[s];
        if (!box || typeof box.querySelectorAll !== "function") continue;
        const btns = box.querySelectorAll("button");
        for (let i = 0; i < btns.length; i += 1) {
          const b = btns[i];
          if (!b || b.hasAttribute("data-rudex-img-edit-btn")) continue;
          const lbl = String((b.getAttribute && (b.getAttribute("aria-label") || b.getAttribute("title"))) || b.textContent || "").toLowerCase();
          if (btns.length <= 2 || /remove|delete|close|удал|убра|закры|×|✕/.test(lbl)) {
            if (typeof b.click === "function") b.click();
            return;
          }
        }
      }
    } catch (_e) {}
  }

  function handleAttachToChat() {
    const dataUrl = exportPngDataUrl();
    if (!dataUrl) return;
    const note = st.noteText.trim();
    const srcCtx = st.sourceCtx;
    invokeIpc("agy-studio:write-clipboard-image", { dataUrl }).then(() => {
      closeNativeLightboxIfAny(srcCtx);
      removeOriginalThumbIfAny(srcCtx);
      const doPaste = () => {
        const okPaste = pasteImageIntoNativeComposer(dataUrl, note);
        if (onNotify) {
          onNotify(
            okPaste
              ? (isRu() ? "Скрин с правками вставлен в чат (также в буфере)" : "Annotated image attached to chat")
              : (isRu() ? "Скрин скопирован — нажмите Ctrl+V в чате" : "Copied — press Ctrl+V in chat")
          );
        }
      };
      if (srcCtx && (srcCtx.fromLightbox || srcCtx.thumbWrapper) && win && typeof win.setTimeout === "function") {
        win.setTimeout(doPaste, 45);
      } else {
        doPaste();
      }
      close();
    });
  }

  function handleCopyOnly() {
    const dataUrl = exportPngDataUrl();
    if (!dataUrl) return;
    invokeIpc("agy-studio:write-clipboard-image", { dataUrl }).then((res) => {
      st.statusMsg = res && res.ok
        ? (isRu() ? "✓ Скопировано в буфер обмена (Ctrl+V в чат)" : "✓ Copied to clipboard")
        : (isRu() ? "Ошибка копирования" : "Copy failed");
      render();
    });
  }

  function handleSendLive() {
    const dataUrl = exportPngDataUrl();
    if (!dataUrl || !onSendLiveEdit) return;
    onSendLiveEdit({ dataUrl, text: st.noteText.trim() });
    close();
  }

  function undo() {
    if (st.strokes.length === 0) return;
    st.redoStack.push(st.strokes.pop());
    redrawCanvas();
    updateUndoRedoButtons();
  }

  function redo() {
    if (st.redoStack.length === 0) return;
    st.strokes.push(st.redoStack.pop());
    redrawCanvas();
    updateUndoRedoButtons();
  }

  function clearStrokes() {
    if (st.strokes.length === 0) return;
    st.strokes = [];
    st.redoStack = [];
    redrawCanvas();
    updateUndoRedoButtons();
  }

  function updateUndoRedoButtons() {
    if (!mountEl) return;
    const u = mountEl.querySelector('[data-ann-act="undo"]');
    const r = mountEl.querySelector('[data-ann-act="redo"]');
    if (u) u.disabled = st.strokes.length === 0;
    if (r) r.disabled = st.redoStack.length === 0;
  }

  function commitPendingText(val) {
    const txt = String(val || "").trim();
    if (txt && st.pendingTextPos) {
      st.strokes.push({
        tool: "text",
        color: st.color,
        width: currentStrokeWidth(),
        x: st.pendingTextPos.x,
        y: st.pendingTextPos.y,
        text: txt,
      });
      st.redoStack = [];
    }
    st.pendingTextPos = null;
    render();
  }

  function attachCanvasEvents() {
    if (!canvasEl) return;
    canvasEl.addEventListener("pointerdown", (e) => {
      if (typeof e.button === "number" && e.button !== 0) return;
      if (!st.baseImage) return;
      const pt = canvasCoordsFromEvent(e);
      if (st.tool === "text") {
        st.pendingTextPos = pt;
        render();
        const inp = mountEl && mountEl.querySelector('[data-ann-role="textOverlayInput"]');
        if (inp && typeof inp.focus === "function") inp.focus();
        return;
      }
      if (typeof canvasEl.setPointerCapture === "function" && e.pointerId !== undefined) {
        try { canvasEl.setPointerCapture(e.pointerId); } catch (_err) {}
      }
      if (st.tool === "pencil" || st.tool === "highlight") {
        st.drawing = { tool: st.tool, color: st.color, width: currentStrokeWidth(), points: [pt] };
      } else {
        st.drawing = { tool: st.tool, color: st.color, width: currentStrokeWidth(), x1: pt.x, y1: pt.y, x2: pt.x, y2: pt.y };
      }
      redrawCanvas();
    });

    canvasEl.addEventListener("pointermove", (e) => {
      if (!st.drawing) return;
      const pt = canvasCoordsFromEvent(e);
      if (st.drawing.points) {
        st.drawing.points.push(pt);
      } else {
        st.drawing.x2 = pt.x;
        st.drawing.y2 = pt.y;
      }
      redrawCanvas();
    });

    const finishStroke = () => {
      if (!st.drawing) return;
      st.strokes.push(st.drawing);
      st.redoStack = [];
      st.drawing = null;
      redrawCanvas();
      updateUndoRedoButtons();
    };
    canvasEl.addEventListener("pointerup", finishStroke);
    canvasEl.addEventListener("pointercancel", finishStroke);
  }

  function render() {
    if (!mountEl) return;
    if (!st.open) {
      mountEl.innerHTML = "";
      return;
    }
    const ru = isRu();
    const dimText = st.natW > 0 && st.natH > 0 ? `${st.natW}×${st.natH}` : "";
    mountEl.innerHTML = `
      <div class="rx-annotator-backdrop" data-ann-act="backdrop">
        <div class="rx-annotator-shell" role="dialog" aria-modal="true" aria-label="${ru ? "Правки на скриншоте" : "Screenshot Annotator"}">
          <div class="rx-ann-toolbar">
            <div class="rx-ann-seg">
              ${RUDEX_ANNOTATOR_TOOLS.map((tl) => `
                <button type="button" class="rx-ann-tool-btn${st.tool === tl.id ? " is-active" : ""}" data-ann-tool="${tl.id}" title="${annEscapeHtml(ru ? tl.labelRu : tl.labelEn)}">
                  <span>${tl.icon}</span>
                  <span>${annEscapeHtml(ru ? tl.labelRu : tl.labelEn)}</span>
                </button>
              `).join("")}
            </div>

            <div class="rx-ann-group">
              ${RUDEX_ANNOTATOR_COLORS.map((col) => `
                <button type="button" class="rx-ann-color${st.color === col ? " is-active" : ""}" data-ann-color="${col}" style="background:${col}" aria-label="${col}"></button>
              `).join("")}
              <span class="rx-ann-sep"></span>
              <div class="rx-ann-seg">
                ${RUDEX_ANNOTATOR_SIZES.map((sz) => {
                  const px = sz.id === "s" ? 5 : (sz.id === "l" ? 11 : 8);
                  return `<button type="button" class="rx-ann-tool-btn${st.sizeId === sz.id ? " is-active" : ""}" data-ann-size="${sz.id}" title="${sz.label}" style="width:28px;padding:0"><span class="rx-ann-dot-sz" style="width:${px}px;height:${px}px"></span></button>`;
                }).join("")}
              </div>
              <span class="rx-ann-sep"></span>
              <button type="button" class="rx-ann-tool-btn" data-ann-act="undo" ${st.strokes.length === 0 ? "disabled" : ""} title="Ctrl+Z">↶</button>
              <button type="button" class="rx-ann-tool-btn" data-ann-act="redo" ${st.redoStack.length === 0 ? "disabled" : ""} title="Ctrl+Y">↷</button>
              <button type="button" class="rx-ann-tool-btn" data-ann-act="clear" ${st.strokes.length === 0 ? "disabled" : ""} title="${ru ? "Очистить штрихи" : "Clear drawing"}">🗑</button>
            </div>

            <div class="rx-ann-group">
              ${!(st.sourceCtx && st.sourceCtx.sourceImgEl && st.baseImage) ? `
                <button type="button" class="btn btn-sm" data-ann-act="capture" title="${ru ? "Снять текущее окно Antigravity" : "Capture window"}">📷 ${ru ? "Снимок" : "Capture"}</button>
                <button type="button" class="btn btn-sm" data-ann-act="clipboard" title="${ru ? "Вставить картинку из буфера обмена" : "From clipboard"}">📋 ${ru ? "Буфер" : "Paste"}</button>
                <button type="button" class="btn btn-sm" data-ann-act="pick-file">📁 ${ru ? "Файл" : "File"}</button>
              ` : ""}
              <button type="button" class="icon-btn" data-ann-act="close" title="Esc">✕</button>
              <input type="file" accept="image/*" style="display:none" data-ann-role="fileInput"/>
            </div>
          </div>

          <div class="rx-ann-stage" data-ann-role="stage">
            ${st.baseImage ? `
              <div class="rx-ann-canvas-wrap">
                <canvas class="rx-ann-canvas" data-ann-role="canvas"></canvas>
              </div>
            ` : `
              <div class="rx-ann-empty">
                <div>${st.loading ? (ru ? "Загружаю скриншот…" : "Loading screenshot…") : (ru ? "Нажмите Ctrl+V, «📷 Снимок» или выберите файл, чтобы рисовать правки карандашом." : "Press Ctrl+V, click Capture, or pick a file to start drawing.")}</div>
              </div>
            `}
          </div>

          ${st.pendingTextPos ? `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 14px;border-top:1px solid var(--rx-border);background:var(--rx-surface)">
              <span style="font-size:11.5px;color:var(--rx-muted)">${ru ? "Подпись на скрин:" : "Text label:"}</span>
              <input type="text" class="text-input" style="flex:1" data-ann-role="textOverlayInput" placeholder="${ru ? "Введите текст и нажмите Enter…" : "Type text and press Enter…"}"/>
              <button type="button" class="btn btn-sm btn-primary" data-ann-act="commit-text">${ru ? "Добавить" : "Add"}</button>
              <button type="button" class="btn btn-sm" data-ann-act="cancel-text">✕</button>
            </div>
          ` : ""}

          <div class="rx-ann-footer">
            <div class="rx-ann-group">
              <div class="rx-ann-zoom-bar">
                <button type="button" class="rx-ann-tool-btn" data-ann-act="zoom-out" style="width:26px;height:24px;padding:0" title="${ru ? "Уменьшить" : "Zoom out"}">−</button>
                <button type="button" class="rx-ann-tool-btn" data-ann-act="zoom-reset" data-ann-role="zoomLabel" style="min-width:48px;height:24px;padding:0 6px;font-variant-numeric:tabular-nums" title="${ru ? "По размеру окна" : "Fit to window"}">${Math.round(st.zoom * 100)}%</button>
                <button type="button" class="rx-ann-tool-btn" data-ann-act="zoom-in" style="width:26px;height:24px;padding:0" title="${ru ? "Увеличить" : "Zoom in"}">+</button>
              </div>
              ${dimText ? `<span class="rx-ann-dims">${annEscapeHtml(dimText)}</span>` : ""}
            </div>
            ${st.statusMsg ? `<span style="font-size:11.5px;color:var(--rx-accent)">${annEscapeHtml(st.statusMsg)}</span>` : ""}
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
              <button type="button" class="btn btn-sm" data-ann-act="copy" ${st.baseImage ? "" : "disabled"}>📋 ${ru ? "Копировать" : "Copy"}</button>
              <button type="button" class="btn btn-sm btn-primary" data-ann-act="attach" ${st.baseImage ? "" : "disabled"}>✓ ${ru ? "Готово · Вставить в чат" : "Done · Attach"}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    canvasEl = mountEl.querySelector('[data-ann-role="canvas"]');
    stageEl = mountEl.querySelector('[data-ann-role="stage"]');
    fileInputEl = mountEl.querySelector('[data-ann-role="fileInput"]');
    if (canvasEl) {
      redrawCanvas();
      attachCanvasEvents();
      if (win && typeof win.requestAnimationFrame === "function") {
        win.requestAnimationFrame(() => fitCanvasDisplay());
      }
    }
    if (stageEl && typeof stageEl.addEventListener === "function") {
      stageEl.addEventListener("wheel", (ev) => {
        if (!st.baseImage || !ev) return;
        if (typeof ev.preventDefault === "function") ev.preventDefault();
        const delta = (ev.deltaY || 0) < 0 ? 0.15 : -0.15;
        st.zoom = Math.max(0.5, Math.min(4, Math.round((st.zoom + delta) * 100) / 100));
        fitCanvasDisplay();
      }, { passive: false });
    }
    if (fileInputEl) {
      fileInputEl.addEventListener("change", () => {
        const f = fileInputEl.files && fileInputEl.files[0];
        if (!f || typeof FileReader === "undefined") return;
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") loadImageDataUrl(reader.result);
        };
        reader.readAsDataURL(f);
      });
    }
  }

  function handleClick(e) {
    if (!st.open || !e || !e.target || typeof e.target.closest !== "function") return;
    const toolBtn = e.target.closest("[data-ann-tool]");
    if (toolBtn) {
      st.tool = toolBtn.getAttribute("data-ann-tool") || "pencil";
      st.pendingTextPos = null;
      render();
      return;
    }
    const colBtn = e.target.closest("[data-ann-color]");
    if (colBtn) {
      st.color = colBtn.getAttribute("data-ann-color") || "#ef4444";
      render();
      return;
    }
    const szBtn = e.target.closest("[data-ann-size]");
    if (szBtn) {
      st.sizeId = szBtn.getAttribute("data-ann-size") || "m";
      render();
      return;
    }
    const actEl = e.target.closest("[data-ann-act]");
    if (!actEl) return;
    const act = actEl.getAttribute("data-ann-act");
    if (act === "backdrop") {
      if (e.target === actEl) close();
    } else if (act === "close") close();
    else if (act === "undo") undo();
    else if (act === "redo") redo();
    else if (act === "clear") clearStrokes();
    else if (act === "zoom-in") { st.zoom = Math.min(4, Math.round((st.zoom + 0.25) * 100) / 100); fitCanvasDisplay(); }
    else if (act === "zoom-out") { st.zoom = Math.max(0.5, Math.round((st.zoom - 0.25) * 100) / 100); fitCanvasDisplay(); }
    else if (act === "zoom-reset") { st.zoom = 1; fitCanvasDisplay(); }
    else if (act === "capture") captureCleanWindow();
    else if (act === "clipboard") loadFromClipboard();
    else if (act === "pick-file" && fileInputEl) fileInputEl.click();
    else if (act === "copy") handleCopyOnly();
    else if (act === "attach") handleAttachToChat();
    else if (act === "send-live") handleSendLive();
    else if (act === "commit-text") {
      const inp = mountEl && mountEl.querySelector('[data-ann-role="textOverlayInput"]');
      commitPendingText(inp ? inp.value : "");
    } else if (act === "cancel-text") {
      st.pendingTextPos = null;
      render();
    }
  }

  function handleInput(e) {
    if (!st.open || !e || !e.target || typeof e.target.getAttribute !== "function") return;
    if (e.target.getAttribute("data-ann-role") === "noteInput") {
      st.noteText = e.target.value || "";
    }
  }

  function handleKeydown(e) {
    if (!st.open || !e) return false;
    const role = e.target && typeof e.target.getAttribute === "function" ? e.target.getAttribute("data-ann-role") : "";
    if (role === "textOverlayInput") {
      if (e.key === "Enter") {
        if (typeof e.preventDefault === "function") e.preventDefault();
        commitPendingText(e.target.value);
        return true;
      }
      if (e.key === "Escape") {
        st.pendingTextPos = null;
        render();
        return true;
      }
      return false;
    }
    if (e.key === "Escape") {
      close();
      return true;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      if (role === "noteInput") return false;
      if (typeof e.preventDefault === "function") e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
      return true;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y")) {
      if (role === "noteInput") return false;
      if (typeof e.preventDefault === "function") e.preventDefault();
      redo();
      return true;
    }
    return false;
  }

  function handlePaste(e) {
    if (!st.open || !e || !e.clipboardData) return false;
    const items = e.clipboardData.items;
    if (!items) return false;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i] && items[i].type && items[i].type.startsWith("image/")) {
        const blob = items[i].getAsFile();
        if (blob && typeof FileReader !== "undefined") {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === "string") loadImageDataUrl(reader.result);
          };
          reader.readAsDataURL(blob);
          if (typeof e.preventDefault === "function") e.preventDefault();
          return true;
        }
      }
    }
    return false;
  }

  if (mountEl && typeof mountEl.addEventListener === "function") {
    mountEl.addEventListener("click", handleClick);
    mountEl.addEventListener("input", handleInput);
  }

  return {
    open,
    close,
    isOpen,
    undo,
    redo,
    clearStrokes,
    loadImageDataUrl,
    handleKeydown,
    handlePaste,
    fitCanvasDisplay,
    getState: () => st,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    RUDEX_ANNOTATOR_COLORS,
    RUDEX_ANNOTATOR_TOOLS,
    RUDEX_ANNOTATOR_SIZES,
    annDrawStroke,
    createScreenshotAnnotator,
  };
}
