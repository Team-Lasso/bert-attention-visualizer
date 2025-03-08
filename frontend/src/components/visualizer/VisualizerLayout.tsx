import React, { ReactNode } from "react";

interface VisualizerLayoutProps {
  children: ReactNode;
}

const VisualizerLayout: React.FC<VisualizerLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <div className="flex flex-col space-y-6 max-w-6xl mx-auto p-6">
        {children}
      </div>
    </div>
  );
};

export default VisualizerLayout; 