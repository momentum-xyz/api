import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendee } from './attendee.entity';
import { UserSpace } from '../../user-space/user-space.entity';

@Injectable()
export class AttendeeService {
  constructor(
    @InjectRepository(Attendee)
    private readonly attendeeRepository: Repository<Attendee>,
  ) {}

  async findAllByEvent(eventId: Buffer, limit = false): Promise<Attendee[]> {
    let options;
    options = {
      where: {
        eventId: eventId,
      },
      relations: ['user'],
    };

    if (limit) {
      options = { ...options, limit: 8 };
    }

    return await this.attendeeRepository.find({ ...options });
  }

  findOne(attendee: Attendee): Promise<Attendee> {
    return this.attendeeRepository.findOne({
      where: {
        userId: attendee.userId,
        eventId: attendee.eventId,
      },
      relations: ['user'],
    });
  }

  async create(attendee: Attendee): Promise<UserSpace> {
    return this.attendeeRepository.query(
      `
      INSERT INTO event_attendees (eventId, userId) VALUES (?, ?);
     `,
      [attendee.eventId, attendee.userId],
    );
  }

  async delete(eventId: Buffer, userId: Buffer) {
    return this.attendeeRepository.query('DELETE FROM event_attendees WHERE eventId = ? AND userId = ?', [
      eventId,
      userId,
    ]);
  }
}
