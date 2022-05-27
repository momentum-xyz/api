import { Injectable } from '@nestjs/common';
import { MqttService } from '../../services/mqtt.service';
import { SpaceIntegration } from '../space-integrations.entity';
import { bytesToUuid } from '../../utils/uuid-converter';
import { IntegrationTypes } from '../../integration-type/integration-type.interface';

@Injectable()
export class MiroService {
  constructor(private client: MqttService) {}

  async update(spaceIntegration: SpaceIntegration): Promise<void> {
    this.client.publish(
      `space_control/${bytesToUuid(spaceIntegration.spaceId)}/relay/collaboration`,
      JSON.stringify({
        integrationType: IntegrationTypes.MIRO,
        spaceId: bytesToUuid(spaceIntegration.spaceId),
      }),
      false,
      bytesToUuid(spaceIntegration.spaceId),
    );
  }
}
