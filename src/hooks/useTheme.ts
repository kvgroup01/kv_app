import * as React from 'react';

export type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    return (localStorage.getItem('kv-theme') as Theme) || 'dark';
  });

  const applyTheme = React.useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.remove('light');
    if (t === 'light') {
      root.classList.add('light');
    } else if (t === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!prefersDark) root.classList.add('light');
    }
    // dark é o padrão (sem classe)
  }, []);

  React.useEffect(() => {
    applyTheme(theme);
    localStorage.setItem('kv-theme', theme);
  }, [theme, applyTheme]);

  // Ouvir mudanças do sistema quando theme === 'system'
  React.useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return { theme, setTheme };
}
