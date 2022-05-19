import { EntityRepository, FindManyOptions, Repository } from 'typeorm';
import { Space } from './space.entity';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';

@EntityRepository(Space)
export class SpaceRepository extends Repository<Space> {
  public async find_andOverrideNulls(options?: FindManyOptions<Space>): Promise<Space[]> {
    const spaces = await super.find(options);

    spaces.forEach(this.overrideNulledParamsIfPossible);

    return spaces;
  }

  async findOne_andOverrideNulls(options?: FindOneOptions<Space>): Promise<Space | undefined> {
    const space = await super.findOne(options);
    this.overrideNulledParamsIfPossible(space);
    return space;
  }

  overrideNulledParamsIfPossible(space: Space) {
    if (!space) {
      return;
    }

    const paramsToOverride = [
      'frame_templates',
      'allowed_subspaces',
      'child_placement',
      'minimap',
      'visible',
      'uiTypeId',
    ];

    for (const param of paramsToOverride) {
      if (!space.spaceType) {
        continue;
      }
      if (space[param] === null && space.spaceType[param] !== null) {
        space[param] = space.spaceType[param];
      }
    }
  }
}
