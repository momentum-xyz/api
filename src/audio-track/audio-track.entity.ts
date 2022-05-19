import { BeforeInsert, BeforeUpdate, Column, Entity, Index, OneToMany } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SpacePlaylist } from '../space-playlist/space-playlist.entity';

@Index('audio_tracks_id_uindex', ['id'], {})
@Entity('audio_tracks', { schema: 'momentum3a' })
export class AudioTrack {
  @Column('binary', { primary: true, name: 'id', length: 16 })
  id: Buffer;

  @Column('varchar', { name: 'name', length: 255 })
  name: string;

  @Column('varchar', { name: 'file_hash', length: 32 })
  file_hash: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => SpacePlaylist, (spacePlaylists) => spacePlaylists.track)
  spacePlaylists: SpacePlaylist[];

  @BeforeInsert()
  generateUuid() {
    this.id = Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date();
  }
}
