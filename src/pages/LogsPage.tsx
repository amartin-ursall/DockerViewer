import React, { useEffect, useState, useCallback } from 'react';
import { logs } from '@/lib/api-client';
import type { ContainerLog } from '@shared/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
interface LogsPageProps {
  serverId: string;
}
const logLevelClasses: Record<ContainerLog['level'], string> = {
  info: 'log-info',
  warn: 'log-warn',
  error: 'log-error',
};
export function LogsPage({ serverId }: LogsPageProps) {
  const [logList, setLogList] = useState<ContainerLog[]>([]);
  const [loading, setLoading] = useState(true);
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
  return (
    <Card className="bg-gray-900/50 border-gray-700/50 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2"><FileText />Aggregated Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[600px] w-full" />
        ) : (
          <ScrollArea className="h-[600px] bg-black rounded-md p-4 font-mono text-sm">
            <AnimatePresence initial={false}>
              {logList.map(log => (
                <motion.div
                  key={log.timestamp + log.message}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-wrap"
                >
                  <span className="text-gray-500 mr-4 whitespace-nowrap">{new Date(log.timestamp).toISOString()}</span>
                  <span className="text-teal-400 mr-2 font-bold">[{log.containerName}]</span>
                  <span className={cn("flex-1", logLevelClasses[log.level])}>
                    {log.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}