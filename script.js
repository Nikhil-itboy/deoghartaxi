/* ============================================================
   TaxiDeoghar.com — site interactions
   ============================================================ */

(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canAnimate = Boolean(window.gsap && window.ScrollTrigger && !reducedMotion);
  let hasInitialized = false;

  function initPreloader() {
    const preloader = $("#preloader");
    if (!preloader) {
      initSite();
      return;
    }

    const finish = () => {
      if (preloader.dataset.dismissed) return;
      preloader.dataset.dismissed = "true";

      if (canAnimate) {
        window.gsap.timeline()
          .to($(".preloader-fill", preloader), { width: "100%", duration: 0.2 })
          .to($(".preloader-tagline", preloader), { opacity: 1, duration: 0.4 })
          .to($(".preloader-inner", preloader), { opacity: 0, y: -20, duration: 0.35, delay: 0.3 })
          .to(preloader, {
            opacity: 0,
            duration: 0.35,
            onComplete: () => {
              preloader.remove();
              initSite();
            },
          });
        return;
      }

      preloader.classList.add("is-hidden");
      window.setTimeout(() => {
        preloader.remove();
        initSite();
      }, 250);
    };

    if (document.readyState === "complete") {
      window.setTimeout(finish, 150);
    } else {
      window.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 3000);
    }
  }

  function initSite() {
    if (hasInitialized) return;
    hasInitialized = true;

    initCursor();
    initNavigation();
    initSmoothScroll();
    initHeroSlider();
    initBookingForm();
    initStats();
    initCopyrightYear();
    initRevealAnimations();
    initRoadCar();
    initTestimonialSlider();
    initBlogSlider();
  }

  function initCursor() {
    const cursor = $("#cursor");
    if (!cursor || !window.matchMedia("(pointer: fine)").matches) return;

    document.body.classList.add("has-custom-cursor");
    document.addEventListener("pointermove", (event) => {
      cursor.style.transform = "translate(" + event.clientX + "px, " + event.clientY + "px)";
    }, { passive: true });
  }

  function initNavigation() {
    const nav = $("#nav");
    const toggle = $("#navToggle");
    const menu = $("#mobileMenu");

    if (nav) {
      const updateNav = () => nav.classList.toggle("scrolled", window.scrollY > 48);
      updateNav();
      window.addEventListener("scroll", updateNav, { passive: true });
    }

    if (!toggle || !menu) return;

    const closeMenu = () => {
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
      document.body.classList.remove("menu-open");
    };

    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("open");
      toggle.classList.toggle("active", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("menu-open", isOpen);
    });

    $$("a", menu).forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const selector = anchor.getAttribute("href");
        if (!selector || selector === "#") return;

        const target = $(selector);
        if (!target) return;

        event.preventDefault();
        const navHeight = $("#nav")?.offsetHeight || 0;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion ? "auto" : "smooth" });
      });
    });
  }

  function initHeroSlider() {
    const hero = $("#hero");
    const slides = $$(".hero-bg-media");
    const slideContents = $$(".hero-slide-content");
    const dots = $$(".hero-slider-dots .h-dot");
    const previous = $(".hero-arrow-left");
    const next = $(".hero-arrow-right");
    if (!hero || slides.length < 2) return;

    let activeIndex = Math.max(slides.findIndex((slide) => slide.classList.contains("active")), 0);
    let timer;
    let touchStartX = 0;

    const setSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === activeIndex);
      });
      slideContents.forEach((content, contentIndex) => {
        content.classList.toggle("active", contentIndex === activeIndex);
      });
      dots.forEach((dot, dotIndex) => {
        const selected = dotIndex === activeIndex;
        dot.classList.toggle("active", selected);
        dot.setAttribute("aria-pressed", String(selected));
      });
    };

    const stopAutoPlay = () => {
      window.clearInterval(timer);
      timer = undefined;
    };

    const startAutoPlay = () => {
      if (reducedMotion) return;
      stopAutoPlay();
      timer = window.setInterval(() => setSlide(activeIndex + 1), 7000);
    };

    previous?.addEventListener("click", () => {
      setSlide(activeIndex - 1);
      startAutoPlay();
    });
    next?.addEventListener("click", () => {
      setSlide(activeIndex + 1);
      startAutoPlay();
    });
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        setSlide(index);
        startAutoPlay();
      });
    });

    hero.addEventListener("pointerenter", stopAutoPlay);
    hero.addEventListener("pointerleave", startAutoPlay);
    hero.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0]?.screenX || 0;
    }, { passive: true });
    hero.addEventListener("touchend", (event) => {
      const distance = touchStartX - (event.changedTouches[0]?.screenX || 0);
      if (Math.abs(distance) < 45) return;
      setSlide(activeIndex + (distance > 0 ? 1 : -1));
      startAutoPlay();
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoPlay();
      else startAutoPlay();
    });

    setSlide(activeIndex);
    startAutoPlay();
  }

  function initBookingForm() {
    const form = $("#bookingForm");
    const tabs = $$(".booking-tab");
    const pickup = $("#pickupLocation");
    const drop = $("#dropLocation");
    const dropLabel = $("#dropLocationLabel");
    const travelDate = $("#travelDate");
    const status = $("#bookingStatus");
    if (!form || !pickup || !drop || !travelDate || !status) return;

    const tripModes = {
      oneway: { label: "One Way", destinationLabel: "To", destinationPlaceholder: "Enter drop location" },
      roundtrip: { label: "Round Trip", destinationLabel: "To", destinationPlaceholder: "Enter destination" },
      local: { label: "Local Trip", destinationLabel: "Area", destinationPlaceholder: "Enter area or locality" },
    };
    let selectedMode = "oneway";

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return year + "-" + month + "-" + day;
    };

    const showStatus = (message, kind = "") => {
      status.textContent = message;
      status.className = "booking-status" + (kind ? " is-" + kind : "");
    };

    const selectMode = (mode) => {
      if (!tripModes[mode]) return;
      selectedMode = mode;
      form.dataset.tripType = mode;
      tabs.forEach((tab) => {
        const active = tab.dataset.tab === mode;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      });
      if (dropLabel) dropLabel.textContent = tripModes[mode].destinationLabel;
      drop.placeholder = tripModes[mode].destinationPlaceholder;
      showStatus("");
    };

    travelDate.min = formatDate(new Date());
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => selectMode(tab.dataset.tab));
    });

    [pickup, drop, travelDate].forEach((input) => {
      input.addEventListener("input", () => {
        input.removeAttribute("aria-invalid");
        if (status.classList.contains("is-error")) showStatus("");
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = [pickup, drop, travelDate];
      const missingInput = values.find((input) => !input.value.trim());

      if (missingInput) {
        values.forEach((input) => input.toggleAttribute("aria-invalid", !input.value.trim()));
        showStatus("Please enter your pickup, destination and travel date.", "error");
        missingInput.focus();
        return;
      }

      const selectedDate = new Date(travelDate.value + "T00:00:00");
      const message = [
        "Hello TaxiDeoghar, I would like to book a taxi.",
        "Trip type: " + tripModes[selectedMode].label,
        "Pickup: " + pickup.value.trim(),
        tripModes[selectedMode].destinationLabel + ": " + drop.value.trim(),
        "Travel date: " + selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      ].join("\n");
      const number = form.dataset.whatsappNumber?.replace(/\D/g, "");

      if (!number) {
        showStatus("Booking contact details are not configured yet. Please call us directly.", "error");
        return;
      }

      showStatus("Opening WhatsApp with your booking details…", "success");
      window.open("https://wa.me/" + number + "?text=" + encodeURIComponent(message), "_blank", "noopener");
    });

    selectMode(selectedMode);
  }

  function initStats() {
    const stats = $$(".stat[data-target]");
    if (!stats.length) return;

    const animateStat = (stat) => {
      if (stat.dataset.animated) return;
      stat.dataset.animated = "true";
      const output = $(".stat-count", stat);
      const target = Number(stat.dataset.target || 0);
      if (!output || !Number.isFinite(target)) return;
      if (reducedMotion) {
        output.textContent = String(target);
        return;
      }

      const startTime = performance.now();
      const duration = 1500;
      const update = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        output.textContent = Math.round(target * eased).toLocaleString("en-IN");
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    if (!("IntersectionObserver" in window)) {
      stats.forEach(animateStat);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateStat(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    stats.forEach((stat) => observer.observe(stat));
  }

  function initCopyrightYear() {
    const year = $("#copyrightYear");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  function initRevealAnimations() {
    if (!canAnimate) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const revealGroups = [
      { selector: ".why-feature", trigger: ".why-features" },
      { selector: ".fleet-card", trigger: ".fleet-grid" },
      { selector: ".stat", trigger: ".stats-inner" },
    ];

    revealGroups.forEach(({ selector, trigger }) => {
      if (!$(selector) || !$(trigger)) return;
      gsap.set(selector, { opacity: 0, y: 28 });
      window.gsap.to(selector, {
        scrollTrigger: { trigger, start: "top 90%", toggleActions: "play none none none" },
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    });
  }

  function initRoadCar() {
    const car = $("#roadCar");
    if (!car) return;

    const moveCar = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const progress = Math.min(scrolled / scrollHeight, 1);
      const maxLeft = window.innerWidth - car.offsetWidth;
      car.style.left = (progress * maxLeft) + "px";
    };

    window.addEventListener("scroll", moveCar, { passive: true });
    moveCar();
  }

  function initTestimonialSlider() {
    const slider = $(".testimonial-slider");
    const track = $(".testimonial-track");
    const slides = $$(".testimonial-slide");
    const dots = $$(".testimonial-dots .t-dot");
    const prev = $(".t-nav-prev");
    const next = $(".t-nav-next");
    if (!slider || !track || slides.length < 2) return;

    const total = slides.length;
    let current = Math.max(slides.findIndex((s) => s.classList.contains("active")), 0);
    if (current < 0) current = 0;
    let timer;
    let isAnimating = false;

    const getOffset = () => {
      const w = window.innerWidth;
      if (w <= 480) return Math.min(170, w * 0.42);
      if (w <= 768) return Math.min(220, w * 0.38);
      if (w <= 1024) return 300;
      if (w <= 1280) return 360;
      return 400;
    };

    const getHiddenOffset = () => getOffset() * 2.2;

    const setActiveClass = (index) => {
      slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
      dots.forEach((dot, i) => {
        const sel = i === index;
        dot.classList.toggle("active", sel);
        dot.setAttribute("aria-pressed", String(sel));
      });
    };

    const applyPositions = (nextIndex, animate) => {
      const offset = getOffset();
      const hiddenOffset = getHiddenOffset();
      const canGsap = Boolean(window.gsap && !reducedMotion);
      const duration = 0.85;
      const ease = "power3.inOut";

      slides.forEach((slide, i) => {
        let x = 0;
        let scale = 0.7;
        let opacity = 0;
        let blur = 8;
        let z = 1;
        let pointer = "none";

        const diff = (i - nextIndex + total) % total;
        const revDiff = (nextIndex - i + total) % total;
        let pos = 0;
        if (i === nextIndex) {
          pos = 0;
          x = 0; scale = 1; opacity = 1; blur = 0; z = 10; pointer = "auto";
        } else if (diff === 1) {
          // next
          x = offset; scale = 0.82; opacity = 0.45; blur = 6; z = 2;
        } else if (revDiff === 1) {
          // prev
          x = -offset; scale = 0.82; opacity = 0.45; blur = 6; z = 2;
        } else if (diff === 2 || revDiff === 2) {
          // second neighbours - pushed far, faint
          x = diff === 2 ? hiddenOffset : -hiddenOffset;
          scale = 0.74; opacity = 0.0; blur = 8; z = 1;
        } else {
          x = diff < total/2 ? hiddenOffset : -hiddenOffset;
          scale = 0.7; opacity = 0; blur = 8; z = 1;
        }

        const target = {
          x: x,
          xPercent: -50,
          yPercent: -50,
          scale: scale,
          opacity: opacity,
          filter: "blur(" + blur + "px)",
          zIndex: z,
        };

        if (animate && canGsap) {
          window.gsap.to(slide, {
            ...target,
            duration: duration,
            ease: ease,
            overwrite: "auto",
            onStart: () => { slide.style.pointerEvents = "none"; },
            onComplete: () => { slide.style.pointerEvents = pointer; }
          });
        } else {
          if (window.gsap) {
            window.gsap.set(slide, target);
            slide.style.pointerEvents = pointer;
          } else {
            slide.style.transform = "translate(" + x + "px, -50%) translateX(-50%) scale(" + scale + ")";
            slide.style.opacity = String(opacity);
            slide.style.filter = "blur(" + blur + "px)";
            slide.style.zIndex = String(z);
            slide.style.pointerEvents = pointer;
          }
        }
      });
    };

    const goTo = (index, animate) => {
      if (isAnimating) return;
      const nextIdx = (index + total) % total;
      if (nextIdx === current && animate) return;
      if (animate && window.gsap && !reducedMotion) {
        isAnimating = true;
        current = nextIdx;
        setActiveClass(current);
        applyPositions(current, true);
        window.setTimeout(() => { isAnimating = false; }, 900);
      } else {
        current = nextIdx;
        setActiveClass(current);
        applyPositions(current, false);
      }
    };

    const autoplay = () => {
      window.clearInterval(timer);
      if (reducedMotion) return;
      timer = window.setInterval(() => goTo(current + 1, true), 6000);
    };
    const stop = () => window.clearInterval(timer);

    prev?.addEventListener("click", () => { goTo(current - 1, true); autoplay(); });
    next?.addEventListener("click", () => { goTo(current + 1, true); autoplay(); });
    dots.forEach((dot, i) => dot.addEventListener("click", () => { if (i !== current) { goTo(i, true); autoplay(); }}));
    slides.forEach((slide) => slide.addEventListener("click", () => {
      const i = Number(slide.dataset.index);
      if (!Number.isNaN(i) && i !== current) { goTo(i, true); autoplay(); }
    }));

    // keyboard
    slider.setAttribute("tabindex", "0");
    slider.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1, true); autoplay(); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current + 1, true); autoplay(); }
    });

    // swipe
    let startX = 0;
    let dx = 0;
    slider.addEventListener("touchstart", (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
    slider.addEventListener("touchend", (e) => {
      dx = e.changedTouches[0].screenX - startX;
      if (Math.abs(dx) > 44) {
        goTo(current + (dx < 0 ? 1 : -1), true);
        autoplay();
      }
    }, { passive: true });
    slider.addEventListener("pointerenter", stop);
    slider.addEventListener("pointerleave", autoplay);
    slider.addEventListener("focusin", stop);
    slider.addEventListener("focusout", autoplay);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop(); else autoplay();
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => applyPositions(current, false), 120);
    });

    // init
    setActiveClass(current);
    applyPositions(current, false);
    // ensure GSAP initial render correct
    requestAnimationFrame(() => applyPositions(current, false));
    autoplay();
  }

  function initBlogSlider() {
    const slider = $(".blog-slider");
    const track = $(".blog-track");
    const cards = $$(".blog-card", track);
    const dotsWrap = $(".blog-dots");
    const prev = $(".b-nav-prev");
    const next = $(".b-nav-next");
    if (!slider || !track || cards.length === 0) return;

    let current = 0;
    let timer;
    let perView = 3;

    const updatePerView = () => {
      const w = window.innerWidth;
      if (w <= 768) perView = 1;
      else if (w <= 1200) perView = 2;
      else perView = 3;
    };

    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      const pages = Math.max(1, Math.ceil(cards.length / perView));
      for (let i = 0; i < pages; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "b-dot" + (i === Math.floor(current / perView) ? " active" : "");
        b.setAttribute("aria-label", "Blog page " + (i + 1));
        b.setAttribute("aria-pressed", String(i === Math.floor(current / perView)));
        b.addEventListener("click", () => { goTo(i * perView); autoplay(); });
        dotsWrap.appendChild(b);
      }
    };

    const update = () => {
      const gap = 28;
      const cardW = cards[0].getBoundingClientRect().width + gap;
      const maxIndex = Math.max(0, cards.length - perView);
      if (current > maxIndex) current = maxIndex;
      if (current < 0) current = 0;
      const x = -(current * cardW);
      if (window.gsap && !reducedMotion) {
        window.gsap.to(track, { x: x, duration: 0.6, ease: "power3.inOut", overwrite: "auto" });
      } else {
        track.style.transform = "translateX(" + x + "px)";
      }
      // dots
      if (dotsWrap) {
        const activePage = Math.floor(current / perView);
        $$(".b-dot", dotsWrap).forEach((d, i) => {
          const on = i === activePage;
          d.classList.toggle("active", on);
          d.setAttribute("aria-pressed", String(on));
        });
      }
      // nav disabled state
      if (prev) prev.style.opacity = current === 0 ? "0.35" : "1";
      if (next) next.style.opacity = current >= maxIndex ? "0.35" : "1";
    };

    const goTo = (idx) => {
      const maxIndex = Math.max(0, cards.length - perView);
      current = Math.max(0, Math.min(idx, maxIndex));
      update();
    };

    const autoplay = () => {
      window.clearInterval(timer);
      if (reducedMotion) return;
      timer = window.setInterval(() => {
        const maxIndex = Math.max(0, cards.length - perView);
        let nxt = current + perView;
        if (nxt > maxIndex) nxt = 0;
        goTo(nxt);
      }, 5000);
    };
    const stop = () => window.clearInterval(timer);

    prev?.addEventListener("click", () => { goTo(current - perView); autoplay(); });
    next?.addEventListener("click", () => { goTo(current + perView); autoplay(); });

    let sx = 0;
    track.addEventListener("touchstart", (e) => { sx = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].screenX - sx;
      if (Math.abs(dx) > 40) {
        if (dx < 0) goTo(current + perView); else goTo(current - perView);
        autoplay();
      }
    }, { passive: true });

    slider.addEventListener("pointerenter", stop);
    slider.addEventListener("pointerleave", autoplay);
    document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else autoplay(); });

    let rt;
    window.addEventListener("resize", () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => {
        const oldPerView = perView;
        updatePerView();
        if (oldPerView !== perView) { buildDots(); current = Math.floor(current / oldPerView) * perView; }
        update();
      }, 120);
    });

    updatePerView();
    buildDots();
    update();
    autoplay();
  }

  initPreloader();
})();
