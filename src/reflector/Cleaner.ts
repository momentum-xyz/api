import { Connection } from 'typeorm';
import { MQTT } from './MQTT';
import { ValidatorInfo } from './interfaces';
import { getKusamaConfig } from './functions';
import { escape } from 'mysql';

export class Cleaner {
  private timeout: NodeJS.Timeout;
  private validators: Record<string, boolean> = {};

  constructor(private readonly connection: Connection, private readonly mqtt: MQTT) {
    const listener = this.onValidatorTopic.bind(this);
    mqtt.onEvent('validator', listener);
    this.timeout = setTimeout(async () => {
      await this.removeAbsentValidators.bind(this);
      mqtt.removeListener('validator', listener);
    }, 60 * 1_000);
  }

  private async onValidatorTopic(validatorId: string, validator: ValidatorInfo, message: string) {
    if (validator.validatorAccountDetails) {
      this.validators[validatorId] = true;
    }
  }

  private async removeAbsentValidators(): Promise<void> {
    console.log('Cleaner.removeAbsentValidators');
    const config = await getKusamaConfig(this.connection);

    const values = Object.keys(this.validators).map((validatorId) => {
      return `${escape(validatorId)}`;
    });

    console.log(values);

    const sql = `
        DELETE spaces
        FROM spaces
                 JOIN space_attributes ON spaces.id = space_attributes.spaceId
        WHERE spaceTypeId = UUID_TO_BIN(${escape(config.space_types.validator_node)})
          AND space_attributes.attributeId = UUID_TO_BIN(${escape(config.attributes.kusama_validator_id)})
          AND space_attributes.value NOT IN (${values.join(',')})
    `;

    // TODO Enable after confirm from Jelle about validators
    // await this.connection.query(sql);
    console.log(sql);
  }
}
