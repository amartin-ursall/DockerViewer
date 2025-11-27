import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Trash2, Edit, Zap } from 'lucide-react';
import type { Connection } from '@shared/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
interface ConnectionListProps {
  connections: Connection[];
  onConnect: (connection: Connection) => void;
  onDelete: (id: string) => void;
  onEdit: (connection: Connection) => void;
  isConnecting: boolean;
  activeConnectionId?: string | null;
}
export function ConnectionList({ connections, onConnect, onDelete, onEdit, isConnecting, activeConnectionId }: ConnectionListProps) {
  return (
    <Card className="w-full h-full bg-[#071431]/50 border-teal-500/20 text-gray-200 flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-teal-400 flex items-center gap-2">
          <Server className="w-5 h-5" />
          <span>Saved Connections</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {connections.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>No saved connections.</p>
                <p className="text-sm">New connections will appear here.</p>
              </div>
            )}
            {connections.map(conn => (
              <div key={conn.id} className="p-3 rounded-lg bg-gray-900/50 border border-gray-700/50 hover:border-teal-500/50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{conn.alias}</p>
                    <p className="text-xs text-gray-400">{conn.user}@{conn.host}:{conn.port}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-teal-400" onClick={() => onConnect(conn)} disabled={isConnecting}>
                      <Zap className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400" onClick={() => onEdit(conn)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the connection "{conn.alias}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(conn.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}