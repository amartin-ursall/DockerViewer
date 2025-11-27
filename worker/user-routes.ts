import { Hono } from "hono";
import type { Env } from './core-utils';
import { ServerEntity, ContainerEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { Server, Container, ServerSummary, ContainerStatus } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- NAUTICA API ---
  // SERVERS
  app.get('/api/servers', async (c) => {
    await ServerEntity.ensureSeed(c.env);
    const { items } = await ServerEntity.list(c.env, null, 100);
    return ok(c, items);
  });
  app.post('/api/servers', async (c) => {
    const body = await c.req.json<Partial<Server>>();
    if (!body.alias || !body.host || !body.user) return bad(c, 'alias, host, and user are required');
    const newServer: Server = {
      id: `srv-${crypto.randomUUID().slice(0, 8)}`,
      alias: body.alias,
      host: body.host,
      port: body.port || 22,
      user: body.user,
      authMethod: body.authMethod || 'password',
      connected: false,
    };
    await ServerEntity.create(c.env, newServer);
    return ok(c, newServer);
  });
  app.post('/api/servers/:id/connect', async (c) => {
    const serverId = c.req.param('id');
    const server = new ServerEntity(c.env, serverId);
    if (!await server.exists()) return notFound(c, 'server not found');
    // Simulate connection logic
    await server.patch({ connected: true, lastSeen_ts: Date.now() });
    // Disconnect others
    const { items } = await ServerEntity.list(c.env);
    for (const s of items) {
      if (s.id !== serverId && s.connected) {
        await new ServerEntity(c.env, s.id).patch({ connected: false });
      }
    }
    return ok(c, await server.getState());
  });
  app.get('/api/servers/:id/summary', async (c) => {
    const serverId = c.req.param('id');
    const server = new ServerEntity(c.env, serverId);
    if (!await server.exists()) return notFound(c, 'server not found');
    // Simulate summary data
    const now = Date.now();
    const summary: ServerSummary = {
      cpu: { usage: Math.random() * 100, history: Array.from({ length: 10 }, (_, i) => ({ time: new Date(now - (10 - i) * 5000).toLocaleTimeString(), value: Math.random() * 100 })) },
      memory: { usage: Math.random() * 16, total: 16, history: Array.from({ length: 10 }, (_, i) => ({ time: new Date(now - (10 - i) * 5000).toLocaleTimeString(), value: Math.random() * 16 })) },
      disk: { usage: Math.random() * 512, total: 512 },
      uptime: '12d 4h 32m',
      dockerStatus: 'running',
    };
    return ok(c, summary);
  });
  // CONTAINERS
  app.get('/api/servers/:id/containers', async (c) => {
    const serverId = c.req.param('id');
    await ContainerEntity.ensureSeed(c.env);
    const { items } = await ContainerEntity.list(c.env, null, 100);
    const serverContainers = items.filter(container => container.serverId === serverId);
    return ok(c, serverContainers);
  });
  app.post('/api/servers/:serverId/containers/:containerId/action', async (c) => {
    const { serverId, containerId } = c.req.param();
    const { action } = await c.req.json<{ action: 'start' | 'stop' | 'restart' }>();
    if (!action) return bad(c, 'action is required');
    const container = new ContainerEntity(c.env, containerId);
    if (!await container.exists() || (await container.getState()).serverId !== serverId) {
      return notFound(c, 'container not found on this server');
    }
    let newStatus: ContainerStatus = 'stopped';
    switch (action) {
      case 'start': newStatus = 'running'; break;
      case 'stop': newStatus = 'stopped'; break;
      case 'restart': newStatus = 'restarting'; break;
    }
    const updatedContainer = await container.setStatus(newStatus);
    if (newStatus === 'restarting') {
        setTimeout(async () => {
            const c = new ContainerEntity(c.env, containerId);
            if(await c.exists()) {
                await c.setStatus('running');
            }
        }, 2000);
    }
    return ok(c, updatedContainer);
  });
  app.get('/api/servers/:serverId/containers/:containerId/logs', async (c) => {
    const { serverId, containerId } = c.req.param();
    const container = new ContainerEntity(c.env, containerId);
    if (!await container.exists() || (await container.getState()).serverId !== serverId) {
      return notFound(c, 'container not found');
    }
    return ok(c, await container.getLogs());
  });
  app.get('/api/servers/:serverId/containers/:containerId/stats', async (c) => {
    const { serverId, containerId } = c.req.param();
    const container = new ContainerEntity(c.env, containerId);
    if (!await container.exists() || (await container.getState()).serverId !== serverId) {
      return notFound(c, 'container not found');
    }
    return ok(c, await container.getStats());
  });
  app.get('/api/servers/:serverId/containers/:containerId/config', async (c) => {
    const { serverId, containerId } = c.req.param();
    const container = new ContainerEntity(c.env, containerId);
    if (!await container.exists() || (await container.getState()).serverId !== serverId) {
      return notFound(c, 'container not found');
    }
    return ok(c, await container.getConfig());
  });
}