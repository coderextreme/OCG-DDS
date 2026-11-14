export type SystemModuleId = 'graph' | 'ring' | 'crdt' | 'merkle' | 'quorum';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export interface AuditEvent {
  id: string;
  timestamp: string;
  module: SystemModuleId;
  severity: 'info' | 'warning' | 'success';
  summary: string;
}
