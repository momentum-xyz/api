import { escape } from 'mysql';
import { Connection } from 'typeorm';
import { getKusamaConfig } from '../reflector/functions';
import { KusamaConfig } from '../reflector/interfaces';
import { AsyncClient } from 'async-mqtt';
import { Client } from 'mqtt';

export class SyncEvent {
  private static NO_EVENT = 'No upcoming events';

  constructor(private readonly connection: Connection, private client: AsyncClient | Client) {}

  public async subscribe() {
    this.client.on('message', this.onMessage.bind(this));
    await this.client.subscribe('control/periodic/reftime', { qos: 0 });
  }

  private async onMessage(topic: string, message: Buffer) {
    if (topic === 'control/periodic/reftime') {
      if (message.toString()) {
        await this.syncAll();
      }
    }
  }

  public async update(eventId: string, spaceId: string) {
    // console.log('event_changed', eventId, spaceId);
    // console.log(this.client.client.connected);
    // console.log('---');
    // console.log(this.connection.isConnected);

    const config = await getKusamaConfig(this.connection);

    let sql = `
        SELECT start
        FROM space_integration_events
        WHERE true
          AND spaceId = UUID_TO_BIN(${escape(spaceId)})
          AND start >= NOW()
        ORDER BY start ASC
        LIMIT 1
    `;

    const rows = await this.connection.query(sql);
    let value: string = SyncEvent.NO_EVENT;
    if (rows[0]) {
      const start = rows[0].start as Date;
      value = this.formatDate(start);
    }

    sql = `
        INSERT INTO space_attributes (attributeId, spaceId, flag, value)
        VALUES (UUID_TO_BIN(${escape(config.attributes.date_of_next_event)}),
                UUID_TO_BIN(${escape(spaceId)}),
                0,
                ${escape(value)}
               ) AS new

        ON DUPLICATE KEY UPDATE flag  = new.flag,
                                value = new.value
    `;

    await this.connection.query(sql);

    await this.publish(`updates/spaces/changed`, spaceId, false);
    await this.publish(`updates/events/changed`, eventId, false);
  }

  public async syncAll() {
    const config = await getKusamaConfig(this.connection);

    const events = await this.selectEvents();

    await this.updateAttributeForSpaces(events, config);

    for (const event of events) {
      await this.publish(`updates/spaces/changed`, event.spaceId, false);
      await this.publish(`updates/events/changed`, event.eventId, false);
    }
  }

  private async selectEvents(): Promise<Event[]> {
    const sql = `
        SELECT BIN_TO_UUID(MIN(id)) AS id,
               BIN_TO_UUID(spaceId) AS spaceId,
               MIN(start)           AS start
        FROM space_integration_events
        WHERE true
          AND start >= NOW()
        GROUP BY spaceId
    `;

    const rows = (await this.connection.query(sql)) as Event[];
    // console.log(rows);
    const events = rows.map((row) => {
      const e: Event = {
        eventId: row.eventId,
        spaceId: row.spaceId,
        start: row.start,
        timestamp: row.start.getTime(),
      };
      return e;
    });

    return events;
  }

  private async updateAttributeForSpaces(events: Event[], config: KusamaConfig) {
    if (events.length == 0) {
      return;
    }
    const values: string[] = [];

    // TODO process by chunks of 5000 elements
    for (const e of events) {
      const str = `
      (
        UUID_TO_BIN(${escape(config.attributes.date_of_next_event)}),
        UUID_TO_BIN(${escape(e.spaceId)}),
        0,
        ${escape(this.formatDate(e.start))}
      )      
      `;

      values.push(str);
    }

    const runner = this.connection.createQueryRunner();

    try {
      await runner.query('BEGIN');

      let sql = `
        UPDATE space_attributes
        SET value = ${escape(SyncEvent.NO_EVENT)}
        WHERE attributeId = UUID_TO_BIN(${escape(config.attributes.date_of_next_event)})
    `;
      await runner.query(sql);

      sql = `
        INSERT INTO space_attributes (attributeId, spaceId, flag, value)
        VALUES ${values.join(',')} AS new

        ON DUPLICATE KEY UPDATE flag  = new.flag,
                                value = new.value
    `;

      await runner.query(sql);
      await runner.query('COMMIT');
    } catch (e) {
      console.error(e);
      await runner.query('ROLLBACK');
    } finally {
      await runner.release();
    }
  }

  private async publish(topic: string, message: string, retain: boolean) {
    await this.client.publish(topic, message, {
      retain: retain,
      qos: 1,
    });
  }

  private formatDate(d: Date): string {
    // 27/04/2022 19:09:53

    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');

    return `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}

type Event = {
  eventId: string;
  spaceId: string;
  start: Date;
  timestamp: number;
};
