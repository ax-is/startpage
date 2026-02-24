try {
  const data = localStorage.getItem('startpageConfig');
  if (data) {
    const config = JSON.parse(data);
    const root = document.documentElement;
    if (config.backgroundColor) root.style.setProperty('--color-bg', config.backgroundColor);
    if (config.textColor) root.style.setProperty('--color-fg', config.textColor);
    const isIndex = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname === '';

    // Apply font with default fallback stack
    const fontValue = config.fontFamily && config.fontFamily.trim() !== ''
      ? config.fontFamily
      : (typeof DEFAULT_CONFIG !== 'undefined' ? DEFAULT_CONFIG.fontFamily : "'JetBrains Mono', monospace");

    const defaultFallback = (typeof DEFAULT_CONFIG !== 'undefined' ? DEFAULT_CONFIG.fontFamily : "'JetBrains Mono', monospace");

    root.style.setProperty('--font-main', `${fontValue}, ${defaultFallback}`);

    // Size isolation
    if (isIndex && config.baseFontSize) {
      root.style.setProperty('--font-size-base', config.baseFontSize + 'px');
    } else {
      root.style.setProperty('--font-size-base', '14px');
    }

    // Apply Favicon ASAP if ICONS is loaded
    if (config.tabIcon && typeof ICONS !== 'undefined') {
      const iconSvg = ICONS[config.tabIcon];
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon && iconSvg) {
        const encoded = encodeURIComponent(iconSvg.replace(/'/g, '"'));
        favicon.href = `data:image/svg+xml,${encoded}`;
      }
    }
  }
} catch (e) { }
