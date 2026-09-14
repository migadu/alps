import { Logger } from './utils/logger';
import { installAppUpdate } from './services/app-update';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-700.css';
import './index.css';
// Automatically discover and load all plugin frontend components
const plugins = import.meta.glob('../../plugins/*/frontend/index.ts', { eager: true });
Logger.info(`Loaded ${Object.keys(plugins).length} frontend plugins.`);

installAppUpdate();

import './components/app-root';
