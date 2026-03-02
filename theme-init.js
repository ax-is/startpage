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
      const iconSvg = ICONS[config.tabIcon] || ICONS.saturn;
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon && iconSvg) {
        const encoded = encodeURIComponent(iconSvg);
        favicon.href = `data:image/svg+xml,${encoded}`;
      }
    }

    // Pre-apply background image to prevent flash on new tab
    if (isIndex && config.backgroundImage) {
      const blur = config.backgroundBlur || 0;
      const brightness = config.backgroundBrightness !== undefined ? config.backgroundBrightness : 100;
      const filterValue = (blur > 0 || brightness !== 100)
        ? `blur(${blur}px) brightness(${brightness}%)`
        : 'none';

      const bgStyle = document.createElement('style');
      bgStyle.id = 'background-style';
      bgStyle.textContent = `
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
      document.head.appendChild(bgStyle);

      // Pre-apply mask overlay
      const maskColor = config.maskColor || '#000000';
      const maskOpacity = (config.maskOpacity !== undefined ? config.maskOpacity : 55) / 100;
      const r = parseInt(maskColor.slice(1, 3), 16) || 0;
      const g = parseInt(maskColor.slice(3, 5), 16) || 0;
      const b = parseInt(maskColor.slice(5, 7), 16) || 0;

      const bgOverlay = document.createElement('style');
      bgOverlay.id = 'bg-overlay';
      bgOverlay.textContent = `
        body::after {
          content: '';
          position: fixed;
          top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(${r}, ${g}, ${b}, ${maskOpacity});
          z-index: -1;
          pointer-events: none;
        }
      `;
      document.head.appendChild(bgOverlay);
    }
  }
} catch (e) { }
