import { HttpService, Injectable } from '@nestjs/common';
import { Connection, Like } from 'typeorm';
import { MqttService } from '../services/mqtt.service';
import { bytesToUuid, uuidToBytes } from '../utils/uuid-converter';
import { arrayToTree } from '../utils/arrayToTree';
import { UserSpaceService } from '../user-space/user-space.service';
import { v4 as uuidv4 } from 'uuid';
import { Space } from './space.entity';
import { UiType } from '../ui-type/ui-type.entity';
import { SpaceType } from '../space-type/space-type.entity';
import { User } from '../user/user.entity';
import { Tile } from '../tile/tile.entity';
import { tileFactory } from '../tile/tile.factory';
import { TileService } from '../tile/tile.service';
import { SpaceTypeService } from '../space-type/space-type.service';
import { ISpaceType } from '../space-type/space-type.interface';
import { Tier } from '../world-definition/world-definition.entity';
import { SpaceRepository } from './SpaceRepository';
import { SPACE_VISIBILITY } from './space.entity';

@Injectable()
export class SpaceService {
  private readonly spaceRepository: SpaceRepository;

  constructor(
    private connection: Connection,
    private spaceTypeService: SpaceTypeService,
    private httpService: HttpService,
    private userSpaceService: UserSpaceService,
    private tileService: TileService,
    private client: MqttService,
  ) {
    this.spaceRepository = this.connection.getCustomRepository<SpaceRepository>(SpaceRepository);
  }

  findOne(spaceId: Buffer): Promise<Space> {
    return this.spaceRepository.findOne_andOverrideNulls({
      where: {
        id: spaceId,
      },
      relations: ['parent', 'parent.spaceType', 'children', 'spaceType', 'worldDefinition'],
    });
  }

  ownedSpaces(user: User): Promise<Space[]> {
    return this.spaceRepository.find_andOverrideNulls({
      where: {
        ownedBy: user,
      },
      relations: ['parent'],
    });
  }

  async filter(query: string): Promise<Space[]> {
    return this.spaceRepository.find_andOverrideNulls({
      order: { name: 'ASC' },
      where: [{ name: Like(`%${query}%`) }],
      relations: ['spaceType'],
    });
  }

  async createDefaultTiles(spaceType: SpaceType, space: Space) {
    const defaultTiles: Tile[] = tileFactory(spaceType.default_tiles, spaceType.uiTypeId, space.id);

    await this.tileService.create(space, defaultTiles);
  }

  async ancestors(space: Space) {
    return this.spaceRepository.query('call GetSpaceAncestorsIDs(?,?);', [space.id, 1]);
  }

  async getAncestorNode(space: Space) {
    const nodes = await this.spaceRepository.query('call GetSpaceAncestorsIDs(?,?);', [space.id, 1000]);
    return nodes[0][nodes[0].length - 1].id;
  }

  public async archiveInitiatives(archivedInitiatives: Space[], hel: Space[]) {
    for (const initiative of archivedInitiatives) {
      console.log('Archiving... - ' + initiative.name);
      const oldParentId = initiative.parentId;
      initiative.parent = hel[0];
      await this.updateSpace(oldParentId, initiative);
    }
  }

  public async archiveInitiative(initiativeId: Buffer) {
    const initiative = await this.findOne(initiativeId);

    if (!initiative) {
      throw Error('Initiative not found');
    }

    const morgueSpaceType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.MORGUE);
    const hel: Space[] = await this.findAllByType(morgueSpaceType);

    if (initiative.spaceType.name !== ISpaceType.CHALLENGE_INITIATIVE) {
      throw Error('Initiative not of type Challenge Initiative');
    }

