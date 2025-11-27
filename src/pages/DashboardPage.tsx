import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster, toast } from 'sonner';
import { servers } from '@/lib/api-client';
import type { ServerSummary } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Cpu, MemoryStick, HardDrive, Timer, Docker } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ContainersPage } from './ContainersPage';
const MetricCard = ({ title, value, total, unit, icon: Icon, progress, history }: any) => (
  <Card className="bg-gray-900/50 border-gray-700/50 text-white">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}{unit}</div>
      {total && <p className="text-xs text-gray-500">of {total}{unit}</p>}
      {progress !== undefined && <Progress value={progress} className="mt-2 h-2" />}
      {history && (
        <div className="h-20 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5a4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5a4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#e5e7eb' }} itemStyle={{ color: '#e5e7eb' }} />
              <Area type="monotone" dataKey="value" stroke="#0ea5a4" fillOpacity={1} fill="url(#colorUv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </CardContent>
  </Card>
);
const LoadingSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="bg-gray-900/50 border-gray-700/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20 mt-1" />
          <Skeleton className="h-2 w-full mt-2" />
          <Skeleton className="h-20 w-full mt-4" />
        </CardContent>
      </Card>
    ))}
  </div>
);
export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const serverId = searchParams.get('serverId');
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ServerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!serverId) {
      toast.error("No server selected.");
      navigate('/connections');
      return;
    }
    const fetchSummary = async () => {
      try {
        const data = await servers.getSummary(serverId);
        setSummary(data);
      } catch (error: any) {
        toast.error(`Failed to load server summary: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [serverId, navigate]);
  if (!serverId) return null;
  return (
    <AppLayout container>
      <Toaster richColors theme="dark" />
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-white">Server Dashboard</h1>
        {loading ? <LoadingSkeleton /> : summary && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <MetricCard title="CPU Usage" value={summary.cpu.usage.toFixed(1)} unit="%" icon={Cpu} progress={summary.cpu.usage} history={summary.cpu.history} />
            <MetricCard title="Memory Usage" value={summary.memory.usage.toFixed(1)} total={summary.memory.total} unit="GB" icon={MemoryStick} progress={(summary.memory.usage / summary.memory.total) * 100} history={summary.memory.history} />
            <MetricCard title="Disk Usage" value={summary.disk.usage.toFixed(0)} total={summary.disk.total} unit="GB" icon={HardDrive} progress={(summary.disk.usage / summary.disk.total) * 100} />
            <MetricCard title="Uptime" value={summary.uptime} unit="" icon={Timer} />
            <MetricCard title="Docker Status" value={summary.dockerStatus} unit="" icon={Docker} />
          </div>
        )}
        <div>
          <ContainersPage serverId={serverId} />
        </div>
      </div>
    </AppLayout>
  );
}