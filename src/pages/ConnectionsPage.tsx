import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SSHConnectForm } from '@/components/SSHConnectForm';
import { ConnectionList } from '@/components/ConnectionList';
import { Toaster, toast } from 'sonner';
import { encryptJSON, decryptJSON } from '@/lib/crypto';
import { servers } from '@/lib/api-client';
import type { Connection } from '@shared/types';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
const ENCRYPTION_KEY = 'nautica-super-secret-key'; // In a real app, this should be derived from a user password
const STORAGE_KEY = 'nautica-connections';
export function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionToEdit, setConnectionToEdit] = useState<Connection | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    async function loadConnections() {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (encryptedData) {
        try {
          const decrypted = await decryptJSON<Connection[]>(ENCRYPTION_KEY, encryptedData);
          setConnections(decrypted);
        } catch (error) {
          console.error("Failed to decrypt connections:", error);
          toast.error("Could not load saved connections. Data might be corrupt.");
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
    loadConnections();
  }, []);
  const saveConnections = async (updatedConnections: Connection[]) => {
    try {
      const encryptedData = await encryptJSON(ENCRYPTION_KEY, updatedConnections);
      localStorage.setItem(STORAGE_KEY, encryptedData);
      setConnections(updatedConnections);
    } catch (error) {
      toast.error("Failed to save connections.");
    }
  };
  const handleConnect = async (data: any) => {
    setIsConnecting(true);
    try {
      let serverInDb;
      const existing = connections.find(c => c.host === data.host && c.user === data.user);
      if (existing) {
        serverInDb = await servers.connect(existing.id);
      } else {
        // This is a mock creation for demo purposes
        const newServerData = {
          alias: data.alias,
          host: data.host,
          port: data.port,
          user: data.user,
          authMethod: data.authMethod,
        };
        const createdServer = await servers.create(newServerData);
        serverInDb = await servers.connect(createdServer.id);
        if (data.saveConnection) {
            const newConnection: Connection = { ...createdServer, id: createdServer.id };
            await saveConnections([...connections, newConnection]);
        }
      }
      toast.success(`Connected to ${serverInDb.alias}`);
      navigate(`/dashboard?serverId=${serverInDb.id}`);
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };
  const handleQuickConnect = async (connection: Connection) => {
    setIsConnecting(true);
    try {
      const server = await servers.connect(connection.id);
      toast.success(`Connected to ${server.alias}`);
      navigate(`/dashboard?serverId=${server.id}`);
    } catch (error: any) {
      toast.error(`Connection failed: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };
  const handleDelete = (id: string) => {
    const updated = connections.filter(c => c.id !== id);
    saveConnections(updated);
    toast.success("Connection deleted.");
  };
  const handleEdit = (connection: Connection) => {
    setConnectionToEdit(connection);
  };
  return (
    <AppLayout container={false} className="h-screen overflow-hidden">
      <Toaster richColors theme="dark" />
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full p-4">
            <ConnectionList 
              connections={connections} 
              onConnect={handleQuickConnect}
              onDelete={handleDelete}
              onEdit={handleEdit}
              isConnecting={isConnecting}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70}>
          <div className="flex items-center justify-center h-full p-4">
            <SSHConnectForm onConnect={handleConnect} isConnecting={isConnecting} connectionToEdit={connectionToEdit} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </AppLayout>
  );
}