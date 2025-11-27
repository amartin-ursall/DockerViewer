import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Server, Trash2, Edit, Zap, GripVertical } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
interface ConnectionItemProps {
  connection: Connection;
  onConnect: (connection: Connection) => void;
  onDelete: (id: string) => void;
  onEdit: (connection: Connection) => void;
  isConnecting: boolean;
  isDraggable?: boolean;
}
const ConnectionItem = ({ connection, onConnect, onDelete, onEdit, isConnecting, isDraggable }: ConnectionItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: connection.id, disabled: !isDraggable });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="p-3 rounded-lg bg-gray-900/50 border border-gray-700/50 hover:border-teal-500/50 transition-all duration-200 flex items-center gap-2">
      {isDraggable && (
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="w-5 h-5 text-gray-500" />
        </button>
      )}
      <div className="flex-grow">
        <p className="font-semibold text-white">{connection.alias}</p>
        <p className="text-xs text-gray-400">{connection.user}@{connection.host}:{connection.port}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-teal-400" onClick={() => onConnect(connection)} disabled={isConnecting}>
          <Zap className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-yellow-400" onClick={() => onEdit(connection)}>
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
                This will permanently delete the connection "{connection.alias}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(connection.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
interface ConnectionListProps {
  connections: Connection[];
  onConnect: (connection: Connection) => void;
  onDelete: (id: string) => void;
  onEdit: (connection: Connection) => void;
  isConnecting: boolean;
  children?: React.ReactNode; // For DndContext
}
export function ConnectionList({ connections, onConnect, onDelete, onEdit, isConnecting, children }: ConnectionListProps) {
  const content = (
    <div className="p-4 space-y-3">
      {connections.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No saved connections.</p>
          <p className="text-sm">New connections will appear here.</p>
        </div>
      )}
      {connections.map(conn => (
        <ConnectionItem
          key={conn.id}
          connection={conn}
          onConnect={onConnect}
          onDelete={onDelete}
          onEdit={onEdit}
          isConnecting={isConnecting}
          isDraggable={!!children}
        />
      ))}
    </div>
  );
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
          {children ? children : content}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
export { ConnectionItem };