(function () {
  'use strict';

  // ── Toast ──
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2000);
  }

  // ── Theme toggle + Giscus theme sync ──
  let pendingGiscusTheme = null;
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://giscus.app') return;
    if (pendingGiscusTheme) {
      const frame = document.querySelector('iframe.giscus-frame');
      if (frame) {
        frame.contentWindow.postMessage({ giscus: { setConfig: { theme: pendingGiscusTheme } } }, 'https://giscus.app');
        pendingGiscusTheme = null;
      }
    }
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      const container = document.getElementById('giscus-container');
      const giscusTheme = container && (next === 'light' ? container.dataset.themeLight : container.dataset.themeDark);
      if (giscusTheme) {
        const giscusFrame = document.querySelector('iframe.giscus-frame');
        if (giscusFrame) {
          giscusFrame.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme } } }, 'https://giscus.app');
        } else {
          pendingGiscusTheme = giscusTheme;
        }
      }
    });
  }

  // ── Giscus loader + expand/collapse ──
  const giscusToggle = document.getElementById('giscus-toggle');
  const giscusContainer = document.getElementById('giscus-container');
  if (giscusToggle && giscusContainer) {
    const theme = localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const giscusTheme = theme === 'light' ? giscusContainer.dataset.themeLight : giscusContainer.dataset.themeDark;
    const s = document.createElement('script');
    s.src = 'https://giscus.app/client.js';
    s.setAttribute('data-repo', giscusContainer.dataset.repo);
    s.setAttribute('data-repo-id', giscusContainer.dataset.repoId);
    s.setAttribute('data-category', giscusContainer.dataset.category);
    s.setAttribute('data-category-id', giscusContainer.dataset.categoryId);
    s.setAttribute('data-mapping', 'pathname');
    s.setAttribute('data-strict', '0');
    s.setAttribute('data-reactions-enabled', '1');
    s.setAttribute('data-emit-metadata', '0');
    s.setAttribute('data-input-position', 'bottom');
    s.setAttribute('data-theme', giscusTheme);
    s.setAttribute('data-lang', 'en');
    s.setAttribute('crossorigin', 'anonymous');
    s.async = true;
    giscusContainer.appendChild(s);
    giscusToggle.addEventListener('click', () => {
      const expanded = giscusToggle.getAttribute('aria-expanded') === 'true';
      giscusToggle.setAttribute('aria-expanded', String(!expanded));
      giscusContainer.classList.toggle('is-open', !expanded);
    });
  }

  // ── Copy link button ──
  const copyLink = document.getElementById('copy-link-btn');
  if (copyLink) {
    copyLink.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        copyLink.classList.add('copied');
        setTimeout(() => copyLink.classList.remove('copied'), 2000);
        showToast('Link copied!');
      });
    });
  }

  // ── TOC floating button ──
  const tocBtn = document.getElementById('toc-float-btn');
  const tocPanel = document.getElementById('toc-float-panel');
  if (tocBtn && tocPanel) {
    const closeToc = () => {
      tocPanel.classList.remove('is-open');
      tocPanel.setAttribute('aria-hidden', 'true');
      tocBtn.setAttribute('aria-expanded', 'false');
    };
    tocBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = tocPanel.classList.toggle('is-open');
      tocPanel.setAttribute('aria-hidden', String(!open));
      tocBtn.setAttribute('aria-expanded', String(open));
    });
    tocPanel.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', closeToc));
    document.addEventListener('click', (e) => {
      const tocFloat = document.getElementById('toc-float');
      if (tocFloat && !tocFloat.contains(e.target)) closeToc();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeToc(); });
  }

  // ── TOC sidebar scroll spy ──
  const sidebar = document.querySelector('.toc-sidebar');
  if (sidebar) {
    const links = Array.from(sidebar.querySelectorAll('nav > ul > li > a'));
    if (links.length) {
      const headings = links
        .map((a) => ({ el: document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))), a }))
        .filter((h) => h.el);
      if (headings.length) {
        const updateActive = () => {
          const scrollY = window.scrollY + 120;
          let active = headings[0];
          for (let i = 0; i < headings.length; i++) {
            if (headings[i].el.offsetTop <= scrollY) active = headings[i];
          }
          links.forEach((a) => a.classList.remove('toc-active'));
          active.a.classList.add('toc-active');
        };
        window.addEventListener('scroll', updateActive, { passive: true });
        updateActive();
      }
    }
  }

  // ── Service worker registration ──
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  // ── Back to top ──
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 300);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── Code copy buttons ──
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const codeBlock = btn.closest('.code-block');
      const pre = codeBlock && codeBlock.querySelector('pre');
      if (!pre) return;
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 2000);
        showToast('Code copied!');
      });
    });
  });

  // ── Lightbox ──
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbSvg = document.getElementById('lightbox-svg');
  if (lb && lbImg && lbSvg) {
    const openImg = (src, alt) => {
      lbImg.src = src;
      lbImg.alt = alt || '';
      lbImg.style.display = '';
      lbSvg.style.display = 'none';
      lbSvg.innerHTML = '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const openSvg = (svgNode) => {
      lbSvg.innerHTML = '';
      lbSvg.appendChild(svgNode);
      lbSvg.style.display = 'flex';
      lbImg.style.display = 'none';
      lbImg.src = '';
      lb.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    };
    const closeLb = () => {
      lb.classList.remove('is-open');
      document.body.style.overflow = '';
      lbImg.src = '';
      lbSvg.innerHTML = '';
      lbSvg.style.display = 'none';
      lbImg.style.display = '';
    };

    document.querySelectorAll('.lightbox-trigger').forEach((el) => {
      el.addEventListener('click', () => openImg(el.dataset.src, el.dataset.alt));
    });

    document.querySelectorAll('.diagram-clickable').forEach((fig) => {
      const trigger = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        let inner = fig.querySelector(theme === 'light' ? '.diagram-light' : '.diagram-dark');
        if (!inner) inner = fig.querySelector('.diagram-inner');
        if (!inner) return;
        const svg = inner.querySelector('svg');
        if (!svg) return;
        const clone = svg.cloneNode(true);
        const vb = clone.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/[\s,]+/);
          const vw = parseFloat(parts[2]);
          const vh = parseFloat(parts[3]);
          if (vw && vh) {
            const maxW = window.innerWidth * 0.9;
            const maxH = window.innerHeight * 0.85;
            const scale = Math.min(maxW / vw, maxH / vh, 1);
            clone.setAttribute('width', Math.round(vw * scale));
            clone.setAttribute('height', Math.round(vh * scale));
          }
        }
        openSvg(clone);
      };
      fig.addEventListener('click', trigger);
      fig.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
      });
    });

    document.getElementById('lightbox-close').addEventListener('click', closeLb);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  }
  // ── Non-breaking hyphens ──
  // Replace plain hyphens in prose text with U+2011 (non-breaking hyphen)
  // so hyphenated words are never split across lines.
  // Skips code, pre, script, style, links, and math elements.
  function makeHyphensNonBreaking() {
    const root = document.getElementById('main-content') || document.body;
    const SKIP = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'A', 'TEXTAREA', 'INPUT']);
    const NBHY = '\u2011';
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent.includes('-')) return NodeFilter.FILTER_REJECT;
        const blocked = node.parentElement && node.parentElement.closest(
          'code, pre, script, style, a, textarea, input, .math, .katex'
        );
        return blocked ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      node.textContent = node.textContent.replace(/-/g, NBHY);
    }
  }

  document.addEventListener('DOMContentLoaded', makeHyphensNonBreaking);
})();
