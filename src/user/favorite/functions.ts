import { KusamaConfig, Queryable } from '../../reflector/interfaces';
import { escape } from 'mysql';
import { AttributeType } from '../../attribute/attribute.interface';

export async function favoriteOperator(
  conn: Queryable,
  config: KusamaConfig,
  userId: string,
  operatorSpaceId: string,
): Promise<void> {
  const attributeId = await getAttributeId(conn);

  let ids = await getValidatorSpaceIds(conn, config, operatorSpaceId);
  // Favorite operator space too
  ids.push(operatorSpaceId);

  // Unique
  ids = [...new Set(ids)];

  const values: string[] = [];

  for (const id of ids) {
    const value = `
                (UUID_TO_BIN(${escape(attributeId)}),
                UUID_TO_BIN(${escape(userId)}),
                UUID_TO_BIN(${escape(id)}),
                0,
                NULL)
    `;

    values.push(value);
  }

  const sql = `
        INSERT INTO user_space_attributes (attributeId, userId, spaceId, flag, value)
            VALUES ${values.join(',')} AS new
        ON DUPLICATE KEY UPDATE flag  = new.flag,
                                value = new.value
    `;

  await conn.query(sql);
}

export async function unfavoriteOperator(
  conn: Queryable,
  config: KusamaConfig,
  userId: string,
  operatorSpaceId: string,
): Promise<void> {
  const attributeId = await getAttributeId(conn);

  let ids = await getValidatorSpaceIds(conn, config, operatorSpaceId);
  // Favorite operator space too
  ids.push(operatorSpaceId);

  // Unique
  ids = [...new Set(ids)];

  const values = ids.map((id) => `UUID_TO_BIN(${escape(id)})`);

  const sql = `
        DELETE
        FROM user_space_attributes
        WHERE attributeId = UUID_TO_BIN(${escape(attributeId)})
          AND userId = UUID_TO_BIN(${escape(userId)})
          AND spaceId IN (${values.join(',')})
    `;

  await conn.query(sql);
}

async function getAttributeId(conn: Queryable): Promise<string> {
  const sql = `
        SELECT BIN_TO_UUID(id) AS attributeId
        FROM attributes
        WHERE name = ${escape(AttributeType.FAVORITE)}
    `;

  const rows = await conn.query(sql);
  if (rows.length === 0) {
    throw new Error('Can not find attribute by name =' + AttributeType.FAVORITE);
  }

  return rows[0].attributeId;
}

async function getValidatorSpaceIds(conn: Queryable, config: KusamaConfig, operatorSpaceId: string): Promise<string[]> {
  const sql = `
        SELECT BIN_TO_UUID(id) AS spaceId
        FROM spaces
        WHERE parentId = UUID_TO_BIN(${escape(operatorSpaceId)})
          AND spaceTypeId = UUID_TO_BIN(${escape(config.space_types.validator_node)})
    `;

  const rows = await conn.query(sql);

  return rows.map((row) => row.spaceId);
}
