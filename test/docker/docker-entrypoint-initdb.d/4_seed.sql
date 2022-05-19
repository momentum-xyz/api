USE `momentum-test`;

-- Create Deity user type
INSERT INTO user_types (id, name, description)
VALUES (0x00000000000000000000000000000002, 'Deity', 'They rule the world');

-- Create master user
INSERT INTO users (id, userTypeId, name, email, updated_at, created_at, description, wallet,
                   profile)
VALUES (0x00000000000000000000000000000003, 0x00000000000000000000000000000002, 'Odin',
        'master@momentum.org',
        '2021-08-24 02:46:34', '2021-08-24 02:46:34', null, null, '{}');

-- Create first UI type
INSERT INTO ui_types (id, name, tag)
VALUES (UUID_TO_BIN('00000000-0000-0000-0000-000000000004'), 'first', 'tag');
--        (0xA31722A626B746BC97F9435C380C3CA9, 'basic dashboard', 'basic dashboard');


-- Create Universe space type
INSERT INTO space_types (id, name, asset, auxiliary_tables, description, type_parameters,
                         default_instance_parameters, asset_types, type_parameters_2D,
                         type_parameters_3D,
                         allowed_subspaces, default_tiles, frame_templates, child_placement)
VALUES (0x00000000000000000000000000000001, 'Universe', null, '[]', 'All we know', '{}', '{}', '[]',
        '{}', '{}', '{}',
        '[]',
        '{}',
        '{}');

-- Create Universe
INSERT INTO spaces (id, ownedById, uiTypeId, spaceTypeId, parentId, name, name_hash,
                    mpath)
VALUES (0x00000000000000000000000000000000, 0x00000000000000000000000000000003,
        0x00000000000000000000000000000004,
        0x00000000000000000000000000000001, null, 'Universe', null, '');

