import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { containers } from '@/lib/api-client';
import type { ContainerLog, ContainerStats, ContainerConfig } from '@shared/types';
import { Toaster, toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText, BarChart2, Settings } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
const LogViewer = ({ logs }: { logs: ContainerLog[] }) => (
  <ScrollArea className="h-[500px] bg-black rounded-md p-4 font-mono text-sm">
    {logs.map(log => (
      <div key={log.timestamp} className="flex">
        <span className="text-gray-500 mr-4">{new Date(log.timestamp).toISOString()}</span>
        <span className={log.message.includes('ERROR') ? 'text-red-400' : log.message.includes('WARN') ? 'text-yellow-400' : 'text-gray-300'}>
          {log.message}
        </span>
      </div>
    ))}
  </ScrollArea>
);
const StatsViewer = ({ stats }: { stats: ContainerStats | null }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[500px]">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={stats?.cpu}>
        <defs><linearGradient id="cpuColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="time" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
        <Legend />
        <Area type="monotone" dataKey="value" name="CPU (%)" stroke="#8884d8" fill="url(#cpuColor)" />
      </AreaChart>
    </ResponsiveContainer>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={stats?.memory}>
        <defs><linearGradient id="memColor" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/><stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis dataKey="time" stroke="#888" />
        <YAxis stroke="#888" />
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
        <Legend />
        <Area type="monotone" dataKey="value" name="Memory (MB)" stroke="#82ca9d" fill="url(#memColor)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
const ConfigViewer = ({ config }: { config: ContainerConfig | null }) => (
  <div className="space-y-4 h-[500px] overflow-y-auto">
    <div>
      <h3 className="font-semibold text-lg mb-2">Environment Variables</h3>
      <pre className="bg-black p-4 rounded-md text-sm">{JSON.stringify(config?.env, null, 2)}</pre>
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-2">Volumes</h3>
      <pre className="bg-black p-4 rounded-md text-sm">{JSON.stringify(config?.volumes, null, 2)}</pre>
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-2">Ports</h3>
      <pre className="bg-black p-4 rounded-md text-sm">{JSON.stringify(config?.ports, null, 2)}</pre>
    </div>
  </div>
);
export function ContainerDetailPage() {
  const { serverId, containerId } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ContainerLog[]>([]);
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [config, setConfig] = useState<ContainerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchData = useCallback(async () => {
    if (!serverId || !containerId) return;
    try {
      const [logData, statsData, configData] = await Promise.all([
        containers.getLogs(serverId, containerId),
        containers.getStats(serverId, containerId),
        containers.getConfig(serverId, containerId),
      ]);
      setLogs(logData);
      setStats(statsData);
      setConfig(configData);
    } catch (error: any) {
      toast.error(`Failed to load container details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [serverId, containerId]);
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);
  if (!serverId || !containerId) {
    navigate('/connections');
    return null;
  }
  return (
    <AppLayout container>
      <Toaster richColors theme="dark" />
      <div className="space-y-4">
        <button onClick={() => navigate(`/dashboard?serverId=${serverId}`)} className="flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white">Container Details: <span className="text-teal-400">{containerId}</span></h1>
        <Card className="bg-gray-900/50 border-gray-700/50 text-white">
          <CardContent className="p-0">
            <Tabs defaultValue="logs" className="w-full">
              <TabsList className="bg-gray-900/80 border-b border-gray-700/50 rounded-t-lg rounded-b-none p-2">
                <TabsTrigger value="logs"><FileText className="w-4 h-4 mr-2" />Logs</TabsTrigger>
                <TabsTrigger value="stats"><BarChart2 className="w-4 h-4 mr-2" />Stats</TabsTrigger>
                <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2" />Config</TabsTrigger>
              </TabsList>
              <div className="p-4">
                <TabsContent value="logs">
                  {loading ? <Skeleton className="h-[500px] w-full" /> : <LogViewer logs={logs} />}
                </TabsContent>
                <TabsContent value="stats">
                  {loading ? <Skeleton className="h-[500px] w-full" /> : <StatsViewer stats={stats} />}
                </TabsContent>
                <TabsContent value="config">
                  {loading ? <Skeleton className="h-[500px] w-full" /> : <ConfigViewer config={config} />}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}