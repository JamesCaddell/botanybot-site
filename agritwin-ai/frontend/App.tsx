import React, { useState, useCallback } from 'react';
import { DigitalTwin } from './components/DigitalTwin.tsx';
import { Chatbot } from './components/Chatbot.tsx';
import { FarmState, BotResponse, ToolType } from './types.ts';

const INITIAL_STATE: FarmState = {
  position: { x: 0, y: 0, z: 10 },
  activeTool: 'none',
  soilMoisture: 45,
  temperature: 24,
  lastAction: 'System Initialized'
};

export default function App() {
  const [farmState, setFarmState] = useState<FarmState>(INITIAL_STATE);

  // Handle commands received from the Gemini Chatbot
  const handleBotCommand = useCallback((response: BotResponse) => {
    if (!response.command) return;

    const { action, x, y, z, tool } = response.command;

    setFarmState(prevState => {
      const newState = { ...prevState };

      switch (action) {
        case 'MOVE':
          if (x !== undefined) newState.position.x = Math.max(0, Math.min(10, x));
          if (y !== undefined) newState.position.y = Math.max(0, Math.min(10, y));
          if (z !== undefined) newState.position.z = Math.max(0, Math.min(10, z));
          newState.lastAction = `Moved to X:${newState.position.x}, Y:${newState.position.y}, Z:${newState.position.z}`;
          break;
        
        case 'SWAP_TOOL':
          if (tool) {
            // Ensure tool is a valid ToolType, fallback to 'none' if model hallucinates
            const validTools: ToolType[] = ['water_nozzle', 'seeder', 'camera', 'weeder', 'none'];
            newState.activeTool = validTools.includes(tool as ToolType) ? (tool as ToolType) : 'none';
            newState.lastAction = `Swapped tool to ${newState.activeTool}`;
          }
          break;

        case 'WATER':
          newState.lastAction = `Watering at current position`;
          // Simulate moisture increase
          newState.soilMoisture = Math.min(100, newState.soilMoisture + 15);
          break;

        case 'SEED':
          newState.lastAction = `Planting seed at current position`;
          break;

        case 'SCAN':
          newState.lastAction = `Scanning area with camera`;
          break;
          
        case 'WEED':
          newState.lastAction = `Destroying weeds at current position`;
          break;

        default:
          console.warn("Unknown action received:", action);
      }

      return newState;
    });
  }, []);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            AgriTwin Control Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered 3D Gantry Digital Twin</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm text-slate-300 font-medium">System Online</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
        {/* Left Column: Digital Twin Visualization */}
        <section className="h-full min-h-[400px]">
          <DigitalTwin state={farmState} />
        </section>

        {/* Right Column: Chatbot Interface */}
        <section className="h-full min-h-[400px]">
          <Chatbot onCommand={handleBotCommand} currentState={farmState} />
        </section>
      </main>
    </div>
  );
}
