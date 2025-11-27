import React, { useEffect, useState, useCallback } from 'react';
import { images } from '@/lib/api-client';
import type { Image } from '@shared/types';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Download, ImageIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
interface ImagesPageProps {
  serverId: string;
}
export function ImagesPage({ serverId }: ImagesPageProps) {
  const [imageList, setImageList] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await images.list(serverId);
      setImageList(data);
    } catch (error: any) {
      toast.error(`Failed to load images: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [serverId]);
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);
  const handleRemove = async (imageId: string) => {
    const originalImages = [...imageList];
    setImageList(prev => prev.filter(img => img.id !== imageId));
    try {
      await images.remove(serverId, imageId);
      toast.success("Image removed successfully.");
    } catch (error: any) {
      toast.error(`Failed to remove image: ${error.message}`);
      setImageList(originalImages);
    }
  };
  return (
    <Card className="bg-gray-900/50 border-gray-700/50 text-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white flex items-center gap-2"><ImageIcon />Docker Images</CardTitle>
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
                <TableHead className="text-gray-400">Repository</TableHead>
                <TableHead className="text-gray-400">Tag</TableHead>
                <TableHead className="text-gray-400">Size</TableHead>
                <TableHead className="text-gray-400">Created</TableHead>
                <TableHead className="text-right text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imageList.map(image => (
                <TableRow key={image.id} className="hover:bg-gray-800/50">
                  <TableCell className="font-medium text-white">{image.repository}</TableCell>
                  <TableCell className="text-gray-400">{image.tag}</TableCell>
                  <TableCell className="text-gray-400">{image.size}</TableCell>
                  <TableCell className="text-gray-400">{formatDistanceToNow(new Date(image.created_ts), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" disabled><Download className="h-4 w-4 text-blue-400" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-400" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the image "{image.repository}:{image.tag}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemove(image.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}