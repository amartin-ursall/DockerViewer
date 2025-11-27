import type { ApiResponse, Server, Container, ContainerLog, ContainerStats, ServerSummary, ContainerConfig } from "@shared/types"
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || !json.success || json.data === undefined) throw new Error(json.error || 'Request failed')
  return json.data
}
// --- API Client Helpers for Nautica ---
export const servers = {
  list: () => api<Server[]>('/api/servers'),
  create: (data: Partial<Server>) => api<Server>('/api/servers', { method: 'POST', body: JSON.stringify(data) }),
  connect: (id: string) => api<Server>(`/api/servers/${id}/connect`, { method: 'POST' }),
  getSummary: (id: string) => api<ServerSummary>(`/api/servers/${id}/summary`),
};
export const containers = {
  list: (serverId: string) => api<Container[]>(`/api/servers/${serverId}/containers`),
  performAction: (serverId: string, containerId: string, action: 'start' | 'stop' | 'restart') =>
    api<Container>(`/api/servers/${serverId}/containers/${containerId}/action`, { method: 'POST', body: JSON.stringify({ action }) }),
  getLogs: (serverId: string, containerId: string) => api<ContainerLog[]>(`/api/servers/${serverId}/containers/${containerId}/logs`),
  getStats: (serverId: string, containerId: string) => api<ContainerStats>(`/api/servers/${serverId}/containers/${containerId}/stats`),
  getConfig: (serverId: string, containerId: string) => api<ContainerConfig>(`/api/servers/${serverId}/containers/${containerId}/config`),
};