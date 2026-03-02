const STORAGE_KEYS = {
  CONFIG: 'startpageConfig',
  BOOKMARKS: 'startpageBookmarks'
};

// ICON_BRAND_COLORS is used globally by script.js — common.js must be loaded first.
const ICON_BRAND_COLORS = {
  github: '#ffffff',
  youtube: '#FF0000',
  google: '#4285F4',
  reddit: '#FF4500',
  twitter: '#1DA1F2',
  x: '#ffffff',
  openai: '#74aa9c',
  googlegemini: '#8E75FF',
  gmail: '#EA4335',
  discord: '#5865F2',
  spotify: '#1DB954',
  instagram: '#E4405F',
  facebook: '#1877F2',
  linkedin: '#0A66C2',
  amazon: '#FF9900',
  netflix: '#E50914',
  steam: '#00ADEE',
  twitch: '#9146FF',
  pinterest: '#BD081C',
  whatsapp: '#25D366'
};

function applySharedFavicon(iconKey) {
  const iconSvg = ICONS[iconKey] || ICONS.saturn;
  const favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    // Better encoding for data: URI
    const encoded = encodeURIComponent(iconSvg);
    favicon.href = `data:image/svg+xml,${encoded}`;
  }
}

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
  textColor2: '#e0e0e0',
  quoteInterval: 30,
  quoteFile: '',
  quoteFileName: '',
  maskColor: '#000000',
  maskOpacity: 60,
  tabName: 'Orbit',
  asciiSpeed: 50,
  tabIcon: 'saturn',
  autoHideSettings: false,
  iconTheme: 'accent-glow',
  fontFamily: "'JetBrains Mono', monospace",
  baseFontSize: 14,
  searchPlaceholder: null,
  showQuotes: true,
  showClock: true,
  backgroundBrightness: 100,
  searchOpacity: 0,
  searchBlur: 0
};
// Freeze to prevent accidental mutation across scripts.
Object.freeze(DEFAULT_CONFIG);

const DEFAULT_BOOKMARKS = Object.freeze([
  { "name": "GitHub", "url": "https://github.com", "tags": ["dev", "code"] },
  { "name": "Google", "url": "https://google.com", "tags": ["search"] },
  { "name": "YouTube", "url": "https://youtube.com", "tags": ["video", "entertainment"] },
  { "name": "Reddit", "url": "https://reddit.com", "tags": ["social"] }
]);


// Loads fallback config/bookmarks from data.json for any keys not yet found in storage.
async function loadDefaultsFromFile(config, bookmarks, hasConfig, hasBookmarks) {
  try {
    const response = await fetch('data.json');
    if (!response.ok) return { config, bookmarks };
    const data = await response.json();
    if (data.config && !hasConfig) config = { ...config, ...data.config };
    if (data.bookmarks && !hasBookmarks) bookmarks = data.bookmarks;
  } catch (err) {
    console.error('Failed to load data.json:', err);
  }
  return { config, bookmarks };
}

// Reads config and bookmarks from localStorage, filling gaps from data.json.
async function loadFromLocalStorage(config, bookmarks) {
  const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
  const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
  let hasConfig = false;
  let hasBookmarks = false;

  if (savedConfig) {
    try { config = { ...config, ...JSON.parse(savedConfig) }; hasConfig = true; } catch (e) { }
  }
  if (savedBookmarks) {
    try { bookmarks = JSON.parse(savedBookmarks); hasBookmarks = true; } catch (e) { }
  }

  if (!hasConfig || !hasBookmarks) {
    ({ config, bookmarks } = await loadDefaultsFromFile(config, bookmarks, hasConfig, hasBookmarks));
  }
  return { config, bookmarks };
}

// Reads from chrome.storage.local (extension context), falling back to localStorage for any gaps.
function loadFromChromeStorage(config, bookmarks) {
  return new Promise((resolve) => {
    try {
      window.chrome.storage.local.get([STORAGE_KEYS.CONFIG, STORAGE_KEYS.BOOKMARKS], async (result) => {
        if (window.chrome.runtime.lastError) {
          console.warn('Chrome storage get failed:', window.chrome.runtime.lastError);
          return resolve(loadFromLocalStorage(config, bookmarks));
        }

        let hasConfig = false;
        let hasBookmarks = false;

        if (result[STORAGE_KEYS.CONFIG]) {
          try { config = { ...config, ...result[STORAGE_KEYS.CONFIG] }; hasConfig = true; } catch (e) { }
        }
        if (result[STORAGE_KEYS.BOOKMARKS]) {
          try { bookmarks = result[STORAGE_KEYS.BOOKMARKS]; hasBookmarks = true; } catch (e) { }
        }

        // Fill any gaps from localStorage then data.json
        if (!hasConfig || !hasBookmarks) {
          const lsConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
          const lsBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
          if (!hasConfig && lsConfig) {
            try { config = { ...config, ...JSON.parse(lsConfig) }; hasConfig = true; } catch (e) { }
          }
          if (!hasBookmarks && lsBookmarks) {
            try { bookmarks = JSON.parse(lsBookmarks); hasBookmarks = true; } catch (e) { }
          }
          if (!hasConfig || !hasBookmarks) {
            ({ config, bookmarks } = await loadDefaultsFromFile(config, bookmarks, hasConfig, hasBookmarks));
          }
        }
        resolve({ config, bookmarks });
      });
    } catch (e) {
      console.warn('Chrome storage API error:', e);
      resolve(loadFromLocalStorage(config, bookmarks));
    }
  });
}

