import axios from 'axios';
import { KusamaConfig, Queryable, Tile, ValidatorInfo, ValidatorSpace } from './interfaces';
import { UiTypes } from '../ui-type/ui-type.interface';
import { escape } from 'mysql';
import { v4 as uuidv4 } from 'uuid';

export async function getKusamaConfig(connection: Queryable): Promise<KusamaConfig> {
  const sql = `
    SELECT *
    FROM world_definition
    WHERE JSON_EXTRACT(config, '$.kind') = "Kusama";
  `;
  const r = await connection.query(sql);
  if (!r[0]) {
    throw new Error('Kusama_world config is empty');
  }

  const config = JSON.parse(r[0].config);
  return config;
}

export async function getUiTypeId(connection: Queryable): Promise<string> {
  const sql = `SELECT BIN_TO_UUID(id) as id
               FROM ui_types
               WHERE name = ${escape(UiTypes.DASHBOARD)};`;
  const r = await connection.query(sql);

  const uiTypeId: string = r[0].id;
  return uiTypeId;
}

export async function getValidatorSpaceId(
  conn: Queryable,
  validatorId: string,
  config: KusamaConfig,
): Promise<{ spaceId: string; parentId: string; isActive: number } | null> {
  const sql = `
    SELECT BIN_TO_UUID(spaces.id)       AS spaceId,
           BIN_TO_UUID(spaces.parentId) AS parentId,
           sa2.flag                     AS isActive
    FROM spaces
           JOIN space_attributes sa1
                ON sa1.spaceId = spaces.id
                  AND sa1.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_validator_id)})
           JOIN space_attributes sa2
                ON sa2.spaceId = spaces.id
                  AND sa2.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_validator_is_active)})
    WHERE true
      AND sa1.value = ${escape(validatorId)}
  `;

  const r = await conn.query(sql);
  if (r.length === 0) {
    return null;
  }

  return { spaceId: r[0].spaceId, parentId: r[0].parentId, isActive: r[0].isActive };
}

// export async function getOperatorSpaceId(
//   conn: Queryable,
//   operatorId: string,
//   config: KusamaConfig,
// ): Promise<{ id: string; visible: number }> {
//   const sql = `
//       SELECT BIN_TO_UUID(id) AS id,
//              visible
//       FROM spaces
//                JOIN space_attributes sa on spaces.id = sa.spaceId
//       WHERE spaceTypeId = UUID_TO_BIN(${escape(config.space_types.operator)})
//         AND attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_operator_id)})
//         AND value = ${escape(operatorId)}
//   `;
//
//   const r = await conn.query(sql);
//   if (r.length === 0) {
//     return {
//       id: null,
//       visible: null,
//     };
//   }
//
//   return {
//     id: r[0].id,
//     visible: r[0].visible,
//   };
// }

export async function getTotalKusamaValidators(
  conn: Queryable,
  operatorSpaceId: string,
  config: KusamaConfig,
): Promise<{ active: number; total: number }> {
  if (operatorSpaceId === config.spaces.validator_cloud) {
    return { active: 1, total: 1 };
  }

  let sql = `SELECT id
             FROM spaces
                    JOIN space_attributes sa on spaces.id = sa.spaceId
             WHERE sa.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_validator_is_active)})
               AND sa.flag = 2
               AND parentId = UUID_TO_BIN(${escape(operatorSpaceId)})
  `;

  let r = await conn.query(sql);
  const active = r.length;

  sql = `SELECT id
         FROM spaces
         WHERE parentId = UUID_TO_BIN(${escape(operatorSpaceId)})
  `;

  r = await conn.query(sql);
  const total = r.length;

  return { active, total };
}

// export async function updateOperatorCounters(
//   conn: Queryable,
//   operatorSpaceId: string,
//   config: KusamaConfig,
//   active: number,
//   total: number,
// ): Promise<void> {
//   const sql = `
//       INSERT INTO space_attributes (attributeId, spaceId, flag, value)
//       VALUES (UUID_TO_BIN(${escape(config.attributes.kusama_active_total)}),
//               UUID_TO_BIN(${escape(operatorSpaceId)}),
//               0,
//               ${escape(active)}
//              ) AS new
//
//       ON DUPLICATE KEY UPDATE flag  = new.flag,
//                               value = new.value
//   `;
//
//   await conn.query(sql);
// }

