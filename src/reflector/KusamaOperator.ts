import { Connection } from 'typeorm';
import { escape } from 'mysql';
import { KusamaConfig, Queryable, Tile } from './interfaces';
import { v4 as uuidv4 } from 'uuid';
import { getDefaultTiles, insertTiles, renderName } from './functions';
import { MQTT } from './MQTT';

export class KusamaOperator {
  constructor(private readonly connection: Connection, public readonly mqtt: MQTT) {}

  public async create_legacy(
    operatorId: string,
    spaceName: string,
    uiTypeId: string,
    config: KusamaConfig,
  ): Promise<string> {
    console.log('Start Create Operator space', operatorId, spaceName, uiTypeId);
    const defaultTiles: Tile[] = await getDefaultTiles(this.connection, config.space_types.operator);

    const runner = this.connection.createQueryRunner();

    try {
      await runner.query('BEGIN');
      const { spaceId } = await this.insertOperatorSpace(runner, config, spaceName, operatorId, uiTypeId);
      await insertTiles(runner, defaultTiles, uiTypeId, spaceId);
      await this.insertOrUpdateAttributes(runner, spaceId, config);
      if (this.mqtt) {
        await this.mqtt.publish(`updates/spaces/created`, spaceId, false);
      }
      await runner.query('COMMIT');

      return spaceId;
    } catch (e) {
      console.error(e);
      await runner.query('ROLLBACK');
    } finally {
      await runner.release();
    }
  }

  // public static async claimSpace_legacy(conn: Queryable, operatorId: string): Promise<string> {
  //   const config = await getKusamaConfig(conn);
  //   const { id: operatorSpaceId } = await getOperatorSpaceId(conn, operatorId, config);
  //
  //   if (!operatorSpaceId) {
  //     console.log(`Operator space not found. OperatorID= ${operatorId}`);
  //     return;
  //   }
  //
  //   console.log(`Updating operator space. SpaceId = ${operatorSpaceId}`);
  //
  //   let sql = `UPDATE spaces JOIN space_attributes ON spaces.id = space_attributes.spaceId
  //              SET spaces.visible = 1
  //              WHERE space_attributes.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_operator_id)})
  //                AND space_attributes.value = ${escape(operatorId)}
  //                AND spaces.spaceTypeId = UUID_TO_BIN(${escape(config.space_types.operator)})
  //   `;
  //
  //   await conn.query(sql);
  //
  //   sql = `UPDATE spaces JOIN space_attributes ON spaces.id = space_attributes.spaceId
  //          SET spaces.parentId = UUID_TO_BIN(${escape(operatorSpaceId)}),
  //              spaces.visible  = 1
  //          WHERE space_attributes.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_operator_id)})
  //            AND space_attributes.value = ${escape(operatorId)}
  //            AND spaces.spaceTypeId = UUID_TO_BIN(${escape(config.space_types.validator_node)})`;
  //   await conn.query(sql);
  //
  //   console.log('Complete');
  //   return operatorSpaceId;
  // }

  // public static async unclaimSpace_legacy(conn: Queryable, operatorId: string): Promise<string> {
  //   const config = await getKusamaConfig(conn);
  //   const { id: operatorSpaceId } = await getOperatorSpaceId(conn, operatorId, config);
  //
  //   if (!operatorSpaceId) {
  //     console.log(`Operator space not found. OperatorID= ${operatorId}`);
  //     return;
  //   }
  //
  //   console.log(`Updating operator space. SpaceId = ${operatorSpaceId}`);
  //
  //   let sql = `UPDATE spaces JOIN space_attributes ON spaces.id = space_attributes.spaceId
  //              SET spaces.visible = 0
  //              WHERE space_attributes.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_operator_id)})
  //                AND space_attributes.value = ${escape(operatorId)}
  //                AND spaces.spaceTypeId = UUID_TO_BIN(${escape(config.space_types.operator)})
  //   `;
  //
  //   await conn.query(sql);
  //
  //   // Change parentId to validator cloud
  //   // And set visible = 1 if validator active, 0 if not active
  //   sql = `
  //       UPDATE spaces
  //           JOIN space_attributes sa_operator_id
  //           ON spaces.id = sa_operator_id.spaceId AND
  //              sa_operator_id.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_operator_id)})
  //           JOIN space_attributes sa_is_active
  //           ON spaces.id = sa_is_active.spaceId AND sa_is_active.attributeId =
  //                                                   UUID_TO_BIN(${escape(config.attributes.kusama_validator_is_active)})
  //       SET visible  = CASE WHEN sa_is_active.flag = 2 THEN 1 ELSE 0 END,
  //           parentId = UUID_TO_BIN(${escape(config.spaces.validator_cloud)})
  //       WHERE spaces.spaceTypeId = UUID_TO_BIN(${escape(config.space_types.validator_node)})
  //         AND sa_operator_id.value = ${escape(operatorId)}
  //   `;
  //
  //   await conn.query(sql);
  //
  //   console.log('Complete');
  //   return operatorSpaceId;
  // }

  private async insertOrUpdateAttributes(conn: Queryable, spaceId: string, config: KusamaConfig) {
    const sql = `
        INSERT INTO space_attributes (attributeId, spaceId, flag, value)
            VALUES (UUID_TO_BIN(${escape(config.attributes.date_of_next_event)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    '') AS new

        ON DUPLICATE KEY UPDATE flag  = new.flag,
                                value = new.value

    `;
    await conn.query(sql);
  }

  // private async getValidatorSpaceIdsBy(conn: Queryable, operatorId: string, config: KusamaConfig): Promise<string[]> {
  //   const sql = `
  //       SELECT BIN_TO_UUID(spaceId) AS spaceId
  //       FROM space_attributes
  //       WHERE attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_operator_id)})
  //         AND value = ${escape(operatorId)}
  //   `;
  //
  //   const r = await conn.query(sql);
  //   return r.map((row) => row.spaceId);
  // }

  private async insertOperatorSpace(
    conn: Queryable,
    config: KusamaConfig,
    spaceName: string,
    operatorId: string,
    uiTypeId: string,
  ): Promise<{ spaceId: string }> {
    const spaceId = uuidv4();

    const nameHash = await renderName(spaceName);
    const sql = `
        INSERT INTO spaces (id, uiTypeId, spaceTypeId, parentId, name, name_hash, allowed_subspaces,
                            child_placement, visible, minimap, metadata)
        VALUES (UUID_TO_BIN(${escape(spaceId)}),
                UUID_TO_BIN(${escape(uiTypeId)}),
                UUID_TO_BIN(${escape(config.space_types.operator)}),
                UUID_TO_BIN(${escape(config.spaces.operator_cloud)}),
                ${escape(spaceName)},
                ${escape(nameHash)},
                null,
                null,
                1,
                0,
                '{
                    "kusama_metadata": {
                        "operator_id": "${operatorId}"
                    }                    
                }');
    `;

    await conn.query(sql);

    return { spaceId };
  }

  // private async moveValidatorSpacesToOperatorSpace(
  //   conn: Queryable,
  //   operatorSpaceId: string,
  //   operatorId: string,
  // ): Promise<void> {
  //   const sql = `UPDATE spaces
  //                SET parentId = UUID_TO_BIN(${escape(operatorSpaceId)})
  //                WHERE JSON_EXTRACT(metadata, '$.kusama_metadata.validator_info.entity.accountId') =
  //                      ${escape(operatorId)};
  //   `;
  //
  //   await conn.query(sql);
  // }
}
