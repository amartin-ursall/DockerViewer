import { Hono, Context } from "hono";
import type { Env } from './core-utils';
import { ServerEntity, ContainerEntity, ImageEntity } from "./entities";
import { ok, bad, notFound } from './core-utils';
import type { Server, ServerSummary, ContainerStatus, ContainerLog } from "@shared/types";
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- NAUTICA API ---
  // SERVERS
  app.get('/api/servers', async (c: Context<{ Bindings: Env }>) => {
    await ServerEntity.ensureSeed(c.env);
    const { items } = await ServerEntity.list(c.env, null, 100);
    return ok(c, items);
  });
  app.post('/api/servers', async (c: Context<{ Bindings: Env }>) => {
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
  app.post('/api/servers/:id/connect', async (c: Context<{ Bindings: Env }>) => {
    const serverId = c.req.param('id');
    const server = new ServerEntity(c.env, serverId);
    if (!await server.exists()) return notFound(c, 'server not found');
    await server.patch({ connected: true, lastSeen_ts: Date.now() });
    const { items } = await ServerEntity.list(c.env);
    for (const s of items) {
      if (s.id !== serverId && s.connected) {
        await new ServerEntity(c.env, s.id).patch({ connected: false });
      }
    }
    return ok(c, await server.getState());
  });
  app.get('/api/servers/:id/summary', async (c: Context<{ Bindings: Env }>) => {
    const serverId = c.req.param('id');
    const server = new ServerEntity(c.env, serverId);
    if (!await server.exists()) return notFound(c, 'server not found');
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
  app.get('/api/servers/:id/containers', async (c: Context<{ Bindings: Env }>) => {
    const serverId = c.req.param('id');
    await ContainerEntity.ensureSeed(c.env);
    const { items } = await ContainerEntity.list(c.env, null, 100);
    const serverContainers = items.filter(container => container.serverId === serverId);
    return ok(c, serverContainers);
  });
  app.post('/api/servers/:serverId/containers/:containerId/action', async (c: Context<{ Bindings: Env }>) => {
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
        c.executionCtx.waitUntil(
            new Promise(resolve => setTimeout(resolve, 2000)).then(async () => {
                const containerToUpdate = new ContainerEntity(c.env, containerId);
                if(await containerToUpdate.exists()) {
                    await containerToUpdate.setStatus('running');
                }
            })
        );
    }
    return ok(c, updatedContainer);
  });
  app.get('/api/servers/:serverId/containers/:containerId/logs', async (c: Context<{ Bindings: Env }>) => {
    const { serverId, containerId } = c.req.param();
    const container = new ContainerEntity(c.env, containerId);
    if (!await container.exists() || (await container.getState()).serverId !== serverId) {
      return notFound(c, 'container not found');
    }
    return ok(c, await container.getLogs());
  });
  app.get('/api/servers/:serverId/containers/:containerId/stats', async (c: Context<{ Bindings: Env }>) => {
    const { serverId, containerId } = c.req.param();
    const container = new ContainerEntity(c.env, containerId);
    if (!await container.exists() || (await container.getState()).serverId !== serverId) {
      return notFound(c, 'container not found');
    }
    return ok(c, await container.getStats());
  });
  app.get('/api/servers/:serverId/containers/:containerId/config', async (c: Context<{ Bindings: Env }>) => {
    const { serverId, containerId } = c.req.param();
    const container = new ContainerEntity(c.env, containerId);
    if (!await container.exists() || (await container.getState()).serverId !== serverId) {
      return notFound(c, 'container not found');
    }
    return ok(c, await container.getConfig());
  });
  // IMAGES
  app.get('/api/servers/:id/images', async (c: Context<{ Bindings: Env }>) => {
    const serverId = c.req.param('id');
    await ImageEntity.ensureSeed(c.env);
    const { items } = await ImageEntity.list(c.env, null, 100);
    const serverImages = items.filter(image => image.serverId === serverId);
    return ok(c, serverImages);
  });
  app.post('/api/servers/:serverId/images/:imageId/action', async (c: Context<{ Bindings: Env }>) => {
    const { imageId } = c.req.param();
    const { action } = await c.req.json<{ action: 'pull' | 'remove' }>();
    if (action === 'remove') {
      const deleted = await ImageEntity.delete(c.env, imageId);
      return ok(c, { deleted });
    }
    return ok(c, { message: 'Action not implemented in demo' });
  });
  // AGGREGATED LOGS
  app.get('/api/servers/:id/logs', async (c: Context<{ Bindings: Env }>) => {
    const serverId = c.req.param('id');
    await ContainerEntity.ensureSeed(c.env);
    const { items } = await ContainerEntity.list(c.env, null, 100);
    const serverContainers = items.filter(container => container.serverId === serverId);
    let allLogs: ContainerLog[] = [];
    for (const container of serverContainers) {
        const containerEntity = new ContainerEntity(c.env, container.id);
        const logs = await containerEntity.getLogs();
        allLogs = allLogs.concat(logs);
    }
    allLogs.sort((a, b) => b.timestamp - a.timestamp);
    return ok(c, allLogs.slice(0, 100)); // Limit to 100 most recent logs
  });
}