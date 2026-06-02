// components/layout/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';
import { motion } from 'framer-motion';
import { PanelLeft } from 'lucide-react';

export const MainLayout: React.FC = () => {
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <div className="md:hidden sticky top-0 z-40 h-12 flex items-center bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="px-2">
              <SidebarTrigger className="inline-flex items-center justify-center rounded-md h-9 w-9 border hover:bg-accent">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle sidebar</span>
              </SidebarTrigger>
            </div>
            <div className="flex-1">
              <Navbar />
            </div>
          </div>

          <div className="hidden md:block">
            <Navbar />
          </div>

          <main className="flex-1 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6"
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
