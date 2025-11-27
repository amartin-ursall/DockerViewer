export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// --- Nautica SSH Docker Manager Types ---
export type AuthMethod = 'password' | 'privateKey';
export interface Connection {
  id: string;
  alias: string;
  host: string;
  port: number;
  user: string;
  authMethod: AuthMethod;
  // Secrets are stored encrypted client-side, not sent to server
}
export interface Server extends Connection {
  connected: boolean;
  lastSeen_ts?: number;
}
export interface ServerSummary {
  cpu: { usage: number; history: { time: string; value: number }[] };
  memory: { usage: number; total: number; history: { time: string; value: number }[] };
  disk: { usage: number; total: number };
  uptime: string;
  dockerStatus: 'running' | 'stopped';
}
export type ContainerStatus = 'running' | 'stopped' | 'restarting';
export interface Container {
  id: string;
  serverId: string;
  name: string;
  image: string;
  status: ContainerStatus;
  cpu: string; // e.g., "0.5%"
  memory: string; // e.g., "256MB"
  ports: string; // e.g., "80:8080, 443:8443"
  created_ts: number;
}
export interface ContainerLog {
  timestamp: number;
  message: string;
  level: 'info' | 'warn' | 'error';
  containerId: string;
  containerName: string;
}
export interface ContainerStats {
  cpu: { time: string; value: number }[];
  memory: { time: string; value: number }[];
}
export interface ContainerConfig {
  volumes: string[];
  env: Record<string, string>;
  ports: Record<string, string>;
}
export interface Image {
  id: string;
  serverId: string;
  repository: string;
  tag: string;
  size: string;
  created_ts: number;
}
export type ImageAction = 'pull' | 'remove';