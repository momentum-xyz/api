import { Connection } from 'typeorm';
import { ChangedSpaces, KusamaConfig, Queryable, Tile, ValidatorInfo } from './interfaces';
import {
  getDefaultTiles,
  getKusamaConfig,
  getTotalKusamaValidators,
  getUiTypeId,
  getValidatorSpaceId,
  insertTiles,
  renderName,
} from './functions';
import { escape } from 'mysql';
import { v4 as uuidv4 } from 'uuid';
import { KusamaOperator } from './KusamaOperator';
import { MQTT } from './MQTT';
import { formatMicroKSM, picoKSM_to_microKSM } from './functions/picoKSM_to_KSM';

export class KusamaValidator {
  private readonly kusamaOperator: KusamaOperator;
  private cache: { config?: KusamaConfig; uiTypeId?: string } = {};
  private readonly operatorsMap: { [operatorId: string]: string } = {};

  constructor(private readonly connection: Connection, private readonly mqtt: MQTT) {
    this.kusamaOperator = new KusamaOperator(connection, mqtt);
  }

  public async warmUpCache() {
    await Promise.all([this.getUiTypeIdFromCache(), this.getKusamaConfigFromCache()]);
  }

  private async getKusamaConfigFromCache() {
    if (!this.cache.config) {
      this.cache.config = await getKusamaConfig(this.connection);
    }

    return this.cache.config;
  }

  private async getUiTypeIdFromCache() {
    if (!this.cache.uiTypeId) {
      this.cache.uiTypeId = await getUiTypeId(this.connection);
    }

    return this.cache.uiTypeId;
  }

  public async createOrUpdateOrDelete(validatorId: string, validator: ValidatorInfo): Promise<ChangedSpaces> {
    if (validator.validatorAccountDetails) {
      if (validatorId === validator.entity.accountId) {
        throw new Error('Validator can not have same accountId as its operator');
      }

      if (validatorId !== validator.accountId) {
        throw new Error('ValidatorId in topic must equal accountId in payload');
      }
    }

    const config = await this.getKusamaConfigFromCache();

    const obj = await getValidatorSpaceId(this.connection, validatorId, config);

    let spaceId = null;
    let parentId = null;
    let isActive = null;

    if (obj) {
      spaceId = obj.spaceId;
      parentId = obj.parentId;
      isActive = obj.isActive;
    }

    let change: ChangedSpaces;

    if (!spaceId && !validator.validatorAccountDetails) {
      console.log('Asked to removing non-existed validator. Nothing to do');
      change = { created: [], updated: [] };
    }

    if (!spaceId && validator.validatorAccountDetails) {
      console.log('CREATE');
      change = await this.create(this.connection, validatorId, validator, config);
    }

    if (spaceId && validator.validatorAccountDetails) {
      // console.log('UPDATE');
      change = await this.update(this.connection, spaceId, parentId, validatorId, validator, config);
    }

    if (spaceId && !validator.validatorAccountDetails) {
      console.log('DELETE');
      change = await this.delete(this.connection, spaceId);
    }

    if (parentId) {
      const { active, total } = await getTotalKusamaValidators(this.connection, parentId, config);
      await KusamaValidator.insertOrUpdateOperatorAttribute(this.connection, parentId, active, total, config);
    }

    return change;
  }

  private async delete(conn: Queryable, spaceId: string): Promise<ChangedSpaces> {
    let sql = `
        SELECT BIN_TO_UUID(parentId) AS parentId
        FROM spaces
        WHERE id = UUID_TO_BIN(${escape(spaceId)})
    `;

    const r = await conn.query(sql);
    const parentId = r[0].parentId;

    sql = `DELETE
           FROM spaces
           WHERE id = UUID_TO_BIN(${escape(spaceId)})`;

    await conn.query(sql);

    await this.mqtt.publish(`updates/spaces/removed`, spaceId, false);

    return { created: [], updated: [parentId] };
  }

