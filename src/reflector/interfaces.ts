export type KusamaConfig = {
  users: {
    society: string;
  };
  spaces: {
    thin_air: string;
    era_clock: string;
    blockchain: string;
    world_lobby: string;
    events_clock: string;
    operator_cloud: string;
    effects_emitter: string;
    validator_cloud: string;
    transaction_core: string;
    rewards_accumulator: string;
  };
  effects: {};
  attributes: {
    validator_role: string;
    validator_status: string;
    date_of_next_event: string;
    // kusama_operator_id: string;
    // kusama_active_total: string;
    kusama_validator_id: string;
    kusama_clock_era_time: string;
    kusama_parachain_name: string;
    kusama_validator_comission: string;
    kusama_validator_comission_long_format: string;
    kusama_validator_is_active: string;
    kusama_validator_is_online: string;
    kusama_operator_total_stake: string;
    kusama_parachain_token_name: string;
    kusama_validator_is_selected: string;
    kusama_validator_is_parachain: string;
    // kusama_total_validators_by_operator: string;
    // NEW
    kusama_validator_parent_id: string;
    kusama_validator_judgement: string;
    kusama_validator_ownstake: string;
    kusama_operator_total_validators: string;
  };
  space_types: {
    generic: string;
    operator: string;
    parachain: string;
    validator_node: string;
    transaction_block: string;
  };
};

export interface Queryable {
  query: (sql) => Promise<any>;
}

export type ChainInfo = {
  id: string;
  name: string;
};

export interface ValidatorInfo {
  accountId: string; // "CaKh7HmPMXxv22GnLgjEZxWHBUu7y7Twf2k8mP3mxpLYTH5",
  status: 'active' | 'candidate' | 'inactive' | string;
  eraPoints?: number; // 100;
  totalStake?: number; // 10;
  ownStake: string; //1;
  commission: string; // 3;
  commissionLongFormat: string; // 3;
  nominators: any[]; // ['Cat8TYNUzyH6VRzTHq9BzW6qw2htkNKSbooqBQnCyAAj66d', 'Caz26n5CBBBpnfETL6SpVWtanwygyJ5w8kdHmTuc8E9BNuf'];
  entity: {
    name: string; //'SUPER VALIDATORS';
    accountId: string; //'CbaNLeJQ3e8aCJMTLa9euDKuTDmnT5oPmGFt4AmuvXmYFGN';
  };
  validatorAccountDetails: {
    name: string; // 'SUPER VALIDATOR #1';
    totalBalance?: number; //15;
    locked?: number; // 13;
    bonded?: number; // 13;
    parent?: string; // '0x44444444444444444444444444';
    email?: string; // 'super@supervalidators.com';
    website?: string; // 'supervalidators.com';
    twitter?: string; // '@supervalidators';
    riot?: string; // '@supervalidators';
  };
}

export type Tile = {
  row: number; // 1
  hash: string; // '69e2b342788fe70273c15b62f618ef22'
  type: string; // 'tile_type_media'
  column: number; // 0
  edited: number; // 1
  render: number; // 1
  content: Record<string, unknown>;
  permanentType: string;
};

export type ChangedSpaces = {
  created: string[];
  updated: string[];
};

export type ValidatorSpace = {
  name: string;
  spaceId: string;
  parentSpaceId: string;
  kusamaId: string;
  kusamaParentId: string;
};
