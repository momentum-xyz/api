import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Space } from '../space/space.entity';
import { AudioTrack } from '../audio-track/audio-track.entity';

@Index('FK1', ['spaceId'], {})
@Index('FK2', ['trackId'], {})
@Entity('space_playlists', { schema: 'momentum3a' })
export class SpacePlaylist {
  @Column('binary', { primary: true, name: 'trackId', length: 16 })
  trackId: Buffer;

  @Column('binary', { primary: true, name: 'spaceId', length: 16 })
  spaceId: Buffer;

  @Column('int', { primary: true, name: 'order', default: () => "'0'" })
  order: number;

  @ManyToOne(() => AudioTrack, (track) => track.spacePlaylists, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'trackId', referencedColumnName: 'id' }])
  track: AudioTrack;

  @ManyToOne(() => Space, (space) => space.spacePlaylists, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    primary: true,
  })
  @JoinColumn([{ name: 'spaceId', referencedColumnName: 'id' }])
  space: Space;
}
