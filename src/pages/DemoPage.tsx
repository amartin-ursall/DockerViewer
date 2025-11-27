import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
export function DemoPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/');
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <p>Redirecting to the main application...</p>
    </div>
  );
}