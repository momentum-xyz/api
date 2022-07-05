import { Injectable } from '@nestjs/common';
import { AttributeType } from '../attribute/attribute.interface';
import { Connection } from 'typeorm';
import { User } from '../user/user.entity';
import { MqttService } from '../services/mqtt.service';
import { escape } from 'mysql';

@Injectable()
export class ReflectorService {
  private ksm_usd = {};

  constructor(private readonly connection: Connection, private client: MqttService) {}

  async onModuleInit(): Promise<void> {
    this.client.client.on('message', this.onMessage.bind(this));
    await this.client.client.subscribe('harvester/ksm_usd/ksm-usd-conversion-event', { qos: 1 });
  }

  private async onMessage(topic: string, message: Buffer) {
    if (topic === 'harvester/ksm_usd/ksm-usd-conversion-event') {
      if (message.toString()) {
        const payload = JSON.parse(message.toString());
        this.ksm_usd = payload;
      }
    }
  }

  public getKsmUsd(): Record<string, string> {
    return this.ksm_usd;
  }

  public async getValidators(user: User, withIdentity?: boolean, parentSpaceId?: string, isFavorited?: boolean) {
    let filterSQL = ``;

    if (withIdentity === true) {
      // can be undefined, someday we might want to implement false
      filterSQL += `
          AND CAST(JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.identity.judgements") AS CHAR) <> 'null'
      `;
    }

    if (parentSpaceId) {
      filterSQL += `
          AND spaces.parentId = UUID_TO_BIN(${escape(parentSpaceId)})
      `;
    }

    if (isFavorited) {
      filterSQL += `
          AND user_attrs.flag IS NOT NULL
      `;
    }

    const sql = `
        SELECT CASE WHEN ISNULL(MAX(user_attrs.flag)) THEN 0 ELSE 1 END AS isFavorited,
               spaces.id                                                as rawId,
               BIN_TO_UUID(spaces.id)                                   as id,
               BIN_TO_UUID(spaces.uiTypeId)                             as uiTypeId,
               BIN_TO_UUID(spaces.ownedById)                            as ownedById,
               BIN_TO_UUID(spaces.parentId)                             as parentId,
               BIN_TO_UUID(spaces.spaceTypeId)                          as spaceTypeId,
               spaces.name                                              as name,
               spaces.allowed_subspaces,
               spaces.asset_parameters,
               spaces.child_placement,
               spaces.created_at,
               spaces.updated_at,
               spaces.visible,
               spaces.name_hash,
               spaces.mpath,
               spaces.asset_parameters,
               spaces.parameters2D,
               spaces.updated_at,
               spaces.created_at,
               spaces.parameters3D,
               spaces.allowed_subspaces,
               spaces.secret,
               spaces.visible,
               spaces.child_placement,
               spaces.minimap,
               spaces.frame_templates,
               spaces.metadata,
               CASE operatorSpace.visible
                   WHEN 1 THEN BIN_TO_UUID(operatorSpace.id)
                   ELSE NULL
                   END                                                  AS 'operatorSpaceId'
        FROM spaces
                 LEFT JOIN spaces operatorSpace ON operatorSpace.id = spaces.parentId
                 LEFT JOIN spaces operatorNodes ON operatorNodes.parentId = operatorSpace.id
                 LEFT JOIN user_space_attributes user_attrs ON user_attrs.spaceId = spaces.id
            AND user_attrs.userId = ${escape(user.id)}
                 LEFT JOIN attributes attrs ON attrs.id = user_attrs.attributeId
            AND attrs.name = ${escape(AttributeType.FAVORITE)}
        WHERE true
          AND JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_id") IS NOT NULL 
          ${filterSQL}


        GROUP BY rawId
        ORDER BY ISNULL(user_attrs.spaceId) ASC,
                 operatorSpace.visible DESC,
                 CAST(
                         JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.commission")
                     AS DECIMAL(2, 2)
                     ) ASC,
                 CAST(
                         JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.ownStake")
                     AS UNSIGNED
                     ) DESC,
                 COUNT(operatorNodes.id) ASC,
                CAST(
                         JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.identity.judgements") AS CHAR
                    ) <> 'null' DESC,
                 spaces.name DESC;
    `;

    const rows = await this.connection.query(sql);
    return rows.map((r) => {
      delete r.rawId; // was added to group by the binary id
      return {
        ...r,
        isFavorited: parseInt(r.isFavorited) === 1 ? true : false,
        metadata: JSON.parse(r.metadata),
      };
    });
  }

