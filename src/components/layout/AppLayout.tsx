import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className={cn("bg-[#071431] text-gray-200", className)}>
        <div className="absolute left-4 top-4 z-20 md:hidden">
          <SidebarTrigger />
        </div>
        {container ? (
          <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", contentClassName)}>
            <div className="py-8 md:py-10 lg:py-12">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}