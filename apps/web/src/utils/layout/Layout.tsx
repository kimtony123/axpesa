import React from "react";
import Navbar from "../components/navbar/NavBar";
import Sidebar from "../components/sidebar/Sidebar";
import { useTheme } from "../services/ThemeProvider";

import "./Layout.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarSections?: any[];
  onSectionChange?: (sectionId: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebarSections,
  onSectionChange
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dashboard-layout">
      {/* Navbar at the top, full width */}
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      {/* This row contains sidebar and main content */}
      <div className="dashboard-main-row">
        <Sidebar sections={sidebarSections} onSectionChange={onSectionChange} />
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;