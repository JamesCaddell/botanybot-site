export type ToolType = 'water_nozzle' | 'seeder' | 'camera' | 'weeder' | 'none';

export interface Position {
  x: number; // 0-10
  y: number; // 0-10
  z: number; // 0-10 (height)
}

export interface FarmState {
  position: Position;
  activeTool: ToolType;
  soilMoisture: number; // percentage
  temperature: number; // celsius
  lastAction: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GantryCommand {
  action: 'MOVE' | 'SWAP_TOOL' | 'WATER' | 'SEED' | 'SCAN' | 'WEED' | 'NONE';
  x?: number;
  y?: number;
  z?: number;
  tool?: ToolType;
}

export interface BotResponse {
  reply: string;
  command?: GantryCommand;
}