export function parseToValidatorInfo(obj: Record<string, any>): ValidatorInfo {
  const obj_sample = {
    accountId: 'GkUaCrjai8ZCNTwYNMbnkxRpdNVGxPexSR5cq4VRKbfJvna',
    commission: 0.1,
    status: 'active',
    name: 'Mischa2',
    ownStake: 0,
    totalStake: 0,
    nominators: [{ address: 'GkUaCrjai8ZCNTwYNMbnkxRpdNVGxPexSR5cq4VRKbfJvna', stake: 0 }],
    entity: { name: 'none', accountId: 'none' },
  };

  const { selfName, parentName } = getNames(obj);

  let fullName = selfName;
  if (parentName) {
    fullName = `${parentName}/${selfName}`;
  }

  let entityAccountId = 'f'.repeat(47);
  if (obj.entity && obj.entity.accountId != 'none' && obj.entity.accountId.length === 47) {
    entityAccountId = obj.entity.accountId;
  }

  const validator: ValidatorInfo = {
    ...obj,
    accountId: obj.accountId,
    status: obj.status,
    commission: obj.commission ? Math.floor(obj.commission * 100) + '%' : '',
    commissionLongFormat: obj.commission ? Math.floor(obj.commission * 100) + '% COMMISSION' : '',
    nominators: obj.nominators,
    validatorAccountDetails: {
      name: fullName,
    },
    entity: {
      accountId: entityAccountId,
      name: parentName,
    },
  };

  return validator;
}

function getNames(obj): { selfName: string; parentName: string | null } {
  let selfName = obj.accountId;
  if (obj.identity && obj.identity.display && obj.identity.display !== '') {
    selfName = obj.identity.display;
  } else if (obj.name && obj.name !== '') {
    selfName = obj.name;
  }

  let parentName = null;
  if (obj.identity && obj.identity.displayParent && obj.identity.displayParent !== '') {
    parentName = obj.identity.displayParent;
  } else if (obj.entity && obj.entity.name && obj.entity.name !== '' && obj.entity.name !== 'none') {
    parentName = obj.entity.name;
  }

  return { selfName, parentName };
}

export async function renderName(text: string) {
  const jsonObject = {
    background: [0, 0, 0, 255],
    color: [0, 255, 0, 0],
    thickness: 0,
    width: 1024,
    height: 64,
    x: 0,
    y: 0,
    text: {
      string: text,
      fontfile: '',
      fontsize: 0,
      fontcolor: [220, 220, 200, 0],
      wrap: false,
      padX: 0,
      padY: 1,
      alignH: 'center',
      alignV: 'center',
    },
  };

  try {
    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const frameResponse = await axios.post(
      `${process.env.RENDER_INTERNAL_URL}/render/addframe`,
      { ...jsonObject },
      options,
    );

    return frameResponse.data.hash;
  } catch (e) {
    console.error(e);
  }
}

export async function getDefaultTiles(conn: Queryable, spaceTypeId: string): Promise<Tile[]> {
  const sql = `
      SELECT default_tiles
      FROM space_types
      WHERE id = UUID_TO_BIN(${escape(spaceTypeId)})
      LIMIT 1
  `;

  const rows = await conn.query(sql);
  if (rows.length > 0) {
    return JSON.parse(rows[0].default_tiles) as Tile[];
  }
  return [];
}

export async function insertTiles(conn: Queryable, tiles: Tile[], uiTypeId: string, spaceId: string): Promise<void> {
  const insertValues = tiles.map((tile) => {
    return `(
              UUID_TO_BIN('${uuidv4()}'), 
              UUID_TO_BIN(${escape(uiTypeId)}), 
              UUID_TO_BIN(${escape(spaceId)}),
              ${+tile.row},
              ${+tile.column},
              ${escape(tile.permanentType)},
              '${JSON.stringify(tile.content)}',
              ${+tile.edited},
              ${+tile.render},
              ${escape(tile.hash)},
              ${escape(tile.type)}
              )`;
  });

  const sql = `INSERT INTO tiles (id, uiTypeId, spaceId, \`row\`, \`column\`, permanentType,
                                  content, edited, render, hash, type)
               VALUES ${insertValues.join(',')};`;

  await conn.query(sql);
}

export async function getAllValidators(conn: Queryable, config: KusamaConfig): Promise<ValidatorSpace[]> {
  const sql = `
      SELECT BIN_TO_UUID(spaces.id)       AS spaceId,
             BIN_TO_UUID(spaces.parentId) AS parentSpaceId,
             spaces.name                  AS name,
             sa1.value                    AS kusamaId,
             sa2.value                    AS kusamaParentId

      FROM spaces
               JOIN space_attributes sa1
                    ON spaces.id = sa1.spaceId
                        AND sa1.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_validator_id)})
               JOIN space_attributes sa2
                    ON spaces.id = sa2.spaceId
                        AND sa2.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_validator_parent_id)})
  `;

  const rows = await conn.query(sql);
  return rows;
}
