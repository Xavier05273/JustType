// js/carousel.js — 首頁關卡模式 3D 慣性輪播

export function createCarousel(options = {}) {
  const {
    viewport,
    modeGrid,
    dotsContainer,
    prevBtn,
    nextBtn,
    modes,
    onSelect,
    onNavigate,
  } = options;

  let carousel = {
    cards: [],
    pos: 0,
    target: 0,
    selected: 0,
    dragging: false,
    dragStartX: 0,
    dragStartPos: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
    raf: null,
    wheelLockedUntil: 0,
  };

  function carouselSpacing() {
    const card = carousel.cards[0];
    const w = card ? card.offsetWidth : 320;
    return Math.max(180, w * 0.88);
  }

  function queueCarouselFrame() {
    if (carousel.raf == null) {
      carousel.raf = requestAnimationFrame(carouselFrame);
    }
  }

  function carouselFrame() {
    if (!carousel.dragging) {
      const diff = carousel.target - carousel.pos;
      if (Math.abs(diff) > 0.0008) {
        carousel.pos += diff * 0.16;
      } else {
        carousel.pos = carousel.target;
      }
    }
    paintCarousel();
    const settled = !carousel.dragging && Math.abs(carousel.target - carousel.pos) <= 0.0008;
    carousel.raf = settled ? null : requestAnimationFrame(carouselFrame);
  }

  function paintCarousel() {
    const { cards, pos } = carousel;
    const spacing = carouselSpacing();
    cards.forEach((card, i) => {
      const off = i - pos;
      const ao = Math.abs(off);
      const rot = Math.max(-60, Math.min(60, -off * 42));
      const z = -Math.min(ao * 180, 400);
      const scale = Math.max(0.6, 1 - 0.19 * ao);
      const opacity = Math.max(0.12, 1 - 0.34 * ao);
      card.style.transform =
        `translate(-50%,-50%) translateX(${(off * spacing).toFixed(1)}px) ` +
        `translateZ(${z.toFixed(1)}px) rotateY(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity = opacity.toFixed(2);
      card.style.zIndex = String(100 - Math.round(ao * 10));
      card.style.visibility = opacity < 0.16 ? "hidden" : "visible";
      card.style.pointerEvents = ao <= 1.6 ? "auto" : "none";
      card.classList.toggle("is-center", ao < 0.5);
      const glare = card.querySelector(".mode-glare");
      if (glare) glare.style.opacity = ao < 0.5 ? "1" : Math.max(0, 0.4 - ao * 0.2).toFixed(2);
    });

    const sel = Math.max(0, Math.min(cards.length - 1, Math.round(pos)));
    if (sel !== carousel.selected) {
      carousel.selected = sel;
      const card = cards[sel];
      if (card) {
        card.classList.remove("just-centered");
        void card.offsetWidth;
        card.classList.add("just-centered");
      }
      if (typeof onNavigate === "function") {
        onNavigate(sel, modes[sel]);
      }
    }
    if (dotsContainer) {
      Array.from(dotsContainer.children).forEach((d, i) =>
        d.classList.toggle("active", i === carousel.selected));
    }
    if (prevBtn) prevBtn.disabled = carousel.selected <= 0;
    if (nextBtn) nextBtn.disabled = carousel.selected >= cards.length - 1;
  }

  function setTarget(idx) {
    carousel.target = Math.max(0, Math.min(carousel.cards.length - 1, idx));
    if (typeof onNavigate === "function") {
      onNavigate(carousel.target, modes[carousel.target]);
    }
    queueCarouselFrame();
  }

  function bindEvents() {
    if (!viewport || viewport.dataset.bound) return;
    viewport.dataset.bound = "1";

    viewport.addEventListener("pointerdown", (e) => {
      carousel.dragging = true;
      carousel.moved = false;
      carousel.dragStartX = e.clientX;
      carousel.dragStartPos = carousel.pos;
      carousel.lastX = e.clientX;
      carousel.lastT = performance.now();
      carousel.velocity = 0;
      viewport.classList.add("dragging");
    });

    window.addEventListener("pointermove", (e) => {
      if (!carousel.dragging) return;
      const spacing = carouselSpacing();
      const dx = e.clientX - carousel.dragStartX;
      if (Math.abs(dx) > 6) carousel.moved = true;
      const max = carousel.cards.length - 1;
      let raw = carousel.dragStartPos - dx / spacing;
      if (raw < 0) raw *= 0.3;
      else if (raw > max) raw = max + (raw - max) * 0.3;
      carousel.pos = raw;
      const now = performance.now();
      const dt = Math.max(1, now - carousel.lastT) / 1000;
      carousel.velocity = (-(e.clientX - carousel.lastX) / spacing) / dt;
      carousel.lastX = e.clientX;
      carousel.lastT = now;
      queueCarouselFrame();
    });

    const endDrag = () => {
      if (!carousel.dragging) return;
      carousel.dragging = false;
      viewport.classList.remove("dragging");
      if (carousel.moved) {
        const projected = carousel.pos + carousel.velocity * 0.18;
        setTarget(Math.round(projected));
        queueCarouselFrame();
      }
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    viewport.addEventListener("wheel", (e) => {
      const now = performance.now();
      if (now < carousel.wheelLockedUntil) return;
      const delta = e.deltaY + e.deltaX;
      if (Math.abs(delta) < 4) return;
      carousel.wheelLockedUntil = now + 400;
      if (delta > 0) setTarget(carousel.selected + 1);
      else setTarget(carousel.selected - 1);
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener("click", () => setTarget(carousel.selected - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => setTarget(carousel.selected + 1));
  }

  return {
    carousel,
    setTarget,
    bindEvents,
    queueCarouselFrame,
    paintCarousel,
  };
}
