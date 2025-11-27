import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyRound, Lock, Server, User, FileUp, ClipboardPaste } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Connection, AuthMethod } from '@shared/types';
const formSchema = z.object({
  alias: z.string().min(1, 'Alias is required'),
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1).max(65535),
  user: z.string().min(1, 'User is required'),
  authMethod: z.enum(['password', 'privateKey']),
  password: z.string().optional(),
  privateKey: z.string().optional(),
  saveConnection: z.boolean(),
}).refine(data => {
    if (data.authMethod === 'password') return !!data.password && data.password.length > 0;
    return true;
}, { message: 'Password is required', path: ['password'] })
.refine(data => {
    if (data.authMethod === 'privateKey') return !!data.privateKey && data.privateKey.length > 0;
    return true;
}, { message: 'Private key is required', path: ['privateKey'] });
type ConnectionFormData = z.infer<typeof formSchema>;
interface SSHConnectFormProps {
  onConnect: (data: ConnectionFormData) => void;
  isConnecting: boolean;
  connectionToEdit?: Connection | null;
}
export function SSHConnectForm({ onConnect, isConnecting, connectionToEdit }: SSHConnectFormProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>(connectionToEdit?.authMethod || 'password');
  const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<ConnectionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      alias: connectionToEdit?.alias || 'New Server',
      host: connectionToEdit?.host || '192.168.1.1',
      port: connectionToEdit?.port || 22,
      user: connectionToEdit?.user || 'root',
      authMethod: authMethod,
      password: '',
      privateKey: '',
      saveConnection: true,
    },
  });
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setValue('privateKey', e.target?.result as string, { shouldValidate: true });
      };
      reader.readAsText(file);
    }
  };
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setValue('privateKey', text, { shouldValidate: true });
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
    }
  };
  return (
    <Card className="w-full max-w-2xl bg-[#071431]/80 border-teal-500/20 text-gray-200 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-teal-400 flex items-center gap-2">
          <Server className="w-6 h-6" />
          <span>Connect to Server</span>
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onConnect)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input id="alias" placeholder="My Web Server" {...register('alias')} className="bg-gray-900/50 border-gray-700" />
              {errors.alias && <p className="text-red-400 text-sm">{errors.alias.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="host">Host / IP Address</Label>
              <Input id="host" placeholder="192.168.1.1" {...register('host')} className="bg-gray-900/50 border-gray-700" />
              {errors.host && <p className="text-red-400 text-sm">{errors.host.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input id="port" type="number" {...register('port')} className="bg-gray-900/50 border-gray-700" />
              {errors.port && <p className="text-red-400 text-sm">{errors.port.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Input id="user" placeholder="root" {...register('user')} className="bg-gray-900/50 border-gray-700" />
              {errors.user && <p className="text-red-400 text-sm">{errors.user.message}</p>}
            </div>
          </div>
          <Tabs value={authMethod} onValueChange={(v) => { setAuthMethod(v as AuthMethod); setValue('authMethod', v as AuthMethod); }} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
              <TabsTrigger value="password"><Lock className="w-4 h-4 mr-2" />Password</TabsTrigger>
              <TabsTrigger value="privateKey"><KeyRound className="w-4 h-4 mr-2" />Private Key</TabsTrigger>
            </TabsList>
            <TabsContent value="password" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} className="bg-gray-900/50 border-gray-700" />
                {errors.password && <p className="text-red-400 text-sm">{errors.password.message}</p>}
              </div>
            </TabsContent>
            <TabsContent value="privateKey" className="mt-4">
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key</Label>
                <Textarea id="privateKey" placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" {...register('privateKey')} className="bg-gray-900/50 border-gray-700 min-h-[120px] font-mono text-xs" />
                {errors.privateKey && <p className="text-red-400 text-sm">{errors.privateKey.message}</p>}
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" className="text-teal-400 border-teal-400/50 hover:bg-teal-400/10 hover:text-teal-300" onClick={handlePaste}><ClipboardPaste className="w-4 h-4 mr-2" />Paste</Button>
                  <Button asChild type="button" variant="outline" className="text-teal-400 border-teal-400/50 hover:bg-teal-400/10 hover:text-teal-300">
                    <Label className="flex items-center cursor-pointer"><FileUp className="w-4 h-4 mr-2" />Upload File<input type="file" className="hidden" onChange={handleFileChange} /></Label>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex items-center space-x-2 pt-4">
            <Controller
              name="saveConnection"
              control={control}
              render={({ field }) => (
                <Checkbox id="saveConnection" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="saveConnection" className="cursor-pointer">Save this connection</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg" disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}