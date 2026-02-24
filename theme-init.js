try {
  const data = localStorage.getItem('startpageConfig');
  if (data) {
    const config = JSON.parse(data);
    const root = document.documentElement;
    if (config.backgroundColor) root.style.setProperty('--color-bg', config.backgroundColor);
    if (config.textColor) root.style.setProperty('--color-fg', config.textColor);
    if (config.accentColor) root.style.setProperty('--color-accent', config.accentColor);

    // Apply Favicon ASAP if ICONS is loaded
    if (config.tabIcon && typeof ICONS !== 'undefined') {
      const iconSvg = ICONS[config.tabIcon];
      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon && iconSvg) {
        favicon.href = `data:image/svg+xml,${iconSvg.replace(/'/g, '"')}`;
      }
    }
  }
} catch (e) { }
