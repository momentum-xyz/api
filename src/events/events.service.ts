import { HttpService, Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { NewEventDto, ResponseEventDto, UpdateEventDto } from './event.interfaces';
import { v4 as uuidv4 } from 'uuid';
import { escape } from 'mysql';

@Injectable()
export class EventsService {
  constructor(private readonly connection: Connection, private httpService: HttpService) {}

  async getAll(spaceId: string, recursive = false): Promise<any> {
    let sql: string;
    if (recursive) {
      sql = `
        WITH RECURSIVE cte as (
          select id, parentId, name, 0 AS level
          FROM spaces
          WHERE id = UUID_TO_BIN(${escape(spaceId)})
          UNION ALL
          SELECT p.id, p.parentId, p.name, level + 1
          FROM spaces p
          INNER JOIN cte on p.parentId = cte.id
          WHERE level < 1000
        )
        SELECT BIN_TO_UUID(space_integration_events.id) as id,
               BIN_TO_UUID(spaceId)           as spaceId,
               BIN_TO_UUID(integrationTypeId) as integrationTypeId,
               title,
               description,
               hosted_by,
               image_hash,
               start,
               end,
               created,
               modified,
               web_link,
               cte.name as spaceName
          FROM space_integration_events
          INNER JOIN cte on cte.id = spaceId
          WHERE end >= NOW()
          ORDER BY start
      `;
    } else {
      sql = `
        SELECT BIN_TO_UUID(space_integration_events.id) as id,
               BIN_TO_UUID(spaceId)           as spaceId,
               BIN_TO_UUID(integrationTypeId) as integrationTypeId,
               title,
               description,
               hosted_by,
               image_hash,
               start,
               end,
               created,
               modified,
               web_link,
               spaces.name as spaceName
        FROM space_integration_events
        INNER JOIN spaces ON spaces.id = spaceId
        WHERE spaceId = UUID_TO_BIN(${escape(spaceId)})
          AND end >= NOW()
        ORDER BY start
    `;
    }

    return await this.connection.query(sql);
  }

  async getAllCount(): Promise<any> {
    const sql = `
        SELECT COUNT(*) FROM space_integration_events
    `;

    const rows = await this.connection.query(sql);
    return Number(Object.values(rows[0])[0]);
  }

  async getOne(spaceId: string, eventId: string): Promise<ResponseEventDto> {
    const sql = `
        SELECT BIN_TO_UUID(id)                as id,
               BIN_TO_UUID(spaceId)           as spaceId,
               BIN_TO_UUID(integrationTypeId) as integrationTypeId,
               title,
               description,
               hosted_by,
               image_hash,
               start,
               end,
               created,
               modified,
               web_link
        FROM space_integration_events
        WHERE spaceId = UUID_TO_BIN(${escape(spaceId)})
          AND id = UUID_TO_BIN(${escape(eventId)})
    `;

    const rows = await this.connection.query(sql);
    return rows[0];
  }

  async update(event: UpdateEventDto | { image_hash: string }, spaceId: string, eventId: string): Promise<number> {
    const pairs: string[] = [];

    for (const key in event) {
      if (key === 'end' || key === 'start') {
        pairs.push(`${key} = ${escape(new Date(event[key]))}`);
      } else {
        pairs.push(`${key} = ${escape(event[key])}`);
      }
    }

    pairs.push(`modified = NOW()`);

    const sql = `
        UPDATE space_integration_events
        SET ${pairs.join(', ')}
        WHERE spaceId = UUID_TO_BIN(${escape(spaceId)})
          AND id = UUID_TO_BIN(${escape(eventId)})
    `;

    const { affectedRows } = await this.connection.query(sql);
    return affectedRows;
  }

  async delete(spaceId: string, eventId: string): Promise<number> {
    const sql = `
        DELETE
        FROM space_integration_events
        WHERE spaceId = UUID_TO_BIN(${escape(spaceId)})
          AND id = UUID_TO_BIN(${escape(eventId)})
    `;

    const { affectedRows } = await this.connection.query(sql);
    return affectedRows;
  }

  async create(
    event: NewEventDto,
    spaceId: string,
    file: Express.Multer.File,
  ): Promise<{ id: string; image_hash: string }> {
    const id = uuidv4();

    let sql = `
        SELECT BIN_TO_UUID(id) as id
        FROM integration_types
        WHERE name = 'events';
    `;
    const [row] = await this.connection.query(sql);
    if (!row) {
      throw new Error('integrationTypeId not found in MySQL');
    }

    const integrationTypeId = row.id;

    sql = `
        INSERT IGNORE INTO space_integrations (spaceId, integrationTypeId)
        VALUES (UUID_TO_BIN(${escape(spaceId)}),
                UUID_TO_BIN(${escape(integrationTypeId)}))
    `;
    await this.connection.query(sql);

    let image_hash = '';
    if (file) {
      const res = await this.upload(file);
      image_hash = res.data.hash;
    }

    sql = `
        INSERT INTO space_integration_events (id, spaceId, integrationTypeId, title, description,
                                              hosted_by, image_hash, start,
                                              end, created, modified, web_link)
        VALUES (UUID_TO_BIN('${id}'),
                UUID_TO_BIN(${escape(spaceId)}),
                UUID_TO_BIN(${escape(integrationTypeId)}),
                ${escape(event.title)},
                ${escape(event.description)},
                ${escape(event.hosted_by)},
                ${escape(image_hash)},
                ${escape(new Date(event.start))},
                ${escape(new Date(event.end))},
                NOW(),
                NOW(),
                ${escape(event.web_link)});
    `;

    await this.connection.query(sql);

    return { id, image_hash };
  }

  async updateImage(
    file: Express.Multer.File,
    spaceId: string,
    eventId: string,
  ): Promise<{ affectedRows; image_hash }> {
    const res = await this.upload(file);
    const image_hash = res.data.hash;

    const affectedRows = await this.update({ image_hash }, spaceId, eventId);

    return { affectedRows, image_hash };
  }

  private async upload(file: Express.Multer.File): Promise<any> {
    return this.httpService.axiosRef({
      method: 'post',
      url: `${process.env.RENDER_INTERNAL_URL}/render/addimage`,
      maxBodyLength: 100000000,
      maxContentLength: 100000000,
      data: file.buffer,
      headers: { 'Content-Type': `image/png` },
    });
  }
}