  public async getValidators_v2(user: User, withIdentity?: boolean, parentSpaceId?: string, isFavorited?: boolean) {
    let filterSQL = ``;

    if (withIdentity === true) {
      // can be undefined, someday we might want to implement false
      filterSQL += `
          AND CAST(JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.identity.judgements") AS CHAR) <> 'null'
      `;
    }

    if (parentSpaceId) {
      filterSQL += `
          AND spaces.parentId = UUID_TO_BIN(${escape(parentSpaceId)})
      `;
    }

    if (isFavorited) {
      filterSQL += `
          AND user_attrs.flag IS NOT NULL
      `;
    }

    const sql = `
        SELECT CASE WHEN ISNULL(MAX(user_attrs.flag)) THEN 0 ELSE 1 END AS isFavorited,
               spaces.id                                                as rawId,
               BIN_TO_UUID(spaces.id)                                   as id,
               BIN_TO_UUID(spaces.uiTypeId)                             as uiTypeId,
               BIN_TO_UUID(spaces.ownedById)                            as ownedById,
               BIN_TO_UUID(spaces.parentId)                             as parentId,
               BIN_TO_UUID(spaces.spaceTypeId)                          as spaceTypeId,
               spaces.name                                              as name,
               spaces.allowed_subspaces,
               spaces.asset_parameters,
               spaces.child_placement,
               spaces.created_at,
               spaces.updated_at,
               spaces.visible,
               spaces.name_hash,
               spaces.mpath,
               spaces.asset_parameters,
               spaces.parameters2D,
               spaces.updated_at,
               spaces.created_at,
               spaces.parameters3D,
               spaces.allowed_subspaces,
               spaces.secret,
               spaces.visible,
               spaces.child_placement,
               spaces.minimap,
               spaces.frame_templates,
               CASE operatorSpace.visible
                   WHEN 1 THEN BIN_TO_UUID(operatorSpace.id)
                   ELSE NULL
                   END                                                  AS 'operatorSpaceId'
        FROM spaces
                 LEFT JOIN spaces operatorSpace ON operatorSpace.id = spaces.parentId
                 LEFT JOIN spaces operatorNodes ON operatorNodes.parentId = operatorSpace.id
                 LEFT JOIN user_space_attributes user_attrs ON user_attrs.spaceId = spaces.id
            AND user_attrs.userId = ${escape(user.id)}
                 LEFT JOIN attributes attrs ON attrs.id = user_attrs.attributeId
            AND attrs.name = ${escape(AttributeType.FAVORITE)}
        WHERE true
          AND JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_id") IS NOT NULL 
          ${filterSQL}


        GROUP BY rawId
        ORDER BY ISNULL(user_attrs.spaceId) ASC,
                 operatorSpace.visible DESC,
                 CAST(
                         JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.commission")
                     AS DECIMAL(2, 2)
                     ) ASC,
                 CAST(
                         JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.ownStake")
                     AS UNSIGNED
                     ) DESC,
                 COUNT(operatorNodes.id) ASC,
                CAST(
                         JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.identity.judgements") AS CHAR
                    ) <> 'null' DESC,
                 spaces.name DESC;
    `;

    const rows = await this.connection.query(sql);
    return rows.map((r) => {
      delete r.rawId; // was added to group by the binary id
      return {
        ...r,
        isFavorited: parseInt(r.isFavorited) === 1 ? true : false,
      };
    });
  }
}
