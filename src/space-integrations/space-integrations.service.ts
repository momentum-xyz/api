import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceIntegration } from './space-integrations.entity';
import { SpaceIntegrationUser } from '../space-integration-users/space-integration-users.entity';
import { SpaceIntegrationUserStatus } from '../space-integration-users/space-integration-users.interface';
import { IntegrationTypes } from '../integration-type/integration-type.interface';
import { User } from '../user/user.entity';
import { IntegrationType } from '../integration-type/integration-type.entity';
import { Space } from '../space/space.entity';
import { SpaceIntegrationUsersService } from '../space-integration-users/space-integration-users.service';
import { IntegrationDto, StageModeUserRole } from './space-integrations.interface';
import { StageModeService } from './stage-mode/stage-mode.service';
import { BroadcastService } from './broadcast/broadcast.service';
import { MiroService } from './miro/miro.service';
import { GoogleDriveService } from './googledrive/google-drive.service';

@Injectable()
export class SpaceIntegrationsService {
  constructor(
    @InjectRepository(SpaceIntegration)
    @Inject(SpaceIntegrationUsersService)
    @Inject(StageModeService)
    @Inject(BroadcastService)
    @Inject(MiroService)
    @Inject(GoogleDriveService)
    private readonly spaceIntegrationRepository: Repository<SpaceIntegration>,
    private readonly spaceIntegrationUsersService: SpaceIntegrationUsersService,
    private readonly stageModeService: StageModeService,
    private readonly broadcastService: BroadcastService,
    private readonly miroService: MiroService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async enable(
    spaceIntegration: SpaceIntegration,
    initiator: User,
    space: Space,
    integrationDto: IntegrationDto,
  ): Promise<SpaceIntegration> {
    spaceIntegration.data = integrationDto.data;

    const savedSpaceIntegration: SpaceIntegration = await this.spaceIntegrationRepository.save(spaceIntegration);

    switch (spaceIntegration.integrationType.name) {
      case IntegrationTypes.STAGE_MODE:
        await this.spaceIntegrationForModerator(spaceIntegration, initiator);
        const spaceIntegrationWithUser = await this.findOneById(
          savedSpaceIntegration.spaceId,
          savedSpaceIntegration.integrationTypeId,
        );
        await this.stageModeService.update(spaceIntegrationWithUser);
        return savedSpaceIntegration;
      case IntegrationTypes.BROADCAST:
        await this.broadcastService.startBroadcast(spaceIntegration);
        return savedSpaceIntegration;
      case IntegrationTypes.MIRO:
        await this.miroService.update(spaceIntegration);
        return savedSpaceIntegration;
      case IntegrationTypes.GOOGLE_DRIVE:
        await this.googleDriveService.update(spaceIntegration);
        return savedSpaceIntegration;
    }
  }

  /**
   * Create space integration user entry for the moderator that enabled stage-mode
  * TODO: move stage-mode related stuff into stage-mode/stage-mode.service
  * */
  private async spaceIntegrationForModerator(spaceIntegration: SpaceIntegration, user: User) {
    const data = { role: StageModeUserRole.SPEAKER };
    const flag = SpaceIntegrationUserStatus.JOINED;
    return await this.spaceIntegrationUsersService.createOrUpdate(spaceIntegration, user, data, flag);
  }

  async edit(
    spaceIntegration: SpaceIntegration,
    integrationDto: IntegrationDto,
    user?: User,
  ): Promise<SpaceIntegration> {
    spaceIntegration.data = integrationDto.data;

    const updateResult = await this.update(spaceIntegration);

    if (updateResult.affectedRows < 0) {
      throw Error('Something went wrong while updating the integration');
    }

    switch (spaceIntegration.integrationType.name) {
      case IntegrationTypes.STAGE_MODE:
        const spaceIntegrationUser = await this.spaceIntegrationForModerator(spaceIntegration, user);
        await this.spaceIntegrationUsersService.updateStatus(spaceIntegrationUser);
        await this.stageModeService.handleJoin(spaceIntegrationUser);
        await this.stageModeService.update(spaceIntegration);
        break;
      case IntegrationTypes.BROADCAST:
        await this.broadcastService.startBroadcast(spaceIntegration);
        break;
      case IntegrationTypes.MIRO:
        await this.miroService.update(spaceIntegration);
        break;
      case IntegrationTypes.GOOGLE_DRIVE:
        await this.googleDriveService.update(spaceIntegration);
        break;
    }

    return this.findOneById(spaceIntegration.spaceId, spaceIntegration.integrationTypeId);
  }

  async disable(spaceIntegration: SpaceIntegration, integrationDto: IntegrationDto): Promise<SpaceIntegration> {
    spaceIntegration.data = integrationDto.data;

    const updateResult = await this.update(spaceIntegration);

    if (updateResult.affectedRows < 0) {
      throw Error('Something went wrong while disabling the integration');
    }

    switch (spaceIntegration.integrationType.name) {
      case IntegrationTypes.STAGE_MODE:
        const spaceIntegrationUsers = await this.spaceIntegrationUsersService.findWhereSpace(spaceIntegration);
        for (const sIU of spaceIntegrationUsers) {
          if (sIU.flag === SpaceIntegrationUserStatus.JOINED) {
            sIU.flag = SpaceIntegrationUserStatus.LEFT;
            await this.spaceIntegrationUsersService.updateStatus(sIU);
            await this.stageModeService.handleLeave(sIU);
          }
        }
        await this.stageModeService.update(spaceIntegration);
        break;
      case IntegrationTypes.BROADCAST:
        await this.broadcastService.stopBroadcast(spaceIntegration.space);
        break;
      case IntegrationTypes.GOOGLE_DRIVE:
        await this.googleDriveService.update(spaceIntegration);
        break;
      case IntegrationTypes.MIRO:
        await this.miroService.update(spaceIntegration);
        break;
    }

    return this.findOneById(spaceIntegration.spaceId, spaceIntegration.integrationTypeId);
  }

  private async update(spaceIntegration: SpaceIntegration): Promise<any> {
    return await this.spaceIntegrationRepository.query(
      'UPDATE space_integrations SET `data` = ? WHERE spaceId = ? AND integrationTypeId = ?',
      [JSON.stringify(spaceIntegration.data), spaceIntegration.spaceId, spaceIntegration.integrationTypeId],
    );
  }

  async findOneBySpaceAndIntegration(space: Space, integrationType: IntegrationType): Promise<SpaceIntegration> {
    return this.spaceIntegrationRepository.findOne({
      where: {
        space: space,
        integrationType: integrationType,
      },
      relations: ['integrationType', 'space', 'spaceIntegrationUsers'],
    });
  }

  async findOneExisting(space: Space, integrationType: IntegrationType): Promise<SpaceIntegration> {
    return this.spaceIntegrationRepository.findOne({
      where: {
        space: space,
        integrationType: integrationType,
      },
      relations: ['integrationType', 'space'],
    });
  }

  async findOneById(spaceId: Buffer, integrationTypeId: Buffer): Promise<SpaceIntegration> {
    return this.spaceIntegrationRepository.findOne({
      where: {
        spaceId: spaceId,
        integrationTypeId: integrationTypeId,
      },
      relations: ['integrationType', 'space', 'spaceIntegrationUsers'],
    });
  }
}
