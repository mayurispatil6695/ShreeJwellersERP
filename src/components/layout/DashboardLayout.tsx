import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-secondary/20 pointer-events-none" />
      
      <Sidebar />
      
      {/* Main content area - responsive padding for sidebar */}
      <div className="lg:pl-64 transition-all duration-300 relative">
        <Header />
        <main className="p-3 sm:p-6 max-w-[1800px] mx-auto">{children}</main>
      </div>
      
      {/* Ambient glow effects - hidden on mobile for performance */}
      <div className="hidden sm:block fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-30" 
           style={{ background: 'radial-gradient(ellipse at center, hsl(43, 74%, 53%, 0.15), transparent 70%)' }} />
      <div className="hidden sm:block fixed bottom-0 right-0 w-[600px] h-[300px] pointer-events-none opacity-20" 
           style={{ background: 'radial-gradient(ellipse at center, hsl(15, 60%, 55%, 0.15), transparent 70%)' }} />
    </div>
  );
}
