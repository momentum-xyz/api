import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../user/user.entity';
import { Event } from '../events.entity';

@Entity('event_attendees', { schema: 'momentum3a' })
export class Attendee {
  @Column('binary', { primary: true, name: 'eventId', length: 16 })
  eventId: Buffer;

  @Column('binary', { primary: true, name: 'userId', length: 16 })
  userId: Buffer;

  @ManyToOne(() => Event, (event) => event.attendees, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'eventId', referencedColumnName: 'id' }])
  event: Event;

  @ManyToOne(() => User, (user) => user.attendees, {
    primary: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'userId', referencedColumnName: 'id' }])
  user: User;
}
