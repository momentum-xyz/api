import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { INestApplication } from '@nestjs/common';
import axios from 'axios';
import { User } from './user.entity';
import { uuidToBytes } from '../utils/uuid-converter';
import { UserService } from './user.service';
import { UserTypeService } from '../user-type/user-type.service';
import { MqttService } from '../services/mqtt.service';
import { Connection } from 'typeorm';

describe('Users ', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  let userService: UserService;
  let userTypeService: UserTypeService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    userService = moduleRef.get<UserService>(UserService);
    userTypeService = moduleRef.get<UserTypeService>(UserTypeService);

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    const connection = moduleRef.get(Connection);
    const query = connection.query.bind(connection);

    try {
      await query('DELETE FROM world_definition;');
      await query('DELETE FROM url_mapping;');
      await query('DELETE FROM online_users;');
      await query('DELETE FROM user_spaces;');
      await query('DELETE FROM spaces;');
      await query('DELETE FROM users;');
      await query('DELETE FROM user_types;');
      await query('DELETE FROM space_types;');
      await query('DELETE FROM ui_types;');
    } catch (e) {
      console.log(e);
    }
    // It will seed user_types table
    await userTypeService.onModuleInit();
  });

  it(`GET /users/me/associated`, async () => {
    const jwt = await getJWT();

    await createUser();

    return request(app.getHttpServer())
      .get('/users/me/associated')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject([
          {
            type: 'Buffer',
            data: [139, 181, 53, 89, 27, 246, 72, 225, 146, 25, 134, 220, 53, 164, 252, 229],
          },
        ]);
      });
  });

  it(`POST /users/check - Case 1: existed user`, async () => {
    const jwt = await getJWT();

    await createUser();

    return request(app.getHttpServer())
      .post('/users/check')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          status: 200,
          userOnboarded: true,
        });
      });
  });

  it(`POST /users/check - Case 2: non existed user`, async () => {
    const jwt = await getJWT();

    // await createUser();

    return request(app.getHttpServer())
      .post('/users/check')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          status: 200,
          userOnboarded: false,
        });
      });
  });

  it(`GET /users/:userId/initiatives`, async () => {
    const jwt = await getJWT();
    const worldId = '00000000-0000-0000-0000-000000000003';

    try {
      await createUser();
      await createUserB();

      const connection = moduleRef.get(Connection);
      const query = connection.query.bind(connection);

      await query(
        `
            INSERT INTO ui_types (id, name, tag)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000001'), 'first', 'tag');
        `,
      );

      await query(
        `
            INSERT INTO space_types (id, name, asset, description)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000010'), 'Universe',
                    0x0000000000000000000000000000000a,
                    'description'),
                   (UUID_TO_BIN('00000000-0000-0000-0000-000000000002'), 'challenge-initiative',
                    0x0000000000000000000000000000000a,
                    'description'),
                   (UUID_TO_BIN('00000000-0000-0000-0000-000000000012'), 'project-initiative',
                    0x0000000000000000000000000000000a,
                    'description');
        `,
      );

      await query(
        `
            INSERT INTO spaces (id, uiTypeId, spaceTypeId, parentId, name, name_hash, asset_subtype,
                                allowed_subspaces, ownedById)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000000'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000010'), null, 'Universe', 'hhh',
                    'subtype_asset', '{}',
                    UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5')),
                   (UUID_TO_BIN('${worldId}'), UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000002'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000000'), 'world', 'hhh',
                    'subtype_asset', '{}',
                    UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'))
            ;
        `,
      );

      await query(
        `
            INSERT INTO online_users (userId, spaceId)
            VALUES (UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'),
                    UUID_TO_BIN('${worldId}')),
                   (UUID_TO_BIN('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb'),
                    UUID_TO_BIN('${worldId}'))
        `,
      );

      await query(
        `
            INSERT INTO user_spaces (spaceId, userId, isAdmin)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000003'), UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'), 1)
        `,
      );
    } catch (e) {
      console.log(e);
    }

    return request(app.getHttpServer())
      .get(`/users/8bb53559-1bf6-48e1-9219-86dc35a4fce5/initiatives`)
      .set('Authorization', `Bearer ${jwt}`)
      .query({ world: '00000000-0000-0000-0000-000000000003' })
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject([
          {
            spaceId: {
              type: 'Buffer',
              data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
            },
            userId: {
              type: 'Buffer',
              data: [139, 181, 53, 89, 27, 246, 72, 225, 146, 25, 134, 220, 53, 164, 252, 229],
            },
            isAdmin: 1,
            space: {
              id: {
                type: 'Buffer',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3],
              },
              parentId: {
                type: 'Buffer',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
              },
              ownedById: {
                type: 'Buffer',
                data: [139, 181, 53, 89, 27, 246, 72, 225, 146, 25, 134, 220, 53, 164, 252, 229],
              },
              uiTypeId: {
                type: 'Buffer',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
              },
              spaceTypeId: {
                type: 'Buffer',
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
              },
              name: 'world',
              nameHash: 'hhh',
              secret: 0,
              assetParameters: {},
              parameters2D: {},
              allowed_subspaces: {},
              parameters3D: {},
              spaceType: {
                id: {
                  type: 'Buffer',
                  data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                },
                name: 'challenge-initiative',
                asset: {
                  type: 'Buffer',
                  data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10],
                },
                auxiliaryTables: [],
                description: 'description',
                typeParameters: {},
                defaultInstanceParameters: {},
                assetTypes: '[]',
                typeParameters_2D: {},
                typeParameters_3D: {},
                default_tiles: [],
                frame_templates: [],
                allowed_subspaces: {},
              },
            },
          },
        ]);
      });
  });

  it(`GET /users/online/:worldId`, async () => {
    const jwt = await getJWT();
    const worldId = '00000000-0000-0000-0000-000000000003';

    try {
      await createUser();
      await createUserB();

      const connection = moduleRef.get(Connection);
      const query = connection.query.bind(connection);

      await query(
        `
            INSERT INTO ui_types (id, name, tag)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000001'), 'first', 'tag');
        `,
      );

      await query(
        `
            INSERT INTO space_types (id, name, asset, description)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000002'), 'type_name', 0x0000000000000000000000000000000a,
                    'description');
        `,
      );

      await query(
        `
            INSERT INTO spaces (id, uiTypeId, spaceTypeId, parentId, name, name_hash, asset_subtype,
                                allowed_subspaces, ownedById)
            VALUES (UUID_TO_BIN('${worldId}'), UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000002'), null, 'world', 'hhh',
                    'subtype_asset', '{}',
                    UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'));
        `,
      );

      await query(
        `
            INSERT INTO online_users (userId, spaceId)
            VALUES (UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'),
                    UUID_TO_BIN('${worldId}')),
                   (UUID_TO_BIN('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb'),
                    UUID_TO_BIN('${worldId}'))
        `,
      );
    } catch (e) {
      console.log(e);
    }

    return request(app.getHttpServer())
      .get(`/users/online/${worldId}`)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject([
          {
            id: {
              type: 'Buffer',
              data: [139, 181, 53, 89, 27, 246, 72, 225, 146, 25, 134, 220, 53, 164, 252, 229],
            },
            name: 'FFF LLL',
            profile: {},
          },
          {
            id: {
              type: 'Buffer',
              data: [187, 187, 187, 187, 17, 17, 17, 17, 17, 17, 187, 187, 187, 187, 187, 187],
            },
            name: 'BBB BBB',
            profile: {},
          },
        ]);
      });
  });

  it(`GET /users/search`, async () => {
    const jwt = await getJWT();
    const worldId = '00000000-0000-0000-0000-000000000003';

    try {
      await createUser();
      await createUserB();

      const connection = moduleRef.get(Connection);
      const query = connection.query.bind(connection);

      await query(
        `
            INSERT INTO ui_types (id, name, tag)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000001'), 'first', 'tag');
        `,
      );

      await query(
        `
            INSERT INTO space_types (id, name, asset, description)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000002'), 'type_name', 'asset',
                    'description');
        `,
      );

      await query(
        `
            INSERT INTO spaces (id, uiTypeId, spaceTypeId, parentId, name, name_hash, asset_subtype,
                                allowed_subspaces, ownedById)
            VALUES (UUID_TO_BIN('${worldId}'), UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000002'), null, 'world', 'hhh',
                    'subtype_asset', '{}',
                    UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'));
        `,
      );

      await query(
        `
            INSERT INTO online_users (userId, spaceId)
            VALUES (UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'),
                    UUID_TO_BIN('${worldId}')),
                   (UUID_TO_BIN('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb'),
                    UUID_TO_BIN('${worldId}'))
        `,
      );
    } catch (e) {
      console.log(e);
    }

    return request(app.getHttpServer())
      .get(`/users/search`)
      .query({ page: 1, limit: 10, q: 'ee@ee.ee' })
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          results: [
            {
              id: {
                type: 'Buffer',
                data: [139, 181, 53, 89, 27, 246, 72, 225, 146, 25, 134, 220, 53, 164, 252, 229],
              },
              name: 'FFF LLL',
              profile: {},
            },
          ],
          itemCount: 1,
          totalItems: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        });
      });
  });

  it(`GET /users/me`, async () => {
    const jwt = await getJWT();

    await createUser();

    return request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toMatchObject({
          id: {
            type: 'Buffer',
            data: [139, 181, 53, 89, 27, 246, 72, 225, 146, 25, 134, 220, 53, 164, 252, 229],
          },
          wallet: null,
          name: 'FFF LLL',
          email: 'ee@ee.ee',
          profile: {},
          description: null,
        });
      });
  });

  it(`GET /users/profile/:id`, async () => {
    await createUser();

    return (
      request(app.getHttpServer())
        .get('/users/profile/8bb53559-1bf6-48e1-9219-86dc35a4fce5')
        // .set('Authorization', `Bearer ${jwt}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toMatchObject({
            id: {
              type: 'Buffer',
              data: [139, 181, 53, 89, 27, 246, 72, 225, 146, 25, 134, 220, 53, 164, 252, 229],
            },
            wallet: null,
            name: 'FFF LLL',
            profile: {},
            description: null,
            parsedId: '8bb53559-1bf6-48e1-9219-86dc35a4fce5',
          });
        })
    );
  });

  it(`PUT /users/set-name`, async (done) => {
    const jwt = await getJWT();

    await createUser();

    return request(app.getHttpServer())
      .put('/users/set-name')
      .set('Authorization', `Bearer ${jwt}`)
      .set('Content-Type', `application/x-www-form-urlencoded`)
      .send({ name: 'New NAME' })
      .expect(200)
      .expect(async (res) => {
        const r = await moduleRef.get(Connection).query(
          `SELECT *
           FROM users
           WHERE id = UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5')`,
        );

        try {
          expect(r[0]).toMatchObject({ name: 'New NAME' });
          done();
        } catch (e) {
          done(e);
        }
      });
  });

  it(`POST /users/invite`, async (done) => {
    // Clean up mailcatcher. Delete all emails
    await axios.delete('http://localhost:1080/messages');

    const jwt = await getJWT();
    const worldId = '00000000-0000-0000-0000-000000000003';

    try {
      await createUser();
      await createUserB();

      const connection = moduleRef.get(Connection);
      const query = connection.query.bind(connection);

      await query(
        `
            INSERT INTO ui_types (id, name, tag)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000001'), 'first', 'tag');
        `,
      );

      await query(
        `
            INSERT INTO space_types (id, name, asset, description)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000010'), 'Universe',
                    'asset',
                    'description'),
                   (UUID_TO_BIN('00000000-0000-0000-0000-000000000002'), 'challenge-initiative',
                    'asset',
                    'description'),
                   (UUID_TO_BIN('00000000-0000-0000-0000-000000000012'), 'project-initiative',
                    'asset',
                    'description');
        `,
      );

      await query(
        `
            INSERT INTO spaces (id, uiTypeId, spaceTypeId, parentId, name, name_hash, asset_subtype,
                                allowed_subspaces, ownedById)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000000'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000010'), null, 'Universe', 'hhh',
                    'subtype_asset', '{}',
                    UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5')),
                   (UUID_TO_BIN('${worldId}'), UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000002'),
                    UUID_TO_BIN('00000000-0000-0000-0000-000000000000'), 'world', 'hhh',
                    'subtype_asset', '{}',
                    UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'))
            ;
        `,
      );

      await query(
        `
            INSERT INTO online_users (userId, spaceId)
            VALUES (UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'),
                    UUID_TO_BIN('${worldId}')),
                   (UUID_TO_BIN('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb'),
                    UUID_TO_BIN('${worldId}'))
        `,
      );

      await query(
        `
            INSERT INTO user_spaces (spaceId, userId, isAdmin)
            VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000003'), UUID_TO_BIN('8bb53559-1bf6-48e1-9219-86dc35a4fce5'), 1)
        `,
      );

      await query(
        `
            INSERT INTO url_mapping (URL, worldId)
            VALUES ('www', UUID_TO_BIN('00000000-0000-0000-0000-000000000003'));
        `,
      );
    } catch (e) {
      console.log(e);
    }

    const resp = await request(app.getHttpServer())
      .post(`/users/invite`)
      .set('Authorization', `Bearer ${jwt}`)
      .set('Content-Type', `application/x-www-form-urlencoded`)
      .query({ world: '00000000-0000-0000-0000-000000000003' })
      .send({ email: 'new_email@ee.ee', spaceId: '00000000-0000-0000-0000-000000000003' });

    expect(resp.status).toEqual(201);
    expect(resp.body).toEqual({ status: 201, message: 'Invitation was successfully created' });

    const r = await axios.get('http://localhost:1080/messages/1.json');
    const email = r.data;

    expect(email).toMatchObject({
      id: 1,
      sender: '<test@ee.ee>',
      recipients: ['<new_email@ee.ee>'],
      subject: 'You have been invited to join a Momentum space!',
      size: '385',
      type: 'text/html',
      formats: ['source', 'html'],
      attachments: [],
    });

    done();
  });

  afterEach(async () => {
    console.log('-');
  });

  afterAll(async () => {
    const mqttService = moduleRef.get(MqttService);
    const connection = moduleRef.get(Connection);

    await app.close();

    console.log('mqtt connected:', mqttService.client.connected);
    console.log('mysql connected:', connection.isConnected);

    const promise = new Promise((resolve) => {
      mqttService.client.end(true, (e) => {
        resolve(e);
      });
    });

    await promise;
    console.log('mqtt connected:', mqttService.client.connected);
  });

  async function createUser() {
    const user: User = new User();
    user.id = uuidToBytes('8bb53559-1bf6-48e1-9219-86dc35a4fce5');

    user.name = 'FFF LLL';
    user.userType = await userTypeService.findOne('User');
    user.email = 'ee@ee.ee';
    user.profile = { profileLink: '1', bio: '2', avatarHash: '3', location: '4' };

    await userService.create(user);
  }

  async function createUserB() {
    const user: User = new User();
    user.id = uuidToBytes('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb');

    user.name = 'BBB BBB';
    user.userType = await userTypeService.findOne('User');
    user.email = 'bb@bb.bb';

    await userService.create(user);
  }
});

async function getJWT(): Promise<string> {
  try {
    const options = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    const params = new URLSearchParams({
      username: 'myuser',
      password: 'pass',
      grant_type: 'password',
      client_id: 'myclient',
    });

    const r = await axios.post(
      `${process.env.OIDC_MOMENTUM_URL}/protocol/openid-connect/token`,
      params.toString(),
      options,
    );

    return r.data.access_token;
  } catch (e) {
    console.log(e);
  }
}
