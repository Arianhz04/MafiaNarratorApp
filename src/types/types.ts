export type TeamSide = 'mafia' | 'citizen' | 'independent';

export interface Role {
  id: string;
  name: string;
  isCustom?: Boolean;
  side: TeamSide;
  image?: string;
  description: string;
}

export interface ScenarioRoleRequirement {
  roleId: string;
  count?: number;
}

export interface ScenarioScalingRule {
  playerCount: number;
  addedRoles: ScenarioRoleRequirement[];
}

export interface Scenario {
  id: string;
  title: string;
  minPlayers: number;
  maxPlayers: number;
  defaultPlayers: number;
  lastMoveCards: LastMoveCard[];
  defaultRoles: ScenarioRoleRequirement[];
  scalingRules?: ScenarioScalingRule[];
}

export interface Player {
  id: string;
  name: string;
  role: Role;
  isAlive: boolean;
}

export interface LastMoveCard {
  id: string;
  title: string;
  description: string;
}