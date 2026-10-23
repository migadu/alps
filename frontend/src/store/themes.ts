import { defaultTheme } from '../utils/branding';

/**
 * The theme family a colorFamily setting shows. 'default' is no choice made,
 * which takes the server's default theme, and Alps when it names none or one
 * this build does not have.
 */
export function themeFamily(colorFamily: string): string {
  const family = colorFamily === 'default' ? defaultTheme() ?? 'alps' : colorFamily;
  return THEME_BUNDLES[`${family}-light`] ? family : 'alps';
}

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
  /* Custom properties beyond the colours: fonts, radii, the unread wash. A
     theme sets only those it changes; the rest keep their index.css values. */
  tokens?: Record<string, string>;
}

/* Migadu: the type and shapes of migadu.com, shared by both modes. */
const MIGADU_TOKENS = {
  'font-base': '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  'font-heading': '"Source Serif 4", "Iowan Old Style", "Palatino Linotype", Georgia, serif',
  'font-mono': '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
  'font-label': 'var(--font-mono)',
  'radius-sm': '2px',
  'radius-md': '3px',
  'radius-lg': '4px',
  'input-radius': '3px',
  'btn-radius': '3px',
  // The site's buttons have a light-blue edge in both modes.
  'accent-fill-border': '#60a5fa',
};

export const THEME_BUNDLES: Record<string, ThemeBundle> = {
  'alps-light': {
    id: 'alps-light',
    name: 'Alps Light',
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
  'alps-dark': {
    id: 'alps-dark',
    name: 'Alps Dark',
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
  },
  // migadu.com's light sheet, in its own values. Two exceptions keep text at
  // 4.5:1 on a selected row: muted text a shade darker, and the green, amber
  // and red the site's guides use for small text.
  'migadu-light': {
    id: 'migadu-light',
    name: 'Migadu Light',
    isDark: false,
    colors: {
      'bg-primary': '#f5f9ff',
      'bg-secondary': '#eaf1fb',
      'bg-tertiary': '#dce8f8',
      'bg-selected': '#d7e4fb',
      'bg-starred': '#1d4ed80d',
      'text-primary': '#0b1938',
      'text-sender-read': '#1c2f57',
      'text-secondary': '#284173',
      'text-muted': '#4a6595',
      'border-color': '#b9ceec',
      'accent-color': '#1d4ed8',
      'accent-hover': '#1d4ed8',
      'accent-light': '#dbe6fd',
      'success': '#0b7a48',
      'warning': '#8f4f00',
      'error': '#c22f16',
      'hover-color': 'rgba(34, 85, 221, 0.06)',
    },
    tokens: {
      ...MIGADU_TOKENS,
      'accent-fill': '#1d4ed8',
      'accent-fill-hover': '#1e40af',
      'bg-unread': '#1d4ed80b',
      'bg-unread-hover': '#1d4ed814',
      'scrollbar-thumb': '#b9ceec',
      'scrollbar-thumb-hover': '#8fb0de',
      'icon-inbox': '#1d4ed8',
      'icon-sent': '#0b7a48',
      'icon-drafts': '#8f4f00',
      'icon-spam': '#c22f16',
      'icon-trash': '#4a6595',
      'icon-archive': '#284173',
      'icon-default': '#4a6595',
    }
  },
  // migadu.com's dark sheet, in its own values: sky-blue links and accents,
  // royal-blue buttons with white text.
  'migadu-dark': {
    id: 'migadu-dark',
    name: 'Migadu Dark',
    isDark: true,
    colors: {
      'bg-primary': '#0c1a3b',
      'bg-secondary': '#08122b',
      'bg-tertiary': '#172e63',
      'bg-selected': '#163469',
      'bg-starred': '#38bdf812',
      'text-primary': '#f4f8ff',
      'text-sender-read': '#d6e2f8',
      'text-secondary': '#bfd3f5',
      'text-muted': '#82a3dc',
      'border-color': '#254380',
      'accent-color': '#38bdf8',
      'accent-hover': '#38bdf8',
      'accent-light': '#123a66',
      'success': '#34d399',
      'warning': '#fbbf24',
      'error': '#ff7a59',
      'hover-color': 'rgba(96, 165, 250, 0.08)',
    },
    tokens: {
      ...MIGADU_TOKENS,
      'accent-fill': '#2563eb',
      // Darken on hover so the button's white text keeps 4.5:1 contrast.
      'accent-fill-hover': '#1d4ed8',
      'bg-unread': '#38bdf80d',
      'bg-unread-hover': '#38bdf817',
      'scrollbar-thumb': '#254380',
      'scrollbar-thumb-hover': '#4d7ad1',
      'icon-inbox': '#38bdf8',
      'icon-sent': '#34d399',
      'icon-drafts': '#fbbf24',
      'icon-spam': '#ff7a59',
      'icon-trash': '#82a3dc',
      'icon-archive': '#bfd3f5',
      'icon-default': '#82a3dc',
    }
  }
};
