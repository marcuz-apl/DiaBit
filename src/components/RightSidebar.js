'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Map, Compass, Sliders, Menu, ChevronRight, ChevronLeft } from 'lucide-react';

export default function RightSidebar({
  activeNode,
  nodes = [],
  onUpdateSettings = () => {}
}) {
  const [wellNode, setWellNode] = useState(null);
  const [units, setUnits] = useState('metric');
  const [vsDirection, setVsDirection] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [easting, setEasting] = useState(0);
  const [northing, setNorthing] = useState(0);

  // Tie-in settings (specific to trajectory metadata or defaults)
  const [tieInMd, setTieInMd] = useState(0);
  const [tieInInc, setTieInInc] = useState(0);
  const [tieInAz, setTieInAz] = useState(0);
  const [tieInTvd, setTieInTvd] = useState(0);
  const [tieInNorth, setTieInNorth] = useState(0);
  const [tieInEast, setTieInEast] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  
  // Collapse/Autohide state
  const [isOpen, setIsOpen] = useState(true);
  const idleTimerRef = useRef(null);

  // Autohide idle logic: 30 seconds of inactivity collapses the sidebar
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      idleTimerRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 30000); // 30 seconds
    };

    // Listen to mouse movement and inputs
    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('mousedown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('mousedown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
    };
  }, []);

  // Locate the well node in the hierarchy whenever activeNode changes
  useEffect(() => {
    if (!activeNode || nodes.length === 0) {
      setWellNode(null);
      return;
    }

    // Climb: Active Node (Trajectory/Survey) -> Parent (Slot) -> Parent (Well)
    const active = nodes.find(n => n.id === activeNode.id);
    if (!active) return;

    const slotNode = nodes.find(n => n.id === active.parent_id);
    if (!slotNode) return;

    const well = nodes.find(n => n.id === slotNode.parent_id);
    if (well && well.type === 'well') {
      setWellNode(well);
      
      const meta = well.metadata || {};
      setUnits(meta.units || 'metric');
      setVsDirection(meta.vs_direction || 0);
      setElevation(meta.elevation || 0);
      setLatitude(meta.latitude || 0);
      setLongitude(meta.longitude || 0);
      setEasting(meta.easting || 0);
      setNorthing(meta.northing || 0);

      // Trajectory specific tie-in settings
      const trajMeta = active.metadata || {};
      const tie = trajMeta.tie_in || { md: 0, inc: 0, az: 0, tvd: 0, north: 0, east: 0 };
      setTieInMd(tie.md || 0);
      setTieInInc(tie.inc || 0);
      setTieInAz(tie.az || 0);
      setTieInTvd(tie.tvd || 0);
      setTieInNorth(tie.north || 0);
      setTieInEast(tie.east || 0);
    }
  }, [activeNode, nodes]);

  const handleSaveSettings = async () => {
    if (!wellNode || !activeNode) return;
    setIsSaving(true);

    try {
      // 1. Update Well metadata
      const wellMetaUpdate = {
        units,
        vs_direction: parseFloat(vsDirection) || 0,
        elevation: parseFloat(elevation) || 0,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        easting: parseFloat(easting) || 0,
        northing: parseFloat(northing) || 0
      };

      const wellRes = await fetch(`/api/nodes/${wellNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: wellMetaUpdate })
      });

      if (!wellRes.ok) throw new Error("Failed to update well settings");

      // 2. Update Trajectory/Survey tie-in metadata
      const trajMetaUpdate = {
        tie_in: {
          md: parseFloat(tieInMd) || 0,
          inc: parseFloat(tieInInc) || 0,
          az: parseFloat(tieInAz) || 0,
          tvd: parseFloat(tieInTvd) || 0,
          north: parseFloat(tieInNorth) || 0,
          east: parseFloat(tieInEast) || 0
        }
      };

      const trajRes = await fetch(`/api/nodes/${activeNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: trajMetaUpdate })
      });

      if (!trajRes.ok) throw new Error("Failed to update trajectory settings");

      // Trigger app refresh
      onUpdateSettings();
      alert("Settings saved. Calculating directional path...");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const lenLabel = units === 'imperial' ? 'ft' : 'm';

  return (
    <div 
      className={`relative h-full border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:backdrop-blur-md transition-all duration-300 z-30 flex flex-col shrink-0 ${
        isOpen ? 'w-64' : 'w-4'
      }`}
    >
      {/* Expand hover trigger for Right edge */}
      {!isOpen && (
        <div 
          onMouseEnter={() => setIsOpen(true)}
          className="absolute top-0 right-0 w-4 h-full cursor-pointer hover:bg-blue-500/10 transition flex items-center justify-center text-slate-400 hover:text-blue-500"
        >
          <Menu className="h-4 w-4" />
        </div>
      )}

      {/* Main Settings Panel Content */}
      <div className={`flex flex-col h-full overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {!activeNode || !wellNode ? (
          <div className="h-full p-4 flex flex-col justify-center items-center text-center text-slate-400 text-xs">
            <Settings className="h-8 w-8 mb-2 text-slate-300 dark:text-slate-700 animate-spin-slow" />
            Select a Trajectory Plan or Deviation Survey to configure settings.
          </div>
        ) : (
          <div className="flex flex-col h-full p-4 overflow-y-auto">
            {/* Header section with collapse toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-sm">Calculation Settings</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Config Fields */}
            <div className="flex-1 space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Section 1: Units & Direction */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  <Compass className="h-3.5 w-3.5 text-blue-400" />
                  General Parameters
                </div>
                
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400">Unit System</label>
                  <select
                    value={units}
                    onChange={(e) => setUnits(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-100"
                  >
                    <option value="metric">Metric (meters, deg/30m)</option>
                    <option value="imperial">Imperial (feet, deg/100ft)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-400">Vertical Section Direction (° Azimuth)</label>
                  <input
                    type="number"
                    value={vsDirection}
                    onChange={(e) => setVsDirection(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 text-right"
                  />
                </div>
              </div>

              {/* Section 2: Wellhead Location */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  <Map className="h-3.5 w-3.5 text-blue-400" />
                  Wellhead Reference (UTM/Local)
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">Easting (X)</label>
                    <input
                      type="number"
                      value={easting}
                      onChange={(e) => setEasting(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Northing (Y)</label>
                    <input
                      type="number"
                      value={northing}
                      onChange={(e) => setNorthing(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-850 dark:text-slate-100 text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400">Wellhead Elevation ({lenLabel})</label>
                  <input
                    type="number"
                    value={elevation}
                    onChange={(e) => setElevation(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-855 dark:text-slate-100 text-right"
                  />
                </div>
              </div>

              {/* Section 3: Tie-in Point */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  <Sliders className="h-3.5 w-3.5 text-blue-400" />
                  Tie-in Station (Reference)
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">MD ({lenLabel})</label>
                    <input
                      type="number"
                      value={tieInMd}
                      onChange={(e) => setTieInMd(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-855 dark:text-slate-100 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">TVD ({lenLabel})</label>
                    <input
                      type="number"
                      value={tieInTvd}
                      onChange={(e) => setTieInTvd(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-855 dark:text-slate-100 text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">Inc (deg)</label>
                    <input
                      type="number"
                      value={tieInInc}
                      onChange={(e) => setTieInInc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-855 dark:text-slate-100 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Az (deg)</label>
                    <input
                      type="number"
                      value={tieInAz}
                      onChange={(e) => setTieInAz(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-855 dark:text-slate-100 text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400">Northing ({lenLabel})</label>
                    <input
                      type="number"
                      value={tieInNorth}
                      onChange={(e) => setTieInNorth(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-855 dark:text-slate-100 text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">Easting ({lenLabel})</label>
                    <input
                      type="number"
                      value={tieInEast}
                      onChange={(e) => setTieInEast(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 focus:border-blue-500 outline-none text-slate-855 dark:text-slate-100 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="mt-6 flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded shadow transition shrink-0"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
