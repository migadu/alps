export interface ThemeBundle {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    'bg-primary': string;
    'bg-secondary': string;
    'bg-tertiary': string;
    'bg-selected': string;
    'bg-starred': string;
    'text-primary': string;
    'text-sender-read': string;
    'text-secondary': string;
    'text-muted': string;
    'border-color': string;
    'accent-color': string;
    'accent-hover': string;
    'accent-light': string;
    'success': string;
    'warning': string;
    'error': string;
    'hover-color': string;
  };
}

export const THEME_BUNDLES: Record<string, ThemeBundle> = {
  'default-light': {
    id: 'default-light',
    name: 'Default Light',
    isDark: false,
    colors: {
      'bg-primary': '#ffffff',
      'bg-secondary': '#f9fafb',
      'bg-tertiary': '#f3f4f6',
      'bg-selected': '#eff6ff',
      'bg-starred': '#2563eb0f',
      'text-primary': '#111827',
      'text-sender-read': '#202020',
      'text-secondary': '#4b5563',
      'text-muted': '#9ca3af',
      'border-color': '#e5e7eb',
      'accent-color': '#2563eb',
      'accent-hover': '#1d4ed8',
      'accent-light': '#dbeafe',
      'success': '#10b981',
      'warning': '#f59e0b',
      'error': '#ef4444',
      'hover-color': '#f3f4f6',
    }
  },
  'default-dark': {
    id: 'default-dark',
    name: 'Default Dark',
    isDark: true,
    colors: {
      'bg-primary': '#1f2937',
      'bg-secondary': '#111827',
      'bg-tertiary': '#374151',
      'bg-selected': '#1e3a8a',
      'bg-starred': '#3b82f615',
      'text-primary': '#f9fafb',
      'text-sender-read': '#e5e7eb',
      'text-secondary': '#d1d5db',
      'text-muted': '#9ca3af',
      'border-color': '#374151',
      'accent-color': '#3b82f6', /* slightly lighter for dark mode */
      'accent-hover': '#60a5fa',
      'accent-light': '#1e3a8a',
      'success': '#10b981',
      'warning': '#f59e0b',
      'error': '#ef4444',
      'hover-color': 'rgba(255, 255, 255, 0.1)',
    }
  },
  'nord-light': {
    id: 'nord-light',
    name: 'Nord Light',
    isDark: false,
    colors: {
      'bg-primary': '#eceff4',
      'bg-secondary': '#e5e9f0',
      'bg-tertiary': '#d8dee9',
      'bg-selected': '#81a1c133',
      'bg-starred': '#5e81ac15',
      'text-primary': '#2e3440',
      'text-sender-read': '#3b4252',
      'text-secondary': '#3b4252',
      'text-muted': '#4c566a',
      'border-color': '#d8dee9',
      'accent-color': '#5e81ac',
      'accent-hover': '#81a1c1',
      'accent-light': '#81a1c133',
      'success': '#a3be8c',
      'warning': '#ebcb8b',
      'error': '#bf616a',
      'hover-color': 'rgba(0, 0, 0, 0.05)',
    }
  },
  'nord-dark': {
    id: 'nord-dark',
    name: 'Nord Dark',
    isDark: true,
    colors: {
      'bg-primary': '#2e3440',
      'bg-secondary': '#3b4252',
      'bg-tertiary': '#434c5e',
      'bg-selected': '#81a1c133',
      'bg-starred': '#88c0d015',
      'text-primary': '#eceff4',
      'text-sender-read': '#e5e9f0',
      'text-secondary': '#e5e9f0',
      'text-muted': '#d8dee9',
      'border-color': '#434c5e',
      'accent-color': '#88c0d0',
      'accent-hover': '#81a1c1',
      'accent-light': '#81a1c133',
      'success': '#a3be8c',
      'warning': '#ebcb8b',
      'error': '#bf616a',
      'hover-color': 'rgba(255, 255, 255, 0.1)',
    }
  },
  'ocean-light': {
    id: 'ocean-light',
    name: 'Ocean Light',
    isDark: false,
    colors: {
      'bg-primary': '#f8fafc',
      'bg-secondary': '#f1f5f9',
      'bg-tertiary': '#e2e8f0',
      'bg-selected': '#e0f2fe',
      'bg-starred': '#0ea5e915',
      'text-primary': '#0f172a',
      'text-sender-read': '#1e293b',
      'text-secondary': '#334155',
      'text-muted': '#64748b',
      'border-color': '#cbd5e1',
      'accent-color': '#0ea5e9',
      'accent-hover': '#0284c7',
      'accent-light': '#e0f2fe',
      'success': '#10b981',
      'warning': '#f59e0b',
      'error': '#ef4444',
      'hover-color': 'rgba(0, 0, 0, 0.05)',
    }
  },
  'ocean-dark': {
    id: 'ocean-dark',
    name: 'Ocean Dark',
    isDark: true,
    colors: {
      'bg-primary': '#0f172a',
      'bg-secondary': '#1e293b',
      'bg-tertiary': '#334155',
      'bg-selected': '#0c4a6e',
      'bg-starred': '#38bdf815',
      'text-primary': '#f8fafc',
      'text-sender-read': '#e2e8f0',
      'text-secondary': '#cbd5e1',
      'text-muted': '#94a3b8',
      'border-color': '#334155',
      'accent-color': '#38bdf8',
      'accent-hover': '#0ea5e9',
      'accent-light': '#0c4a6e',
      'success': '#10b981',
      'warning': '#f59e0b',
      'error': '#ef4444',
      'hover-color': 'rgba(255, 255, 255, 0.1)',
    }
  }
};
