import React, { useState, useEffect, useCallback, useRef } from 'react';
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
const DEFAULT_ID_KEY = 'nautica-default-id';
export function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionToEdit, setConnectionToEdit] = useState<Connection | null>(null);
  const navigate = useNavigate();
  const autoConnectAttempted = useRef(false);
  const handleQuickConnect = useCallback(async (connection: Connection) => {
    if (!connection) return;
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
  }, [navigate]);
  useEffect(() => {
    async function loadConnections() {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      let loadedConnections: Connection[] = [];
      if (encryptedData) {
        try {
          loadedConnections = await decryptJSON<Connection[]>(ENCRYPTION_KEY, encryptedData);
          setConnections(loadedConnections);
        } catch (error) {
          console.error("Failed to decrypt connections:", error);
          toast.error("Could not load saved connections. Data might be corrupt.");
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      const encryptedDefault = localStorage.getItem(DEFAULT_ID_KEY);
      if (encryptedDefault && !autoConnectAttempted.current) {
        autoConnectAttempted.current = true;
        try {
          const [decryptedDefaultId] = await decryptJSON<string[]>(ENCRYPTION_KEY, encryptedDefault);
          if (decryptedDefaultId) {
            setDefaultId(decryptedDefaultId);
            const defaultConnection = loadedConnections.find(c => c.id === decryptedDefaultId);
            if (defaultConnection) {
              toast.info(`Attempting to connect to default server: ${defaultConnection.alias}`);
              await handleQuickConnect(defaultConnection);
            } else {
              localStorage.removeItem(DEFAULT_ID_KEY);
              setDefaultId(null);
            }
          }
        } catch (error) {
          console.error("Failed to decrypt default ID:", error);
          localStorage.removeItem(DEFAULT_ID_KEY);
        }
      } else if (loadedConnections.length > 0 && !encryptedDefault) {
        toast.info("Set a default connection for quick access.", { duration: 5000 });
      }
    }
    loadConnections();
  }, [handleQuickConnect]);
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
        const newServerData = { alias: data.alias, host: data.host, port: data.port, user: data.user, authMethod: data.authMethod };
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
  const handleDelete = (id: string) => {
    const updated = connections.filter(c => c.id !== id);
    saveConnections(updated);
    if (id === defaultId) {
      localStorage.removeItem(DEFAULT_ID_KEY);
      setDefaultId(null);
    }
    toast.success("Connection deleted.");
  };
  const handleEdit = (connection: Connection) => {
    setConnectionToEdit(connection);
  };
  const handleSetDefault = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      try {
        const encrypted = await encryptJSON<string[]>(ENCRYPTION_KEY, [id]);
        localStorage.setItem(DEFAULT_ID_KEY, encrypted);
        setDefaultId(id);
        toast.success("Default connection set.");
      } catch (error) {
        toast.error("Failed to set default connection.");
      }
    } else {
      localStorage.removeItem(DEFAULT_ID_KEY);
      setDefaultId(null);
      toast.success("Default connection cleared.");
    }
  };
  const connectionsWithDefault = connections.map(c => ({ ...c, isDefault: c.id === defaultId }));
  return (
    <AppLayout container={false} className="h-screen overflow-hidden">
      <Toaster richColors theme="dark" />
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <div className="h-full p-4">
            <ConnectionList
              connections={connectionsWithDefault}
              onConnect={handleQuickConnect}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onSetDefault={handleSetDefault}
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