import type { TabType } from './types';

export const TAB_ICONS: Record<TabType, string> = {
  profile: 'i-ph:user-circle',
  settings: 'i-ph:gear-six',
  notifications: 'i-ph:bell',
  features: 'i-ph:star',
  data: 'i-ph:database',
  'cloud-providers': 'i-ph:cloud',
  'local-providers': 'i-ph:laptop',
  'service-status': 'i-ph:activity-bold',
  connection: 'i-ph:wifi-high',
  'event-logs': 'i-ph:list-bullets',
  mcp: 'i-ph:wrench',
  apps: 'i-ph:app-window',
  memory: 'i-ph:brain',
};

export const TAB_LABELS: Record<TabType, string> = {
  profile: 'Profile',
  settings: 'Settings',
  notifications: 'Notifications',
  features: 'Features',
  data: 'Data Management',
  'cloud-providers': 'Cloud Providers',
  'local-providers': 'Local Providers',
  'service-status': 'Service Status',
  connection: 'Connection',
  'event-logs': 'Event Logs',
  mcp: 'MCP Servers',
  apps: 'My Apps',
  memory: 'AI Memory',
};

export const TAB_DESCRIPTIONS: Record<TabType, string> = {
  profile: 'Manage your profile and account settings',
  settings: 'Configure application preferences',
  notifications: 'View and manage your notifications',
  features: 'Explore new and upcoming features',
  data: 'Manage your data and storage',
  'cloud-providers': 'Configure cloud AI providers and models',
  'local-providers': 'Configure local AI providers and models',
  'service-status': 'Monitor cloud LLM service status',
  connection: 'Check connection status and settings',
  'event-logs': 'View system events and logs',
  mcp: 'Configure MCP (Model Context Protocol) servers',
  apps: 'Manage your personalized AI apps and projects',
  memory: 'Manage your persistent AI memory and conversation context',
};

export const DEFAULT_TAB_CONFIG = [
  // User Window Tabs (Always visible by default)
  { id: 'features', visible: true, window: 'user' as const, order: 0 },
  { id: 'apps', visible: true, window: 'user' as const, order: 1 },
  { id: 'memory', visible: true, window: 'user' as const, order: 2 },
  { id: 'data', visible: true, window: 'user' as const, order: 3 },
  { id: 'cloud-providers', visible: true, window: 'user' as const, order: 4 },
  { id: 'local-providers', visible: true, window: 'user' as const, order: 5 },
  { id: 'connection', visible: true, window: 'user' as const, order: 6 },
  { id: 'notifications', visible: true, window: 'user' as const, order: 7 },
  { id: 'event-logs', visible: true, window: 'user' as const, order: 8 },
  { id: 'mcp', visible: true, window: 'user' as const, order: 9 },

  { id: 'profile', visible: true, window: 'user' as const, order: 10 },
  { id: 'service-status', visible: true, window: 'user' as const, order: 11 },
  { id: 'settings', visible: true, window: 'user' as const, order: 12 },

  // User Window Tabs (In dropdown, initially hidden)
];
