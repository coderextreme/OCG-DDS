export type SystemModuleId = 'graph' | 'sync' | 'sharding' | 'capabilities';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export type { AccessibleOutputChannel } from '../core/accessibilityOutput';

export interface AuditEvent {
  id: string;
  timestamp: string;
  module: SystemModuleId;
  severity: 'info' | 'warning' | 'success';
  summary: string;
}
