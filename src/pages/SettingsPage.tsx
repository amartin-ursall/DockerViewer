import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConnectionList, ConnectionItem } from '@/components/ConnectionList';
import { Toaster, toast } from 'sonner';
import { encryptJSON, decryptJSON } from '@/lib/crypto';
import type { Connection } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Settings as SettingsIcon, Download, Upload } from 'lucide-react';
const ENCRYPTION_KEY = 'nautica-super-secret-key';
const STORAGE_KEY = 'nautica-connections';
export function SettingsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pollingInterval, setPollingInterval] = useState(5);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  useEffect(() => {
    async function loadData() {
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (encryptedData) {
        try {
          const decrypted = await decryptJSON<Connection[]>(ENCRYPTION_KEY, encryptedData);
          setConnections(decrypted);
        } catch (error) {
          toast.error("Could not load saved connections.");
        }
      }
      const interval = localStorage.getItem('nautica-polling-interval');
      if (interval) setPollingInterval(parseInt(interval, 10));
    }
    loadData();
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
  const handleDelete = (id: string) => {
    const updated = connections.filter(c => c.id !== id);
    saveConnections(updated);
    toast.success("Connection deleted.");
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setConnections((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        saveConnections(newOrder);
        return newOrder;
      });
    }
  };
  const handleExport = async () => {
    try {
      const encrypted = await encryptJSON(ENCRYPTION_KEY, connections);
      const blob = new Blob([encrypted], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'nautica-connections.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Connections exported successfully.");
    } catch (error) {
      toast.error("Failed to export connections.");
    }
  };
  const handleSaveSettings = () => {
    localStorage.setItem('nautica-polling-interval', pollingInterval.toString());
    toast.success("Settings saved.");
  };
  return (
    <AppLayout container>
      <Toaster richColors theme="dark" />
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2"><SettingsIcon />Settings</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700/50 text-white">
              <CardHeader><CardTitle>Manage Connections</CardTitle></CardHeader>
              <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={connections} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {connections.map(conn => (
                        <ConnectionItem
                          key={conn.id}
                          connection={conn}
                          onConnect={() => {}}
                          onDelete={handleDelete}
                          onEdit={() => {}}
                          isConnecting={false}
                          isDraggable
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleExport} variant="outline" className="text-teal-400 border-teal-400/50 hover:bg-teal-400/10 hover:text-teal-300"><Download className="w-4 h-4 mr-2" />Export</Button>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700/50 text-white">
              <CardHeader><CardTitle>Application Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="polling-interval">Polling Interval (seconds)</Label>
                  <Input
                    id="polling-interval"
                    type="number"
                    value={pollingInterval}
                    onChange={(e) => setPollingInterval(parseInt(e.target.value, 10))}
                    className="bg-gray-900/50 border-gray-700"
                  />
                </div>
                <Button onClick={handleSaveSettings} className="bg-teal-500 hover:bg-teal-600">Save Settings</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}