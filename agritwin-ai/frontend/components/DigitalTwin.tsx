import React from 'react';
import { FarmState, ToolType } from '../types.ts';
import { Droplets, Sprout, Camera, Scissors, Crosshair } from 'lucide-react';

interface DigitalTwinProps {
  state: FarmState;
}

const ToolIcon = ({ tool, className }: { tool: ToolType; className?: string }) => {
  switch (tool) {
    case 'water_nozzle': return <Droplets className={className} />;
    case 'seeder': return <Sprout className={className} />;
    case 'camera': return <Camera className={className} />;
    case 'weeder': return <Scissors className={className} />;
    default: return <Crosshair className={className} />;
  }
};

export const DigitalTwin: React.FC<DigitalTwinProps> = ({ state }) => {
  // Grid is 10x10. We map 0-10 coordinates to percentages for positioning.
  const getPositionStyle = (val: number) => `${(val / 10) * 100}%`;

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
      {/* Header Stats */}
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <Sprout size={20} />
            AgriTwin Gantry Status
          </h2>
          <p className="text-xs text-slate-400 mt-1">Live Digital Twin Telemetry</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="bg-slate-800 px-3 py-1.5 rounded-md border border-slate-600 flex flex-col items-center">
            <span className="text-slate-400 text-xs">Moisture</span>
            <span className="font-mono text-blue-400">{state.soilMoisture}%</span>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-md border border-slate-600 flex flex-col items-center">
            <span className="text-slate-400 text-xs">Temp</span>
            <span className="font-mono text-orange-400">{state.temperature}°C</span>
          </div>
        </div>
      </div>

      {/* Main 3D/2D View Area */}
      <div className="flex-1 p-6 relative flex items-center justify-center bg-slate-800/50">
        {/* The Farm Bed (Grid) */}
        <div className="relative w-full max-w-md aspect-square bg-[#3d2e1f] rounded-lg border-4 border-slate-600 shadow-inner overflow-hidden">
          {/* Grid Lines */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '10% 10%'
          }}></div>

          {/* Simulated Plants (Static for visual flavor) */}
          <div className="absolute top-[20%] left-[30%] text-emerald-500/50"><Sprout size={24} /></div>
          <div className="absolute top-[70%] left-[60%] text-emerald-500/50"><Sprout size={24} /></div>
          <div className="absolute top-[40%] left-[80%] text-emerald-500/50"><Sprout size={24} /></div>

          {/* Gantry Rails (X-axis) */}
          <div className="absolute top-0 bottom-0 left-0 w-2 bg-slate-400 shadow-md"></div>
          <div className="absolute top-0 bottom-0 right-0 w-2 bg-slate-400 shadow-md"></div>

          {/* Gantry Bridge (Y-axis moving along X) */}
          <div 
            className="absolute top-0 bottom-0 w-4 bg-slate-300 shadow-lg gantry-head z-10 flex items-center justify-center"
            style={{ left: `calc(${getPositionStyle(state.position.x)} - 8px)` }}
          >
            {/* Gantry Head (Moving along Y on the bridge) */}
            <div 
              className="absolute w-10 h-10 bg-slate-100 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-4 border-emerald-500 flex items-center justify-center gantry-head z-20"
              style={{ top: `calc(${getPositionStyle(state.position.y)} - 20px)` }}
            >
              <ToolIcon tool={state.activeTool} className="text-slate-800 w-5 h-5" />
              
              {/* Z-axis indicator (simple visual) */}
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 bg-slate-800 text-xs font-mono px-1 rounded border border-slate-600 text-slate-300">
                Z:{state.position.z}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls/Status */}
      <div className="bg-slate-900 p-4 border-t border-slate-700 grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <p className="text-xs text-slate-400 mb-1">Current Position</p>
          <div className="font-mono text-sm bg-slate-800 p-2 rounded border border-slate-700 flex justify-between">
            <span>X: <span className="text-emerald-400">{state.position.x.toFixed(1)}</span></span>
            <span>Y: <span className="text-emerald-400">{state.position.y.toFixed(1)}</span></span>
            <span>Z: <span className="text-emerald-400">{state.position.z.toFixed(1)}</span></span>
          </div>
        </div>
        <div className="col-span-1">
          <p className="text-xs text-slate-400 mb-1">Active Tool Head</p>
          <div className="font-mono text-sm bg-slate-800 p-2 rounded border border-slate-700 flex items-center gap-2 capitalize">
            <ToolIcon tool={state.activeTool} className="w-4 h-4 text-emerald-400" />
            {state.activeTool.replace('_', ' ')}
          </div>
        </div>
        <div className="col-span-1">
          <p className="text-xs text-slate-400 mb-1">Last Action</p>
          <div className="font-mono text-sm bg-slate-800 p-2 rounded border border-slate-700 truncate text-slate-300">
            {state.lastAction || 'Idle'}
          </div>
        </div>
      </div>
    </div>
  );
};