    console.log('Archiving... - ' + initiative.name);
    const oldParentId = initiative.parentId;
    initiative.parent = hel[0];
    await this.updateSpace(oldParentId, initiative);
  }

  public async liftInitiative(initiativeId: Buffer, worldId: Buffer, uiType: UiType) {
    const world = await this.findOne(worldId);
    const initiative = await this.findOne(initiativeId);

    if (!initiative || !world) {
      throw Error('Initiative or world not found');
    }

    if (initiative.parent.spaceType.name !== ISpaceType.MORGUE) {
      throw Error('Initiative not in the morgue');
    }

    console.log('Restoring... ' + initiative.name);
    const oldParentId = initiative.parentId;
    initiative.parent = await this.findAnchor(world, uiType);
    initiative.updatedAt = new Date();
    await this.updateSpace(oldParentId, initiative);
  }

  async findAnchor(world: Space, uiType: UiType): Promise<Space> {
    const anchorType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.ANCHOR);
    const worldAnchors: Space[] = [];
    const anchors: Space[] = await this.spaceRepository.find_andOverrideNulls({
      where: {
        spaceType: anchorType,
      },
      relations: ['children'],
    });

    for (const anchor of anchors) {
      const worldAncestor = await this.ancestors(anchor);
      if (Buffer.compare(worldAncestor[0][1].parentId, world.id) === 0) {
        worldAnchors.push(anchor);
      }
    }

    return await this.analyseAnchors(world, uiType, anchorType, worldAnchors);
  }

  async analyseAnchors(world: Space, uiType: UiType, anchorType: SpaceType, anchors: Space[]): Promise<Space> {
    const parentAnchorType: SpaceType = await this.spaceTypeService.findOne(ISpaceType.ANCHOR_SATELLITE);

    const tiers: Tier[] = world.worldDefinition.tiers;
    const rootTier: Tier[] = tiers.filter((t) => t.spaceTypeId === bytesToUuid(world.spaceType.id));
    const currentTier: Tier[] = tiers.filter((t) => t.spaceTypeId === bytesToUuid(anchorType.id));
    const parentTier: Tier[] = tiers.filter((t) => t.spaceTypeId === bytesToUuid(parentAnchorType.id));

    const suitableAnchors: Space[] = anchors.filter((anchor) => {
      return anchor.children.length <= currentTier[0].childrenLimit;
    });

    if (suitableAnchors.length === 0) {
      const genAnchorUuid = uuidToBytes(uuidv4());

      const parentAnchors: Space[] = await this.spaceRepository.find({
        where: {
          spaceType: parentAnchorType,
        },
        relations: ['children'],
      });

      const suitableParents: Space[] = parentAnchors.filter((parentAnchor) => {
        return parentAnchor.children.length <= parentTier[0].childrenLimit;
      });

      let parentAnchor: Space;

      if (suitableParents.length === 0) {
        const genParentUuid = uuidToBytes(uuidv4());

        if (suitableParents.length >= rootTier[0].childrenLimit) {
          console.log('Satellite Anchor limit reached');
          return;
        }

        await this.createAnchor(world, parentAnchorType, genParentUuid);
        const savedParentAnchor = await this.findOne(genParentUuid);

        if (savedParentAnchor) {
          await this.createDefaultTiles(parentAnchorType, savedParentAnchor);
          await this.signalAnchorCreate(world.id, genParentUuid);
          parentAnchor = savedParentAnchor;
        }
      } else {
        parentAnchor = suitableParents[0];
      }

      await this.createAnchor(parentAnchor, anchorType, genAnchorUuid);
      const savedAnchor = await this.findOne(genAnchorUuid);

      if (savedAnchor) {
        await this.createDefaultTiles(anchorType, savedAnchor);
        await this.signalAnchorCreate(parentAnchor.id, genAnchorUuid);
        return savedAnchor;
      }
    } else {
      return suitableAnchors[0];
    }
  }

  async createAnchor(parent: Space, spaceType: SpaceType, genUuid: Buffer): Promise<Space> {
    let name: string;
    const res = await this.findAllByTypeInWorld(spaceType, parent);
    if (spaceType.name === ISpaceType.ANCHOR_SATELLITE) {
      const index = (res.length += 1);
      name = 'Moon #' + index.toString();
    } else {
      const index = res.length;
      name = 'Alpha Initiatives #' + index.toString();
    }

    const nameHash = await this.renderName(name);

    return this.spaceRepository.query(
      'INSERT INTO spaces (id, ownedById, uiTypeId, spaceTypeId, parentId, name, name_hash, secret) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        genUuid,
        uuidToBytes('00000000-0000-0000-0000000000000003'),
        spaceType.uiTypeId,
        spaceType.id,
        parent.id,
        name,
        nameHash,
        false,
      ],
    );
  }

  async findOneForDashboard(space_id: Buffer): Promise<Space> {
    const baseQuery = this.spaceRepository
      .createQueryBuilder('space')
      .innerJoinAndSelect('space.parent', 'parent')
      .innerJoinAndSelect('space.spaceType', 'spaceType')
      .innerJoinAndSelect('space.ownedBy', 'ownedBy')
      .leftJoinAndSelect('space.userSpaces', 'userSpace')
      .leftJoinAndSelect('userSpace.user', 'userSpaceUser')
      .leftJoinAndSelect('userSpaceUser.userType', 'userType');

    const space = await baseQuery.where({ id: space_id }).getOne();
    // Below could be subquery, but typeorm then only gives it back on raw results,
    // meaning we would need to manually transform it back in Space,
    // so for now:
    const children = await baseQuery
      .where({ parentId: space.id })
      .andWhere('COALESCE(space.visible, spaceType.visible) = :visible', {
        visible: SPACE_VISIBILITY.VISIBLE,
      })
      .getMany();
    // TODO: move this into query or drop it? Since it not recursive on the children spaces...
    space.children = children.map((c) => {
      this.spaceRepository.overrideNulledParamsIfPossible(c);
      return c;
    });
    this.spaceRepository.overrideNulledParamsIfPossible(space);
    return space;
  }

  findAllByType(spaceType: SpaceType): Promise<Space[]> {
    return this.spaceRepository.find_andOverrideNulls({
      where: {
        spaceType: spaceType,
      },
      relations: ['parent'],
    });
  }

  findAllByTypeWithParent(spaceType: SpaceType, parentId: Buffer): Promise<Space[]> {
    return this.spaceRepository.find_andOverrideNulls({
      where: {
        spaceType: spaceType,
        parentId: parentId,
      },
      relations: ['parent'],
    });
  }

  findAllByVisibleType(spaceType: SpaceType, visible: number): Promise<Space[]> {
    return this.spaceRepository.find_andOverrideNulls({
      where: {
        spaceType: spaceType,
        visible: visible,
      },
      relations: ['parent'],
    });
  }

  findAllByTypeAndOwner(spaceType: SpaceType, user: User): Promise<Space[]> {
    return this.spaceRepository.find({
      where: {
        spaceType: spaceType,
        ownedBy: user,
      },
      relations: ['parent'],
    });
  }

  private async findAllByTypeInWorld(spaceType: SpaceType, world: Space): Promise<Space[]> {
    return this.spaceRepository.find_andOverrideNulls({
      where: {
        spaceType: spaceType,
      },
      relations: ['parent'],
    });
  }

  async findDescendants(root: Space, visibility = SPACE_VISIBILITY.VISIBLE): Promise<any> {
    return await this.spaceRepository.query('call GetSpaceDescendantsTable(?,?,?);', [root.id, visibility, 1000]);
  }

  async findAncestors(root: Space, user: User): Promise<any> {
    return await this.spaceRepository.query('call GetSpaceAncestorsTableAdminRole(?,?);', [root.id, user.id]);
  }

  async findAllChildren(root: Space): Promise<any> {
    const procedureResponse = await this.findDescendants(root);
    const unparsed = JSON.stringify(procedureResponse[0]);

    const flatTree: any = JSON.parse(unparsed);

    flatTree.map((item) => {
      item.id = uuidToBytes(bytesToUuid(item.id.data));
      item.spaceTypeId = uuidToBytes(bytesToUuid(item.spaceTypeId.data));
      item.parentId = uuidToBytes(bytesToUuid(item.parentId.data));
    });

    // @ts-ignore
    return arrayToTree(flatTree, { throwIfOrphans: false, dataField: null, rootParentIds: { [root.parentId]: true } });
  }

  async findAllParents(root: Space, user: User): Promise<any> {
    const procedureResponse = await this.findAncestors(root, user);
    const unparsed = JSON.stringify(procedureResponse[0]);

    return JSON.parse(unparsed);
  }

  async findAllStringified(): Promise<string[]> {
    const uuids = [];

    const spaces: Space[] = await this.spaceRepository.find();

    spaces.map((space) => {
      const meta = {
        id: bytesToUuid(space.id),
        type: space.spaceType.name,
      };

      uuids.push(meta);
    });

    return uuids;
  }

  async renderName(text: string) {
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
      const frameResponse = await this.httpService.axiosRef({
        method: 'post',
        url: `${process.env.RENDER_INTERNAL_URL}/render/addframe`,
        data: jsonObject,
        headers: { 'Content-Type': `application/json` },
      });

      return frameResponse.data.hash;
    } catch (e) {
      console.error(e);
    }
  }

  async create(space: Space): Promise<Space> {
    return this.spaceRepository.save(space);
  }

  async signalCreate(space: Space) {
    await this.client.signalObjectUpdate(bytesToUuid(space.parent.id));
    await this.client.signalObjectCreate(bytesToUuid(space.id));
  }

  async signalAnchorCreate(parentUuid: Buffer, anchorUuid: Buffer) {
    await this.client.signalObjectUpdate(bytesToUuid(parentUuid));
    await this.client.signalObjectCreate(bytesToUuid(anchorUuid));
  }

  async updateSpace(oldParentId: Buffer, space: Space) {
    await this.spaceRepository.query(
      'UPDATE spaces SET parentId = ?, name = ?, name_hash = ?, secret = ?, updated_at = ? WHERE id = ?',
      [space.parent.id, space.name, space.nameHash, space.secret, space.updatedAt, space.id],
    );

    if (oldParentId !== space.parent.id) {
      await this.client.signalObjectUpdate(bytesToUuid(oldParentId));
      await this.client.signalObjectUpdate(bytesToUuid(space.parent.id));
    }

    await this.client.signalObjectUpdate(bytesToUuid(space.id));
  }

  async updateMedia(spaceId: Buffer) {
    await this.client.signalObjectUpdate(bytesToUuid(spaceId));
  }

  async accessUsers(space: Space) {
    return this.spaceRepository.query('call GetSpaceAccessUsers(?);', [space.id]);
  }

  async delete(space: Space): Promise<Space> {
    const parentId = space.parent.id;
    const thisId = space.id;

    const result = await this.spaceRepository.manager.getTreeRepository(Space).remove(space);
    await this.client.signalObjectUpdate(bytesToUuid(parentId));
    await this.client.signalObjectRemove(bytesToUuid(thisId));
    return result;
  }

  async checkInitiativeSpaceThreshold(user: User, world: Space): Promise<boolean> {
    const spaceThreshold = world.worldDefinition?.userSpacesLimit || 0;

    let spacesTowardsThreshold = 0;
    const ownedSpaces: Space[] = await this.ownedSpaces(user);

    for (const ownedSpace of ownedSpaces) {
      const isAdmin: boolean = await this.userSpaceService.isAdmin(ownedSpace.parent, user);

      if (!isAdmin) {
        // Should add world to owned spaces query result to avoid more queries
        const spaceWorldId = await this.getWorldId(ownedSpace);
        if (world.id.equals(spaceWorldId)) {
          spacesTowardsThreshold += 1;
        }
      }
    }
    return spacesTowardsThreshold < spaceThreshold;
  }

  /**
   * Get the world that contains this space.
   */
  async getWorldId(space: Space): Promise<Buffer> {
    const result = await this.spaceRepository.query('SELECT `GetParentWorldByID`(?) as worldId;', [space.id]);
    return result[0].worldId;
  }
}
