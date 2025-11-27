import { IndexedEntity } from "./core-utils";
import type { Server, Container, ContainerStatus, ContainerLog, ContainerStats, ContainerConfig, Image } from "@shared/types";
import { MOCK_SERVERS, MOCK_CONTAINERS, MOCK_LOGS, MOCK_IMAGES } from "@shared/mock-data";
// SERVER ENTITY
export class ServerEntity extends IndexedEntity<Server> {
  static readonly entityName = "server";
  static readonly indexName = "servers";
  static readonly initialState: Server = { id: "", alias: "", host: "", port: 22, user: "", authMethod: 'password', connected: false };
  static seedData = MOCK_SERVERS;
}
// CONTAINER ENTITY
export class ContainerEntity extends IndexedEntity<Container> {
  static readonly entityName = "container";
  static readonly indexName = "containers";
  static readonly initialState: Container = { id: "", serverId: "", name: "", image: "", status: 'stopped', cpu: "0%", memory: "0MB", ports: "", created_ts: 0 };
  static seedData = MOCK_CONTAINERS;
  async setStatus(status: ContainerStatus): Promise<Container> {
    return this.mutate(s => ({ ...s, status }));
  }
  async getLogs(): Promise<ContainerLog[]> {
    // In a real scenario, this would stream from a log store. Here, we simulate.
    return MOCK_LOGS[this.id] || [];
  }
  async getStats(): Promise<ContainerStats> {
    // Simulate stats data
    const now = Date.now();
    const cpu = Array.from({ length: 10 }, (_, i) => ({ time: new Date(now - (10 - i) * 5000).toLocaleTimeString(), value: Math.random() * (this.state.status === 'running' ? 10 : 0) }));
    const memory = Array.from({ length: 10 }, (_, i) => ({ time: new Date(now - (10 - i) * 5000).toLocaleTimeString(), value: Math.random() * (this.state.status === 'running' ? 512 : 0) }));
    return { cpu, memory };
  }
  async getConfig(): Promise<ContainerConfig> {
    return {
      volumes: ['/data:/var/lib/app/data', '/logs:/var/log/app'],
      env: { 'NODE_ENV': 'production', 'API_KEY': '********' },
      ports: { '80/tcp': '8080', '443/tcp': '8443' }
    };
  }
}
// IMAGE ENTITY
export class ImageEntity extends IndexedEntity<Image> {
  static readonly entityName = "image";
  static readonly indexName = "images";
  static readonly initialState: Image = { id: "", serverId: "", repository: "", tag: "", size: "0MB", created_ts: 0 };
  static seedData = MOCK_IMAGES;
}