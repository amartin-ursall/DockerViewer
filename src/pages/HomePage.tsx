import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';
export function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/connections', { replace: true });
  }, [navigate]);
  return (
    <AppLayout container>
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    </AppLayout>
  );
}