  private async update(
    conn: Queryable,
    spaceId: string,
    parentId: string,
    validatorId: string,
    validator: ValidatorInfo,
    config: KusamaConfig,
  ): Promise<ChangedSpaces> {
    const change: ChangedSpaces = {
      created: [],
      updated: [],
    };

    const isValidatorVisible = this.isValidatorVisible(validator.status === 'active', parentId, config);

    const runner = this.connection.createQueryRunner();
    try {
      const nameHash = await renderName(validator.validatorAccountDetails.name);
      await runner.query('BEGIN');
      const sql = `UPDATE spaces
                   SET name      = ${escape(validator.validatorAccountDetails.name)},
                       parentId  = UUID_TO_BIN(${escape(parentId)}),
                       name_hash = ${escape(nameHash)},
                       visible=${+isValidatorVisible},
                       metadata  = JSON_SET(metadata, "$.kusama_metadata.validator_info",
                                            CAST(${escape(JSON.stringify(validator))} AS JSON))
                   WHERE id = UUID_TO_BIN(${escape(spaceId)})
      `;
      const currVisible = await this.getCurrVisible(conn, spaceId);
      await runner.query(sql);

      await this.insertOrUpdateAttributes(runner, spaceId, parentId, validatorId, validator, config, 'update');

      await runner.query('COMMIT');

      if (currVisible !== +isValidatorVisible) {
        console.log(
          `Visibility changed from ${currVisible} to ${isValidatorVisible} updating parent space = ${parentId}`,
        );
        change.updated.push(parentId);
      } else {
        change.updated.push(spaceId);
      }

      return change;
    } catch (e) {
      console.error(e);
      await runner.query('ROLLBACK');
    } finally {
      await runner.release();
    }
  }

  private async create(
    conn: Queryable,
    validatorId: string,
    validator: ValidatorInfo,
    config: KusamaConfig,
  ): Promise<ChangedSpaces> {
    const uiTypeId = await this.getUiTypeIdFromCache();
    const spaceId = uuidv4();

    const kusamaParentId = validator.entity.accountId;
    // const operatorSpaceId = this.operatorsMap[operatorId];
    // const { id: operatorSpaceId, visible: operatorSpaceVisible } = await getOperatorSpaceId(
    //   conn,
    //   validator.entity.accountId,
    //   config,
    // );

    const parentId = config.spaces.validator_cloud;

    // if (kusamaParentId !== 'f'.repeat(47) && !operatorSpaceId) {
    //   // Validator has real operator but operator has no space yet
    //   // 1- need to create operator space in transaction later or now
    //   await this.kusamaOperator.create(kusamaParentId, validator, uiTypeId, config);
    // }

    // if (kusamaParentId !== 'f'.repeat(47) && operatorSpaceId && operatorSpaceVisible) {
    //   // Validator has real operator and operator already has space and spaceIsVisible
    //   parentId = operatorSpaceId;
    // }

    const runner = this.connection.createQueryRunner();

    try {
      await runner.query('BEGIN');

      const metadata = {
        kusama_metadata: {
          validator_id: validatorId,
          validator_info: validator,
          validator_reward: 0.23,
        },
      };

      const nameHash = await renderName(validator.validatorAccountDetails.name);

      const isValidatorVisible = this.isValidatorVisible(validator.status === 'active', parentId, config);

      const sql = `
          INSERT INTO spaces (id, uiTypeId, spaceTypeId, parentId, name, name_hash,
                              allowed_subspaces,
                              child_placement, visible, metadata)
          VALUES (UUID_TO_BIN(${escape(spaceId)}),
                  UUID_TO_BIN(${escape(uiTypeId)}),
                  UUID_TO_BIN(${escape(config.space_types.validator_node)}),
                  UUID_TO_BIN(${escape(parentId)}),
                  ${escape(validator.validatorAccountDetails.name)},
                  ${escape(nameHash)},
                  null,
                  null,
                  ${+isValidatorVisible},
                  ${escape(JSON.stringify(metadata))});
      `;

      await runner.query(sql);

      await this.insertOrUpdateAttributes(runner, spaceId, parentId, validatorId, validator, config, 'insert');

      await runner.query('COMMIT');

      await this.mqtt.publish(`updates/spaces/created`, spaceId, false);

      return {
        created: [spaceId],
        updated: [parentId],
      };
    } catch (e) {
      console.error(e);
      await runner.query('ROLLBACK');
    } finally {
      await runner.release();
    }
  }

