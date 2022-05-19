import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SpaceService } from './space.service';
import { uuidToBytes } from '../utils/uuid-converter';
import { UiTypeService } from '../ui-type/ui-type.service';
import { UiType } from '../ui-type/ui-type.entity';
import { UiTypes } from '../ui-type/ui-type.interface';

async function bootstrap() {
  const application = await NestFactory.createApplicationContext(AppModule);
  const spaceService = application.get(SpaceService);
  const uiTypeService = application.get(UiTypeService);
  const uiType: UiType = await uiTypeService.findOne(UiTypes.DASHBOARD);

  const command = process.argv[2];
  const spaceId = process.argv[3];
  const worldId = process.argv[4];

  switch (command) {
    case 'lift':
      const liftRes = await spaceService.liftInitiative(uuidToBytes(spaceId), uuidToBytes(worldId), uiType);
      console.log(liftRes);
      break;
    case 'archive':
      const archiveRes = await spaceService.archiveInitiative(uuidToBytes(spaceId));
      console.log(archiveRes);
      break;
    default:
      console.log('Command not found');
      process.exit(1);
  }

  await application.close();
  process.exit(0);
}

bootstrap();
