export interface MagicLinkDTO {
  id?: string;
  key?: string;
  data: any;
  type: MagicType;
}

export enum MagicType {
  OPEN_SPACE = 'open_space',
  JOIN_MEETING = 'join_meeting',
  FLY = 'fly',
  EVENT = 'event',
}
