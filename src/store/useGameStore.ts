import { create } from 'zustand';
import { Scenario, Role, Player, LastMoveCard } from '../types/types';
import { PRESET_SCENARIOS, ALL_ROLES, LAST_MOVE_CARDS } from '../data/scenariosData';

interface GameState {
  // Config / Selection State
  selectedScenario: Scenario | null;
  playerCount: number;
  playerNames: string[];
  setPlayerNames: (names: string[]) => void;
  
  // Active Game State
  players: Player[];
  activeLastMoveCards: LastMoveCard[];
  nightNotes: string;
  gameStarted: boolean;

  // Actions
  selectScenario: (scenarioId: string) => void;
  setPlayerCount: (count: number) => void;
  setupGame: () => void;
  togglePlayerStatus: (playerId: string) => void;
  updateNightNotes: (notes: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  selectedScenario: PRESET_SCENARIOS[0], // Default to first scenario
  playerCount: PRESET_SCENARIOS[0].defaultPlayers,
  playerNames: [],
  setPlayerNames: (names) => set({ playerNames: names }),
  players: [],
  activeLastMoveCards: [],
  nightNotes: '',
  gameStarted: false,

  selectScenario: (scenarioId: string) => {
    const scenario = PRESET_SCENARIOS.find((s) => s.id === scenarioId) || null;
    if (scenario) {
      set({
        selectedScenario: scenario,
        playerCount: scenario.defaultPlayers,
      });
    }
  },

  setPlayerCount: (count: number) => {
    const { selectedScenario } = get();
    if (!selectedScenario) return;

    // Enforce scenario constraints
    const validCount = Math.max(
      selectedScenario.minPlayers,
      Math.min(selectedScenario.maxPlayers, count)
    );
    set({ playerCount: validCount });
  },

 setupGame: () => {
  const { selectedScenario, playerCount, playerNames } = get();
  if (!selectedScenario) return;

  // 1. Calculate active role list based on dynamic scaling rules
  let rolePool: Role[] = [];

  // Add base roles
  selectedScenario.defaultRoles.forEach((item) => {
    const roleDef = Object.values(ALL_ROLES).find((r) => r.id === item.roleId);
    if (roleDef) {
      const count = item.count || 1;
      for (let i = 0; i < count; i++) {
        rolePool.push(roleDef);
      }
    }
  });

  // Apply scaling rules for extra players if player count exceeds base
  if (selectedScenario.scalingRules) {
    selectedScenario.scalingRules.forEach((rule) => {
      if (playerCount >= rule.playerCount) {
        rule.addedRoles.forEach((item) => {
          const roleDef = Object.values(ALL_ROLES).find((r) => r.id === item.roleId);
          if (roleDef) {
            const count = item.count || 1;
            for (let i = 0; i < count; i++) {
              rolePool.push(roleDef);
            }
          }
        });
      }
    });
  }

  // Shuffle roles (Fisher-Yates)
  const shuffledRoles = [...rolePool].sort(() => Math.random() - 0.5);

  // 2. Assign roles and names to players
  const generatedPlayers: Player[] = Array.from({ length: playerCount }).map((_, index) => {
    const customName = playerNames[index]?.trim();
    const fallbackRole = ALL_ROLES.simple_citizen || Object.values(ALL_ROLES)[0];

    return {
      id: `player_${index + 1}`,
      name: customName && customName !== '' ? customName : `بازیکن ${index + 1}`,
      role: shuffledRoles[index] || fallbackRole,
      isAlive: true,
      warnings: 0,
    };
  });

  // 3. Prepare Last Move Cards if applicable
  let assignedCards: LastMoveCard[] = [];
  if (selectedScenario.lastMoveCards) {
    assignedCards = [...LAST_MOVE_CARDS].sort(() => Math.random() - 0.5).slice(0, 6);
  }

  set({
    players: generatedPlayers,
    activeLastMoveCards: assignedCards,
    gameStarted: true,
    nightNotes: '',
  });
},

  togglePlayerStatus: (playerId: string) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, isAlive: !p.isAlive } : p
      ),
    }));
  },

  updateNightNotes: (notes: string) => {
    set({ nightNotes: notes });
  },

  resetGame: () => {
    set({
      players: [],
      activeLastMoveCards: [],
      gameStarted: false,
      nightNotes: '',
    });
  },
}));