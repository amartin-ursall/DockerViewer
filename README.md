# Náutica — Panel SSH + Docker

Náutica is a modern web application for connecting to remote servers via SSH, saving connection profiles securely, and managing Docker containers running on those servers. Designed with a stunning visual interface featuring a deep navy blue theme and harmonious accents, it provides an intuitive experience for server administration. The initial version is an edge-ready demo built with Cloudflare Workers and Durable Objects for simulated backend functionality. In production, integrate with a secure Node.js Connector service for real SSH and Docker operations.

[cloudflarebutton]

## Features

- **SSH Connection Management**: Securely connect to remote servers with support for password or private key authentication. Save and manage connection profiles with AES-GCM encryption via Web Crypto API.
- **Connection List**: Sidebar for quick access to saved connections, with actions to connect, edit, delete, or duplicate.
- **Dashboard Overview**: Real-time server metrics (CPU, RAM, disk, uptime, Docker status) in elegant cards with smooth animations.
- **Docker Container Management**: Responsive table/grid view of containers with per-row actions (start, stop, restart, view logs, open terminal) and global controls (refresh, create new).
- **Container Details**: In-depth view with live logs (polling in demo; SSE in production), full configuration (volumes, env vars, ports), individual stats with mini-charts, and interactive terminal modal.
- **Visual Excellence**: Deep navy (#071431) theme with teal (#0ea5a4) accents and warm highlights (#ffc07f). Mobile-first responsive design, micro-interactions via Framer Motion, and shadcn/ui components for professional polish.
- **Demo Backend**: Simulated APIs using Cloudflare Durable Objects for persistence and state management, enabling a fully functional demo without external infrastructure.
- **Production Ready**: Extensible architecture for integrating a Node.js Connector (using ssh2 and dockerode) via secure API proxy.

## Technology Stack

- **Frontend**: React 18, React Router 6, TypeScript, Tailwind CSS 3, shadcn/ui (Radix UI primitives), Framer Motion (animations), Recharts (charts), Zustand (state), TanStack Query (data fetching), Sonner (toasts), Lucide React (icons), @dnd-kit (drag & drop).
- **Backend**: Cloudflare Workers (Hono routing), Durable Objects (stateful simulation via IndexedEntity library).
- **Security**: Web Crypto API (AES-GCM for encryption), secure credential handling (no plaintext storage).
- **Build Tools**: Vite (bundler), Bun (package manager), Wrangler (Cloudflare deployment).
- **Production Extensions**: Node.js Connector (ssh2 for SSH, dockerode for Docker, Express/Fastify for API, SSE for streaming).

## Quick Start

To get started immediately, click the deploy button above to deploy to Cloudflare Workers. This sets up the edge-ready demo with simulated SSH/Docker functionality.

For local development, follow the installation steps below.

## Installation

This project uses Bun as the package manager. Ensure you have Bun installed (v1.0+).

1. Clone the repository:
   ```
   git clone <repository-url>
   cd nautica-ssh-docker
   ```

2. Install dependencies:
   ```
   bun install
   ```

3. Set up Cloudflare bindings (for Durable Objects):
   - Ensure you have a Cloudflare account and Wrangler CLI installed (`bunx wrangler login`).
   - The `wrangler.jsonc` file is preconfigured with a single `GlobalDurableObject` binding.

4. Run the development server:
   ```
   bun run dev
   ```
   The app will be available at `http://localhost:3000` (or the port specified in `$PORT`).

## Usage

### Core Workflow
1. **Connect to a Server**: On the Connections page (`/`), enter SSH details (host, port 22 default, username, auth method: password or private key). Optionally save the connection (encrypted locally). Click "Connect" to simulate connection (demo) or establish real SSH (production).
2. **View Dashboard**: Upon success, navigate to the Dashboard showing server metrics and navigation to Containers, Images, Logs, etc.
3. **Manage Containers**: In the Containers view, list Docker containers with actions like start/stop/restart. Click a row for details (logs, config, stats, terminal).
4. **Saved Connections**: Use the sidebar to manage and reconnect to saved profiles.

### API Endpoints (Demo)
The backend simulates operations via Durable Objects. Extend in `worker/user-routes.ts`:
- `POST /api/servers/connect`: Simulate SSH connection and create server entity.
- `GET /api/servers/:id/containers`: List containers.
- `POST /api/servers/:id/containers/:containerId/start`: Simulate start action.

Frontend consumes these via `src/lib/api-client.ts`. For production, proxy to your Node.js Connector.

### Example: Creating a Connection (Frontend Code Snippet)
```tsx
// In SSHConnectForm component
const { register, handleSubmit } = useForm<ConnectionFormData>();
const onSubmit = async (data: ConnectionFormData) => {
  // Encrypt sensitive fields with Web Crypto
  const encrypted = await encryptCredentials(data);
  await api('/api/servers/connect', { method: 'POST', body: JSON.stringify(encrypted) });
  toast.success('Connected!');
};
```

## Development

### Project Structure
- **Frontend (`src/`)**: React components, pages (e.g., `src/pages/HomePage.tsx` as entry), hooks, utilities. Use shadcn/ui from `@/components/ui/*`.
- **Backend (`worker/`)**: Hono routes in `user-routes.ts`, entities in `entities.ts` extending `IndexedEntity` for DO persistence. Do not modify `core-utils.ts` or `index.ts`.
- **Shared (`shared/`)**: Types (`types.ts`) and mock data.
- **Routing**: Add pages to `src/main.tsx` via React Router. Wrap with `AppLayout` for sidebar.
- **State Management**: Use Zustand with primitive selectors only (e.g., `useStore(s => s.value)`). Avoid object selectors to prevent re-render loops.
- **Styling**: Tailwind v3-safe utilities, custom colors in `tailwind.config.js` (navy theme: primary #071431, accent #0ea5a4). Root wrapper for gutters: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
- **Linting & TypeScript**: Run `bun run lint`. Strict TS config in `tsconfig.json`.

### Adding New Entities (Backend)
Extend `IndexedEntity` in `worker/entities.ts`:
```ts
export class ServerEntity extends IndexedEntity<ServerState> {
  static readonly entityName = "server";
  static readonly indexName = "servers";
  // ... initialState, methods
}
```
Add routes in `user-routes.ts` using `ok/bad` helpers.

### Running Tests
No tests preconfigured. Add via Vitest or Playwright as needed.

### Common Pitfalls
- **Infinite Loops**: Follow React/Zustand rules – no setState in render, primitive selectors only.
- **DO Limits**: Use for simulation; offload large data to external storage in production.
- **No Sockets in Workers**: SSH/TTY requires external Connector.

## Deployment

Deploy to Cloudflare Workers for edge execution. The template is preconfigured.

1. Build the project:
   ```
   bun run build
   ```

2. Deploy:
   ```
   bun run deploy
   ```
   This uses Wrangler to publish the Worker and assets.

For custom domains or environments:
- Edit `wrangler.jsonc` (name, compatibility_date).
- Use `wrangler deploy --env production` for multi-env.
- Assets (built React) are served via SPA handling.

[cloudflarebutton]

Production Integration:
- Deploy a Node.js Connector service (e.g., on your server/VPS) exposing HTTPS API.
- Update Worker routes to proxy requests to Connector with auth tokens.
- Enable Docker Engine API or use dockerode in Connector.

## Contributing

Contributions welcome! Fork the repo, create a feature branch, and submit a PR. Focus on visual polish, error handling, and production security.

1. Install dependencies: `bun install`.
2. Make changes.
3. Test locally: `bun run dev`.
4. Lint: `bun run lint`.
5. Build & deploy: `bun run build && bun run deploy`.

## License

MIT License. See LICENSE file for details (or add one if missing).