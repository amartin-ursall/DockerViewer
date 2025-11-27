import React, { useEffect, useState, useCallback, useRef } from 'react';
import { logs } from '@/lib/api-client';
import type { ContainerLog } from '@shared/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
interface LogsPageProps {
  serverId: string;
}
const logLevelClasses: Record<ContainerLog['level'], string> = {
  info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  warn: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-300 border-red-500/30',
};
export function LogsPage({ serverId }: LogsPageProps) {
  const [logList, setLogList] = useState<ContainerLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterContainer, setFilterContainer] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fetchLogs = useCallback(async () => {
    try {
      const data = await logs.getServerLogs(serverId);
      setLogList(data);
    } catch (error: any) {
      toast.error(`Failed to load logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [serverId]);
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [logList]);
  const filteredLogs = logList.filter(log =>
    (filterContainer === '' || log.containerName.toLowerCase().includes(filterContainer.toLowerCase())) &&
    (filterLevel === 'all' || log.level === filterLevel)
  );
  return (
    <Card className="bg-gray-900/50 border-gray-700/50 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2"><FileText />Aggregated Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Filter by container name..."
            value={filterContainer}
            onChange={e => setFilterContainer(e.target.value)}
            className="flex-1 bg-gray-900/50 border-gray-700"
          />
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[120px] bg-gray-900/50 border-gray-700">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              {['all', 'info', 'warn', 'error'].map(l => <SelectItem key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <ScrollArea className="h-[600px] bg-black rounded-md p-4 font-mono text-sm" ref={scrollAreaRef}>
            <AnimatePresence initial={false}>
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={`${log.timestamp}-${log.message}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-wrap items-start"
                >
                  <span className="text-gray-500 mr-4 whitespace-nowrap">{new Date(log.timestamp).toISOString()}</span>
                  <Badge variant="outline" className={cn("mr-2 capitalize", logLevelClasses[log.level])}>{log.level}</Badge>
                  <span className="text-teal-400 mr-2 font-bold">[{log.containerName}]</span>
                  <span className={cn("flex-1", `log-${log.level}`)}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}