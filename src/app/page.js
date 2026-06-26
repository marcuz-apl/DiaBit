'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import ExcelGrid from '@/components/ExcelGrid';
import TrajectoryCharts from '@/components/TrajectoryCharts';
import { Layers, HelpCircle, UserCheck, Database, Disc } from 'lucide-react';

export default function Home() {
  const [nodes, setNodes] = useState([]);
  const [activeNode, setActiveNode] = useState(null);
  const [activePoints, setActivePoints] = useState([]);
  const [siblingPoints, setSiblingPoints] = useState([]); // for planned vs actual overlays
  const [currentUser, setCurrentUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load current user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  // Fetch all nodes to keep list in memory for lookup
  const loadNodes = async () => {
    try {
      const res = await fetch('/api/nodes');
      if (res.ok) {
        const data = await res.json();
        setNodes(data);
      }
    } catch (e) {
      console.error("Failed to fetch nodes", e);
    }
  };

  useEffect(() => {
    loadNodes();
  }, [refreshTrigger]);

  // Load points when activeNode changes
  useEffect(() => {
    const loadPoints = async () => {
      if (!activeNode) {
        setActivePoints([]);
        setSiblingPoints([]);
        return;
      }

      try {
        // Load active points
        const res = await fetch(`/api/surveys/${activeNode.id}`);
        if (res.ok) {
          const data = await res.json();
          setActivePoints(data);
        }

        // Find sibling node (e.g. if actual, look for planned sibling and vice-versa)
        // Parent Slot contains both
        const current = nodes.find(n => n.id === activeNode.id);
        if (current) {
          const siblingType = current.type === 'trajectory' ? 'survey' : 'trajectory';
          const sibling = nodes.find(
            n => n.parent_id === current.parent_id && n.type === siblingType && n.id !== current.id
          );

          if (sibling) {
            const sibRes = await fetch(`/api/surveys/${sibling.id}`);
            if (sibRes.ok) {
              const sibData = await sibRes.json();
              setSiblingPoints(sibData);
            }
          } else {
            setSiblingPoints([]);
          }
        }
      } catch (e) {
        console.error("Failed to load points", e);
      }
    };

    loadPoints();
  }, [activeNode, nodes]);

  // Get active well settings
  const getWellSettings = () => {
    if (!activeNode || nodes.length === 0) return null;
    const active = nodes.find(n => n.id === activeNode.id);
    if (!active) return null;

    const slotNode = nodes.find(n => n.id === active.parent_id);
    if (!slotNode) return null;

    const well = nodes.find(n => n.id === slotNode.parent_id);
    if (well && well.type === 'well') {
      return {
        id: well.id,
        name: well.name,
        metadata: well.metadata || {},
        activeTrajMeta: active.metadata || {}
      };
    }
    return null;
  };

  const wellInfo = getWellSettings();
  const units = wellInfo?.metadata?.units || 'metric';
  const vsDirection = wellInfo?.metadata?.vs_direction || 0;
  const tieIn = wellInfo?.activeTrajMeta?.tie_in || { md: 0, inc: 0, az: 0, tvd: 0, north: 0, east: 0 };

  // Overlay logic for plotting Planned vs Actual
  const isPlanned = activeNode?.type === 'trajectory';
  const planPointsForPlot = isPlanned ? activePoints : siblingPoints;
  const actualPointsForPlot = isPlanned ? siblingPoints : activePoints;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      {/* Header Bar */}
      <Header 
        currentUser={currentUser} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar (20%) */}
        <LeftSidebar 
          activeNodeId={activeNode?.id} 
          onSelectNode={setActiveNode} 
          refreshTrigger={refreshTrigger}
          isAdmin={currentUser?.role === 'admin'}
        />

        {/* Center Workspace (60%) */}
        <main className="flex-1 flex flex-col overflow-y-auto px-6 py-4 space-y-4">
          {/* Context bar */}
          <div className="flex items-center justify-between border border-slate-200/60 bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md px-4 py-2 rounded-xl shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              {activeNode ? (
                <>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Active Node: {activeNode.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    {activeNode.type === 'trajectory' ? 'Trajectory Plan' : 'Deviation Survey'}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    ⚠️ Sandbox Sandbox Mode
                  </span>
                  <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    Offline
                  </span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {activeNode ? (
                `Well Reference: ${wellInfo?.name || 'Unknown'} • VS Azimuth: ${vsDirection}°`
              ) : (
                "Select a Trajectory Plan or Survey node to load and save database surveys"
              )}
            </div>
          </div>

          {/* Data Table */}
          <ExcelGrid
            nodeId={activeNode?.id || null}
            initialPoints={activePoints}
            unitSystem={units}
            vsDirection={vsDirection}
            tieIn={tieIn}
            onChange={(newPoints) => {
              setActivePoints(newPoints);
            }}
            onSaveSuccess={(newPoints) => {
              setActivePoints(newPoints);
              // Refresh other components
              setRefreshTrigger(prev => prev + 1);
            }}
          />

          {/* Trajectory Plots */}
          <TrajectoryCharts
            planPoints={planPointsForPlot}
            actualPoints={actualPointsForPlot}
            isDark={true}
            unitSystem={units}
          />
        </main>

        {/* Settings Sidebar (20%) */}
        <RightSidebar
          activeNode={activeNode}
          nodes={nodes}
          onUpdateSettings={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />

      </div>

      {/* Footer Bar */}
      <Footer />
    </div>
  );
}