  private isValidatorVisible(isValidatorActive: boolean, parentSpaceId: string, config: KusamaConfig): 1 | 0 {
    // If validator has operator always visible
    // If no operator visible only if active

    if (parentSpaceId !== config.spaces.validator_cloud) {
      // Validator has operator
      return 1;
    } else {
      if (isValidatorActive) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  private async getCurrVisible(conn: Queryable, spaceId: string) {
    const sql = `
        SELECT visible
        FROM spaces
        WHERE id = UUID_TO_BIN(${escape(spaceId)})
    `;

    const r = await conn.query(sql);
    return r[0].visible;
  }

  private async insertOrUpdateAttributes(
    conn: Queryable,
    spaceId: string,
    parentSpaceId: string,
    validatorId: string,
    validator: ValidatorInfo,
    config: KusamaConfig,
    type: 'insert' | 'update',
  ) {
    const attr = config.attributes;

    const kusama_validator_is_online = 1;
    const kusama_validator_is_active = validator.status === 'active' ? 2 : 1;
    const kusama_validator_is_selected = validator.status === 'active' ? 1 : 0;
    const kusama_validator_is_parachain = 1;
    const ownStake = formatMicroKSM(picoKSM_to_microKSM(validator.ownStake));

    const judgements = validator.identity.judgements;

    const sql = `
        INSERT INTO space_attributes (attributeId, spaceId, flag, value)
            VALUES (UUID_TO_BIN(${escape(attr.kusama_validator_id)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    ${escape(validatorId)}),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_judgement)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    ${judgements === null ? 'NULL' : escape(JSON.stringify(judgements))}),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_ownstake)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    ${escape(ownStake)}),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_parent_id)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    ${escape(validator.entity.accountId)}),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_comission)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    ${escape(validator.commission)}),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_comission_long_format)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    ${escape(validator.commissionLongFormat)}),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_is_active)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    ${+kusama_validator_is_active},
                    NULL),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_is_online)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    ${+kusama_validator_is_online},
                    NULL),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_is_selected)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    ${+kusama_validator_is_selected},
                    NULL),

                   (UUID_TO_BIN(${escape(attr.kusama_validator_is_parachain)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    ${+kusama_validator_is_parachain},
                    NULL),

                   (UUID_TO_BIN(${escape(attr.date_of_next_event)}),
                    UUID_TO_BIN(${escape(spaceId)}),
                    0,
                    '') AS new

        ON DUPLICATE KEY UPDATE flag  = new.flag,
                                value = new.value

    `;
    await conn.query(sql);
  }

  public static async insertOrUpdateOperatorAttribute(
    conn: Queryable,
    operatorSpaceId: string,
    active: number,
    total: number,
    config: KusamaConfig,
  ) {
    const value = `${active}/${total}`;

    const sql = `
        INSERT INTO space_attributes (attributeId, spaceId, flag, value)
        VALUES (UUID_TO_BIN(${escape(config.attributes.kusama_operator_total_validators)}),
                UUID_TO_BIN(${escape(operatorSpaceId)}),
                0,
                ${escape(value)}) AS new

        ON DUPLICATE KEY UPDATE flag  = new.flag,
                                value = new.value
    `;
    await conn.query(sql);
  }
}
