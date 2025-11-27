import type { Server, Container, ContainerLog, Image } from './types';
export const MOCK_SERVERS: Server[] = [
  { id: 'srv-prod-1', alias: 'Production Web Server', host: '192.168.1.100', port: 22, user: 'deploy', authMethod: 'privateKey', connected: false },
  { id: 'srv-stage-1', alias: 'Staging Environment', host: 'staging.example.com', port: 2222, user: 'dev', authMethod: 'password', connected: false },
  { id: 'srv-db-1', alias: 'Database Server', host: '10.0.0.5', port: 22, user: 'admin', authMethod: 'privateKey', connected: false },
];
export const MOCK_CONTAINERS: Container[] = [
  { id: 'c1', serverId: 'srv-prod-1', name: 'nginx-proxy', image: 'nginx:latest', status: 'running', cpu: '0.15%', memory: '64.5MB', ports: '80:80, 443:443', created_ts: Date.now() - 86400000 * 10 },
  { id: 'c2', serverId: 'srv-prod-1', name: 'webapp-main', image: 'my-app:1.2.3', status: 'running', cpu: '5.75%', memory: '512.3MB', ports: '8080:80', created_ts: Date.now() - 86400000 * 5 },
  { id: 'c3', serverId: 'srv-prod-1', name: 'redis-cache', image: 'redis:alpine', status: 'stopped', cpu: '0.00%', memory: '0MB', ports: '6379:6379', created_ts: Date.now() - 86400000 * 15 },
  { id: 'c4', serverId: 'srv-stage-1', name: 'dev-postgres', image: 'postgres:14', status: 'running', cpu: '2.10%', memory: '1.2GB', ports: '5432:5432', created_ts: Date.now() - 86400000 * 2 },
  { id: 'c5', serverId: 'srv-stage-1', name: 'staging-app', image: 'my-app:dev-branch', status: 'restarting', cpu: '1.50%', memory: '256MB', ports: '8000:80', created_ts: Date.now() - 86400000 * 1 },
];
export const MOCK_IMAGES: Image[] = [
    { id: 'img1', serverId: 'srv-prod-1', repository: 'nginx', tag: 'latest', size: '133MB', created_ts: Date.now() - 86400000 * 20 },
    { id: 'img2', serverId: 'srv-prod-1', repository: 'my-app', tag: '1.2.3', size: '1.2GB', created_ts: Date.now() - 86400000 * 5 },
    { id: 'img3', serverId: 'srv-prod-1', repository: 'redis', tag: 'alpine', size: '32MB', created_ts: Date.now() - 86400000 * 15 },
    { id: 'img4', serverId: 'srv-stage-1', repository: 'postgres', tag: '14', size: '379MB', created_ts: Date.now() - 86400000 * 2 },
    { id: 'img5', serverId: 'srv-stage-1', repository: 'my-app', tag: 'dev-branch', size: '1.3GB', created_ts: Date.now() - 86400000 * 1 },
    { id: 'img6', serverId: 'srv-stage-1', repository: 'node', tag: '18-alpine', size: '175MB', created_ts: Date.now() - 86400000 * 30 },
];
export const MOCK_LOGS: Record<string, ContainerLog[]> = {
  'c1': [
    { timestamp: Date.now() - 3000, level: 'info', containerId: 'c1', containerName: 'nginx-proxy', message: '172.17.0.1 - - [date] "GET / HTTP/1.1" 200 612 "-" "curl/7.68.0"' },
  ],
  'c2': [
    { timestamp: Date.now() - 5000, level: 'info', containerId: 'c2', containerName: 'webapp-main', message: 'Application starting up...' },
    { timestamp: Date.now() - 4000, level: 'info', containerId: 'c2', containerName: 'webapp-main', message: 'Database connection successful.' },
    { timestamp: Date.now() - 3000, level: 'warn', containerId: 'c2', containerName: 'webapp-main', message: 'Cache key "user:123" not found.' },
    { timestamp: Date.now() - 2000, level: 'info', containerId: 'c2', containerName: 'webapp-main', message: 'GET /api/health 200 OK' },
    { timestamp: Date.now() - 1000, level: 'error', containerId: 'c2', containerName: 'webapp-main', message: 'Unhandled exception in worker thread.' },
  ],
  'c4': [
    { timestamp: Date.now() - 6000, level: 'info', containerId: 'c4', containerName: 'dev-postgres', message: 'database system is ready to accept connections' },
  ],
  'c5': [
    { timestamp: Date.now() - 2000, level: 'error', containerId: 'c5', containerName: 'staging-app', message: 'Failed to connect to database, retrying in 5s...' },
  ]
};