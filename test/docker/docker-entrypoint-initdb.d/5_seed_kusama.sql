USE `momentum-test`;

-- Create Kusama related space types
INSERT INTO space_types (id, name, asset, auxiliary_tables, description, type_parameters,
                         default_instance_parameters, asset_types, type_parameters_2D,
                         type_parameters_3D,
                         allowed_subspaces, default_tiles, frame_templates, child_placement)
VALUES (0x00000000000000000000000000000010, 'Kusama cloud', null, '[]', 'All Kusama validator here',
        '{}', '{}', '[]',
        '{}', '{}', '{}',
        '[]',
        '{}',
        '{}'),
       (0x00000000000000000000000000000011, 'Kusama validator', null, '[]', 'Kusama validator',
        '{}', '{}', '[]',
        '{}', '{}', '{}',
        '[]',
        '{}',
        '{}');

-- Create Kusama world
INSERT INTO spaces (id, ownedById, uiTypeId, spaceTypeId, parentId, name, name_hash,
                    mpath)
VALUES (0x00000000000000000000000000000012, 0x00000000000000000000000000000003,
        0x00000000000000000000000000000004,
        0x00000000000000000000000000000010, null, 'Kusama World', null, '');

-- Add attributes specific to Kusama validator spaces
INSERT INTO attributes (id, description, name)
VALUES (0x00000000000000000000000000000020, 'validator type', 'validator_type'),
       (0x00000000000000000000000000000021, 'validator id', 'validator_id');

-- Set Kusama related config
INSERT INTO world_definition (id, created_at, updated_at, tiers, userSpacesLimit, gat_anchor_space,
                              config)
VALUES (0x00000000000000000000000000000012, '2021-11-17 20:17:00', '2021-11-17 20:17:00',
        '[]',
        1, null,
        '{
            "Kusama_world": {
                "validator_cloud_space": "00000000-0000-0000-0000-000000000012",
                "validator_node_space_type": "00000000-0000-0000-0000-000000000011",
                "entity_space_type": "00000000-0000-0000-0000-000000000099",
                "validator_role_attribute_id": "00000000-0000-0000-0000-000000000020",
                "validator_id_attribute_id": "00000000-0000-0000-0000-000000000021"
            }
        }');