export interface SpaceTypeDto {
  id?: Buffer;
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export enum ISpaceType {
  UNIVERSE = 'Universe',
  WORLD = 'World',
  PROGRAM = 'program',
  CHALLENGE = 'challenge',
  PROJECT = 'project',
  ANCHOR = 'anchor',
  ANCHOR_SATELLITE = 'anchor-satellite',
  CHALLENGE_INITIATIVE = 'challenge-initiative',
  MORGUE = 'morgue',
  PROJECT_INITIATIVE = 'project-initiative',
  MBZ_PROGRAM = 'MBZ Program',
  MBZ_CHALLENGE = 'MBZ Challenge',
  MBZ_PROJECT = 'MBZ Project',
  GRAB_A_TABLE = 'grab-a-table',
  GAT_ANCHOR = 'gat-anchor',
  OPERATOR = 'Operator',
  VALIDATOR_NODE = 'Validator Node',
}
