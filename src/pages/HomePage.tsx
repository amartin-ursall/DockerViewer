import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { Server, Zap } from 'lucide-react';
export function HomePage() {
  return (
    <AppLayout className="bg-[#071431]">
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-teal-500/10 [mask-image:linear-gradient(to_bottom,white_5%,transparent_80%)]"></div>
        <div className="text-center space-y-8 relative z-10 animate-fade-in">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shadow-lg shadow-teal-500/10">
              <Server className="w-12 h-12 text-teal-400" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-balance leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Náutica SSH
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto text-pretty">
            A modern, edge-ready panel to connect, save, and manage your remote servers and Docker containers with ease.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-teal-500/20 hover:-translate-y-0.5 transition-all duration-200"
            >
              <Link to="/connections">
                <Zap className="w-5 h-5 mr-2" />
                Get Started
              </Link>
            </Button>
          </div>
        </div>
        <footer className="absolute bottom-8 text-center text-gray-600">
          <p>Built with ❤��� at Cloudflare</p>
        </footer>
      </div>
    </AppLayout>
  );
}