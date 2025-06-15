import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'light') {
      root.classList.remove('dark', 'dark-theme');
      root.classList.add('light-theme');
      
      // Apply custom light theme colors - white and pink like ReactFlow
      root.style.setProperty('--gray-1', '#ffffff');
      root.style.setProperty('--gray-2', '#fafafa');
      root.style.setProperty('--gray-3', '#f5f5f5');
      root.style.setProperty('--gray-4', '#f0f0f0');
      root.style.setProperty('--gray-5', '#e8e8e8');
      root.style.setProperty('--gray-6', '#e2e2e2');
      root.style.setProperty('--gray-7', '#dbdbdb');
      root.style.setProperty('--gray-8', '#c7c7c7');
      root.style.setProperty('--gray-9', '#8f8f8f');
      root.style.setProperty('--gray-10', '#858585');
      root.style.setProperty('--gray-11', '#6f6f6f');
      root.style.setProperty('--gray-12', '#202020');
      
      // Pink accent colors
      root.style.setProperty('--ruby-1', '#fffcfd');
      root.style.setProperty('--ruby-2', '#fff7f9');
      root.style.setProperty('--ruby-3', '#ffeef3');
      root.style.setProperty('--ruby-4', '#ffe4eb');
      root.style.setProperty('--ruby-5', '#ffd8e2');
      root.style.setProperty('--ruby-6', '#ffcbd8');
      root.style.setProperty('--ruby-7', '#ffb7cd');
      root.style.setProperty('--ruby-8', '#ff9bbf');
      root.style.setProperty('--ruby-9', '#ff6ba6');
      root.style.setProperty('--ruby-10', '#ff5c9a');
      root.style.setProperty('--ruby-11', '#e5407b');
      root.style.setProperty('--ruby-12', '#a51d52');
    } else {
      root.classList.remove('light-theme');
      root.classList.add('dark', 'dark-theme');
      
      // Reset to default dark theme
      root.style.removeProperty('--gray-1');
      root.style.removeProperty('--gray-2');
      root.style.removeProperty('--gray-3');
      root.style.removeProperty('--gray-4');
      root.style.removeProperty('--gray-5');
      root.style.removeProperty('--gray-6');
      root.style.removeProperty('--gray-7');
      root.style.removeProperty('--gray-8');
      root.style.removeProperty('--gray-9');
      root.style.removeProperty('--gray-10');
      root.style.removeProperty('--gray-11');
      root.style.removeProperty('--gray-12');
      root.style.removeProperty('--ruby-1');
      root.style.removeProperty('--ruby-2');
      root.style.removeProperty('--ruby-3');
      root.style.removeProperty('--ruby-4');
      root.style.removeProperty('--ruby-5');
      root.style.removeProperty('--ruby-6');
      root.style.removeProperty('--ruby-7');
      root.style.removeProperty('--ruby-8');
      root.style.removeProperty('--ruby-9');
      root.style.removeProperty('--ruby-10');
      root.style.removeProperty('--ruby-11');
      root.style.removeProperty('--ruby-12');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};