async function loadSharedData() {
  const config = { ...DEFAULT_CONFIG };
  const bookmarks = [...DEFAULT_BOOKMARKS];

  if (typeof window.chrome !== 'undefined' && window.chrome.storage?.local) {
    return loadFromChromeStorage(config, bookmarks);
  }
  return loadFromLocalStorage(config, bookmarks);
}

function saveSharedData(key, data) {
  // Always save to localStorage as primary/fallback
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn("LocalStorage save failed, quota exceeded?", e);
  }

  // Attempt to save to extension storage if available
  if (typeof window.chrome !== 'undefined' && window.chrome.storage && window.chrome.storage.local) {
    try {
      window.chrome.storage.local.set({ [key]: data }, () => {
        if (window.chrome.runtime.lastError) {
          console.warn("Chrome storage save failed:", window.chrome.runtime.lastError);
        }
      });
    } catch (e) {
      console.warn("Chrome storage API error:", e);
    }
  }
}

function removeSharedData(key) {
  localStorage.removeItem(key);
  if (typeof window.chrome !== 'undefined' && window.chrome.storage && window.chrome.storage.local) {
    window.chrome.storage.local.remove([key]);
  }
}

function hexToRgba(hex, alpha) {
  if (!hex || hex.length < 4) return `rgba(74, 158, 255, ${alpha})`;
  let r, g, b;
  if (hex.length === 4) { // #RGB
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else { // #RRGGBB
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function sanitizeFontFamily(font) {
  if (!font) return "";
  let clean = font.trim();

  // If there's an odd number of single quotes, it's unclosed.
  const quoteCount = (clean.match(/'/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // If it ends with a quote, remove it. Otherwise, close it.
    if (clean.endsWith("'")) clean = clean.slice(0, -1);
    else clean += "'";
  }

  // If the font has spaces but isn't already quoted, quote it.
  // Note: This is a simple check; it won't handle comma-separated stacks perfectly, 
  // but for the "font change" input it's much safer.
  if (clean.includes(" ") && !clean.startsWith("'") && !clean.includes(",")) {
    clean = `'${clean}'`;
  }

  return clean;
}

function applySharedTheme(config, pageType) {
  const root = document.documentElement;
  root.style.setProperty('--color-bg', config.backgroundColor);
  root.style.setProperty('--color-fg', config.textColor);
  root.style.setProperty('--color-accent', config.accentColor);

  // Apply typography variables if present
  let fontValue = config.fontFamily && config.fontFamily.trim() !== ''
    ? sanitizeFontFamily(config.fontFamily)
    : DEFAULT_CONFIG.fontFamily;

  // Use a fallback stack in the variable itself so mid-typing (invalid fonts) doesn't break the UI
  root.style.setProperty('--font-main', `${fontValue}, ${DEFAULT_CONFIG.fontFamily}`);

  // Font size only scales on index page dashboard
  if (pageType === 'index' && config.baseFontSize) {
    root.style.setProperty('--font-size-base', config.baseFontSize + 'px');
  } else {
    root.style.setProperty('--font-size-base', '14px');
  }

  document.body.style.backgroundColor = config.backgroundColor;
  document.body.style.color = config.textColor;

  if (config.tabName) {
    document.title = config.tabName;
  } else {
    document.title = 'Orbit';
  }

  const sInput = document.getElementById('search-input');
  if (sInput) {
    const placeholderValue = (config.searchPlaceholder !== undefined && config.searchPlaceholder !== null)
      ? config.searchPlaceholder
      : 'search or type : for commands';
    sInput.placeholder = placeholderValue;
  }

  const clockEl = document.getElementById('clock-watermark');
  if (clockEl) {
    clockEl.style.display = config.showClock !== false ? 'block' : 'none';
  }

  if (config.autoHideSettings) {
    document.body.classList.add('auto-hide-settings');
  } else {
    document.body.classList.remove('auto-hide-settings');
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

  const quoteArea = document.querySelector('.quote-area');
  if (quoteArea) {
    quoteArea.style.display = config.showQuotes !== false ? 'block' : 'none';
  }

  if (config.backgroundImage) {
    const blur = config.backgroundBlur || 0;
    const brightness = config.backgroundBrightness !== undefined ? config.backgroundBrightness : 100;
    const filterValue = (blur > 0 || brightness !== 100)
      ? `blur(${blur}px) brightness(${brightness}%)`
      : 'none';

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
      const maskColor = config.maskColor || '#000000';
      const maskOpacity = (config.maskOpacity !== undefined ? config.maskOpacity : 55) / 100;
      bgOverlayEl.textContent = `
        body::after {
          content: '';
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: ${hexToRgba(maskColor, maskOpacity)};
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
      // Note: bookmarks page applies its own background mask — see bookmarks.js applyBookmarksMask()
      // Other page types (e.g. bookmarks) keep the background but skip the index-only overlay/mask.
    }
  } else {
    document.body.style.backgroundImage = 'none';
    if (bgStyleEl) bgStyleEl.remove();
    if (bgMaskEl) bgMaskEl.remove();
    if (bgOverlayEl) bgOverlayEl.remove();
    if (textShadowEl) textShadowEl.remove();
  }
}
