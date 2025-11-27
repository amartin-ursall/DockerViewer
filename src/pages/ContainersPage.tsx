import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { containers } from '@/lib/api-client';
import type { Container, ContainerStatus } from '@shared/types';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, StopCircle, RefreshCw, Terminal, FileText, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
interface ContainersPageProps {
  serverId: string;
}
const statusColors: Record<ContainerStatus, string> = {
  running: 'bg-green-500/20 text-green-400 border-green-500/30',
  stopped: 'bg-red-500/20 text-red-400 border-red-500/30',
  restarting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};
const ContainerRow = ({ container, onAction, onNavigate, isActionInProgress }: { container: Container, onAction: (id: string, action: 'start' | 'stop' | 'restart') => void, onNavigate: (id: string) => void, isActionInProgress: (id: string) => boolean }) => {
  const isBusy = isActionInProgress(container.id);
  return (
    <TableRow key={container.id} className="hover:bg-gray-800/50">
      <TableCell className="font-medium text-white">{container.name}</TableCell>
      <TableCell className="text-gray-400">{container.image}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn("capitalize", statusColors[container.status])}>
          {container.status}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-400">{container.cpu}</TableCell>
      <TableCell className="text-gray-400">{container.memory}</TableCell>
      <TableCell className="text-gray-400">{container.ports}</TableCell>
      <TableCell className="text-gray-400">{formatDistanceToNow(new Date(container.created_ts), { addSuffix: true })}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {container.status !== 'running' && <Button variant="ghost" size="icon" onClick={() => onAction(container.id, 'start')} disabled={isBusy}><Play className="h-4 w-4 text-green-400" /></Button>}
          {container.status === 'running' && <Button variant="ghost" size="icon" onClick={() => onAction(container.id, 'stop')} disabled={isBusy}><StopCircle className="h-4 w-4 text-red-400" /></Button>}
          <Button variant="ghost" size="icon" onClick={() => onAction(container.id, 'restart')} disabled={isBusy}><RefreshCw className="h-4 w-4 text-yellow-400" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onNavigate(container.id)}><FileText className="h-4 w-4 text-blue-400" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
export function ContainersPage({ serverId }: ContainersPageProps) {
  const [containerList, setContainerList] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string[]>([]);
  const navigate = useNavigate();
  const fetchContainers = useCallback(async () => {
    try {
      const data = await containers.list(serverId);
      setContainerList(data);
    } catch (error: any) {
      toast.error(`Failed to load containers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [serverId]);
  useEffect(() => {
    fetchContainers();
  }, [fetchContainers]);
  const handleAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    setActionInProgress(prev => [...prev, id]);
    // Optimistic update
    const originalContainers = [...containerList];
    setContainerList(prev => prev.map(c => c.id === id ? { ...c, status: action === 'start' ? 'running' : action === 'stop' ? 'stopped' : 'restarting' } : c));
    try {
      const updatedContainer = await containers.performAction(serverId, id, action);
      setContainerList(prev => prev.map(c => c.id === id ? updatedContainer : c));
      toast.success(`Container ${updatedContainer.name} is ${action}ing.`);
    } catch (error: any) {
      toast.error(`Action failed: ${error.message}`);
      setContainerList(originalContainers); // Revert on failure
    } finally {
      setActionInProgress(prev => prev.filter(inProgressId => inProgressId !== id));
      // Refetch to get final state after restart etc.
      setTimeout(fetchContainers, 2500);
    }
  };
  const handleNavigateToDetail = (containerId: string) => {
    navigate(`/servers/${serverId}/containers/${containerId}`);
  };
  return (
    <Card className="bg-gray-900/50 border-gray-700/50 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2"><Box />Containers</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Image</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">CPU</TableHead>
                <TableHead className="text-gray-400">Memory</TableHead>
                <TableHead className="text-gray-400">Ports</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containerList.map(container => (
                <ContainerRow 
                  key={container.id} 
                  container={container} 
                  onAction={handleAction} 
                  onNavigate={handleNavigateToDetail}
                  isActionInProgress={(id) => actionInProgress.includes(id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}