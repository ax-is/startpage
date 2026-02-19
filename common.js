const STORAGE_KEYS = {
  CONFIG: 'startpageConfig',
  BOOKMARKS: 'startpageBookmarks'
};

const DEFAULT_CONFIG = {
  backgroundColor: '#0a0e1a',
  textColor: '#e0e0e0',
  accentColor: '#4a9eff',
  searchEngine: 'https://www.google.com/search?q=',
  backgroundImage: '',
  backgroundBlur: 0,
  bgAnimation: 'globe',
  asciiColor: '#4a9eff',
  asciiOpacity: 12,
  userName: 'axis',
  customGreeting: '',
  textColor2: '#cccccc',
  quoteInterval: 30,
  quoteFile: '',
  quoteFileName: '',
  maskColor: '#000000',
  maskOpacity: 60,
  tabName: 'Orbit',
  asciiSpeed: 50
};

const DEFAULT_BOOKMARKS = [
  { "name": "GitHub", "url": "https://github.com", "tags": ["dev", "code"] },
  { "name": "Google", "url": "https://google.com", "tags": ["search"] },
  { "name": "YouTube", "url": "https://youtube.com", "tags": ["video", "entertainment"] },
  { "name": "Reddit", "url": "https://reddit.com", "tags": ["social"] }
];

async function loadSharedData() {
  let config = { ...DEFAULT_CONFIG };
  let bookmarks = [...DEFAULT_BOOKMARKS];

  const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
  const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);

  if (savedConfig) {
    try { config = { ...config, ...JSON.parse(savedConfig) }; } catch (e) { }
  }
  if (savedBookmarks) {
    try { bookmarks = JSON.parse(savedBookmarks); } catch (e) { }
  }

  if (!savedConfig || !savedBookmarks) {
    try {
      const response = await fetch('data.json');
      if (response.ok) {
        const data = await response.json();
        if (!savedConfig && data.config) config = { ...config, ...data.config };
        if (!savedBookmarks && data.bookmarks) bookmarks = data.bookmarks;
      }
    } catch (error) {
      console.error('Failed to load data.json:', error);
    }
  }

  return { config, bookmarks };
}

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 7) return `rgba(74, 158, 255, ${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applySharedTheme(config, pageType) {
  const root = document.documentElement;
  root.style.setProperty('--color-bg', config.backgroundColor);
  root.style.setProperty('--color-fg', config.textColor);
  root.style.setProperty('--color-accent', config.accentColor);

  document.body.style.backgroundColor = config.backgroundColor;
  document.body.style.color = config.textColor;

  if (config.tabName) {
    document.title = config.tabName;
  } else {
    document.title = 'Orbit';
  }

  let bgStyleEl = document.getElementById('background-style');
  let bgMaskEl = document.getElementById('background-mask');
  let bgOverlayEl = document.getElementById('bg-overlay');
  let textShadowEl = document.getElementById('text-shadow-style');

  if (pageType === 'config') {
    document.body.style.backgroundImage = 'none';
    if (bgStyleEl) bgStyleEl.remove();
    if (bgMaskEl) bgMaskEl.remove();
    if (bgOverlayEl) bgOverlayEl.remove();
    if (textShadowEl) textShadowEl.remove();
    return;
  }

  if (config.backgroundImage) {
    const blur = config.backgroundBlur || 0;
    const filterValue = blur > 0 ? `blur(${blur}px)` : 'none';

    if (!bgStyleEl) {
      bgStyleEl = document.createElement('style');
      bgStyleEl.id = 'background-style';
      document.head.appendChild(bgStyleEl);
    }
    bgStyleEl.textContent = `
      body::before {
        content: '';
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background-image: url('${config.backgroundImage}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: ${filterValue};
        z-index: -2;
      }
    `;
    document.body.style.backgroundImage = 'none';

    if (pageType === 'index') {
      if (!bgOverlayEl) {
        bgOverlayEl = document.createElement('style');
        bgOverlayEl.id = 'bg-overlay';
        document.head.appendChild(bgOverlayEl);
      }
      bgOverlayEl.textContent = `
        body::after {
          content: '';
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0, 0, 0, 0.55);
          z-index: -1;
          pointer-events: none;
        }
      `;
      if (!textShadowEl) {
        textShadowEl = document.createElement('style');
        textShadowEl.id = 'text-shadow-style';
        document.head.appendChild(textShadowEl);
      }
      textShadowEl.textContent = `
        body, pre, input, .result-item, .category-header, .bookmark {
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
        ::placeholder { text-shadow: none; }
      `;
    } else if (pageType === 'bookmarks') {
      const maskOpacity = (config.maskOpacity || 60) / 100;
      if (maskOpacity > 0) {
        if (!bgMaskEl) {
          bgMaskEl = document.createElement('div');
          bgMaskEl.id = 'background-mask';
          document.body.appendChild(bgMaskEl);
        }
        Object.assign(bgMaskEl.style, {
          position: 'fixed', top: '0', left: '0',
          width: '100%', height: '100%',
          backgroundColor: config.maskColor || '#000000',
          opacity: maskOpacity.toString(),
          zIndex: '-1', pointerEvents: 'none'
        });
      } else if (bgMaskEl) {
        bgMaskEl.remove();
      }
    }
  } else {
    document.body.style.backgroundImage = 'none';
    if (bgStyleEl) bgStyleEl.remove();
    if (bgMaskEl) bgMaskEl.remove();
    if (bgOverlayEl) bgOverlayEl.remove();
    if (textShadowEl) textShadowEl.remove();
  }
}
