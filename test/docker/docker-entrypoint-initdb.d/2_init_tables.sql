USE `momentum-test`;

-- momentum3a.`attributes` definition

CREATE TABLE `attributes`
(
    `id`          binary(16)   NOT NULL,
    `description` text         NOT NULL,
    `parameters`  json         NOT NULL DEFAULT (json_object()),
    `name`        varchar(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Index_attributes_name` (`name`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.audio_tracks definition

CREATE TABLE `audio_tracks`
(
    `id`         binary(16) NOT NULL,
    `name`       text       NOT NULL,
    `file_hash`  text       NOT NULL,
    `created_at` timestamp  NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp  NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `audio_tracks_id_uindex` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.integration_types definition

CREATE TABLE `integration_types`
(
    `id`          binary(16)   NOT NULL,
    `name`        varchar(255) NOT NULL,
    `description` varchar(255) NOT NULL,
    `parameters`  json         NOT NULL DEFAULT (json_object()),
    `created_at`  timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.magic_links definition

CREATE TABLE `magic_links`
(
    `id`         varbinary(16)                                    NOT NULL,
    `type`       enum ('open_space','join_meeting','fly','event') NOT NULL,
    `data`       json                                             NOT NULL,
    `expire`     timestamp                                        NOT NULL,
    `created_at` timestamp                                        NOT NULL,
    `updated_at` timestamp                                        NOT NULL,
    PRIMARY KEY (`id`),
    KEY `ind_753` (`expire`),
    KEY `ind_768` (`type`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.migrations definition

CREATE TABLE `migrations`
(
    `id`        int                                                           NOT NULL AUTO_INCREMENT,
    `timestamp` bigint                                                        NOT NULL,
    `name`      varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 5
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.node_settings definition

CREATE TABLE `node_settings`
(
    `name`  varchar(255) NOT NULL,
    `value` text         NOT NULL,
    PRIMARY KEY (`name`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.settings definition

CREATE TABLE `settings`
(
    `name`       varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `value`      json                                                          NOT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`name`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.ui_types definition

CREATE TABLE `ui_types`
(
    `id`         binary(16)   NOT NULL,
    `name`       varchar(255) NOT NULL,
    `tag`        varchar(255) NOT NULL,
    `parameters` json         NOT NULL DEFAULT (json_object()),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.url_mapping definition

CREATE TABLE `url_mapping`
(
    `URL`     varchar(255) NOT NULL,
    `worldId` binary(16)   NOT NULL,
    PRIMARY KEY (`URL`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.user_types definition

CREATE TABLE `user_types`
(
    `id`          binary(16)   NOT NULL,
    `name`        varchar(255) NOT NULL,
    `description` varchar(255) NOT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.vanities definition

CREATE TABLE `vanities`
(
    `id`         binary(16)                                                    NOT NULL,
    `name`       varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- TODO should be removed after default value for uiTypeId will be removed
INSERT INTO ui_types (id, name, tag, parameters)
VALUES (0xA31722A626B746BC97F9435C380C3CA9, 'basic dashboard', 'basic dashboard', '{}');

-- momentum3a.space_types definition

CREATE TABLE `space_types`
(
    `id`                          binary(16)   NOT NULL,
    `name`                        varchar(127) NOT NULL,
    `asset`                       binary(16)            DEFAULT NULL,
    `auxiliary_tables`            json         NOT NULL DEFAULT (json_array()),
    `description`                 varchar(255)          DEFAULT NULL,
    `type_parameters`             json         NOT NULL DEFAULT (json_object()),
    `default_instance_parameters` json         NOT NULL DEFAULT (json_object()),
    `asset_types`                 json         NOT NULL DEFAULT (json_array()),
    `type_parameters_2D`          json         NOT NULL DEFAULT (json_object()),
    `type_parameters_3D`          json         NOT NULL DEFAULT (json_object()),
    `allowed_subspaces`           json         NOT NULL DEFAULT (json_object()),
    `default_tiles`               json         NOT NULL DEFAULT (json_array()),
    `frame_templates`             json         NOT NULL DEFAULT (json_array()),
    `child_placement`             json         NOT NULL DEFAULT (json_array()),
    `minimap`                     tinyint      NOT NULL DEFAULT '1',
    `uiTypeId`                    binary(16)   NOT NULL DEFAULT (uuid_to_bin(_utf8mb4'a31722a6-26b7-46bc-97f9-435c380c3ca9')),
    `visible`                     tinyint      NOT NULL DEFAULT '1',
    PRIMARY KEY (`id`),
    UNIQUE KEY `ind_796` (`name`),
    KEY `FK_1034` (`uiTypeId`),
    CONSTRAINT `FK_1032` FOREIGN KEY (`uiTypeId`) REFERENCES `ui_types` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.users definition

CREATE TABLE `users`
(
    `id`          binary(16)   NOT NULL,
    `userTypeId`  binary(16)   NOT NULL DEFAULT (uuid_to_bin(_utf8mb4'00000000-0000-0000-0000-000000000006')),
    `name`        varchar(255) NOT NULL,
    `email`       varchar(320) NOT NULL,
    `updated_at`  timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at`  timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `description` text,
    `wallet`      binary(32)            DEFAULT NULL,
    `profile`     json         NOT NULL DEFAULT (json_object()),
    PRIMARY KEY (`id`),
    KEY `fkIdx_471` (`userTypeId`),
    KEY `Index_842` (`wallet`),
    FULLTEXT KEY `ind_699` (`email`, `name`),
    FULLTEXT KEY `ind_779` (`name`),
    FULLTEXT KEY `ind_780` (`email`),
    CONSTRAINT `FK_470` FOREIGN KEY (`userTypeId`) REFERENCES `user_types` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.high_fives definition

CREATE TABLE `high_fives`
(
    `created_at` timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `senderId`   binary(16) NOT NULL,
    `receiverId` binary(16) NOT NULL,
    `cnt`        int        NOT NULL DEFAULT '0',
    PRIMARY KEY (`senderId`, `receiverId`),
    KEY `fkIdx_545` (`senderId`),
    KEY `fkIdx_548` (`receiverId`),
    CONSTRAINT `FK_544` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_547` FOREIGN KEY (`receiverId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.spaces definition

CREATE TABLE `spaces`
(
    `id`                binary(16)   NOT NULL,
    `ownedById`         binary(16)                                                    DEFAULT '\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0',
    `uiTypeId`          binary(16)                                                    DEFAULT NULL,
    `spaceTypeId`       binary(16)   NOT NULL,
    `parentId`          binary(16)                                                    DEFAULT NULL,
    `name`              varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `name_hash`         varchar(32)                                                   DEFAULT NULL,
    `mpath`             varchar(255) NOT NULL                                         DEFAULT '',
    `asset_parameters`  json         NOT NULL                                         DEFAULT (json_object()),
    `parameters2D`      json         NOT NULL                                         DEFAULT (json_object()),
    `updated_at`        timestamp    NOT NULL                                         DEFAULT CURRENT_TIMESTAMP,
    `created_at`        timestamp    NOT NULL                                         DEFAULT CURRENT_TIMESTAMP,
    `parameters3D`      json         NOT NULL                                         DEFAULT (json_object()),
    `allowed_subspaces` json                                                          DEFAULT NULL,
    `secret`            tinyint      NOT NULL                                         DEFAULT '0',
    `visible`           tinyint                                                       DEFAULT '1',
    `child_placement`   json                                                          DEFAULT NULL,
    `minimap`           tinyint                                                       DEFAULT NULL,
    `frame_templates`   json                                                          DEFAULT NULL,
    `metadata`          json                                                          DEFAULT NULL,
    `position`          json                                                          DEFAULT NULL,
    `asset`             binary(16)                                                    DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fkIdx_383` (`spaceTypeId`),
    KEY `fkIdx_403` (`parentId`),
    KEY `fkIdx_474` (`ownedById`),
    KEY `fkIdx_588` (`uiTypeId`),
    FULLTEXT KEY `ind_795` (`name`),
    CONSTRAINT `FK_382` FOREIGN KEY (`spaceTypeId`) REFERENCES `space_types` (`id`),
    CONSTRAINT `FK_402` FOREIGN KEY (`parentId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_473` FOREIGN KEY (`ownedById`) REFERENCES `users` (`id`) ON DELETE SET DEFAULT,
    CONSTRAINT `FK_587` FOREIGN KEY (`uiTypeId`) REFERENCES `ui_types` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.subscriptions definition

CREATE TABLE `subscriptions`
(
    `id`         binary(16)                                            NOT NULL,
    `email`      text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` timestamp                                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp                                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `data`       json                                                  NOT NULL DEFAULT (json_object()),
    `userId`     binary(16)                                                     DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `fkIdx_585` (`userId`),
    CONSTRAINT `FK_584` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.tiles definition

CREATE TABLE `tiles`
(
    `id`            binary(16)                                                  NOT NULL,
    `uiTypeId`      binary(16)                                                  NOT NULL,
    `spaceId`       binary(16)                                                  NOT NULL,
    `content`       json                                                        NOT NULL            DEFAULT (json_object()),
    `row`           int                                                         NOT NULL,
    `column`        int                                                         NOT NULL,
    `type`          enum ('tile_type_text','tile_type_media','tile_type_video') NOT NULL            DEFAULT 'tile_type_text',
    `created_at`    timestamp                                                   NOT NULL            DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    timestamp                                                   NOT NULL            DEFAULT CURRENT_TIMESTAMP,
    `render`        tinyint                                                     NOT NULL            DEFAULT '0',
    `permanentType` enum ('poster','meme','logo','description','video','problem','solution','info') DEFAULT NULL,
    `hash`          varchar(32)                                                 NOT NULL            DEFAULT 'a6d61b2bffb785299aa1eb26e1b540e9',
    `edited`        tinyint                                                     NOT NULL            DEFAULT '0',
    PRIMARY KEY (`id`, `uiTypeId`, `spaceId`),
    UNIQUE KEY `ind_712` (`spaceId`, `permanentType`),
    KEY `fkIdx_662` (`uiTypeId`),
    KEY `fkIdx_665` (`spaceId`),
    CONSTRAINT `FK_661` FOREIGN KEY (`uiTypeId`) REFERENCES `ui_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_664` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.token_whitelist_requests definition

CREATE TABLE `token_whitelist_requests`
(
    `id`                binary(16)   NOT NULL,
    `requester_id`      binary(16)   NOT NULL,
    `world_id`          binary(16)   NOT NULL,
    `token_name`        varchar(255) NOT NULL,
    `contract_address`  varchar(64)  NOT NULL,
    `network`           varchar(16)  NOT NULL,
    `token_type`        varchar(16)  NOT NULL,
    `token_category_id` varchar(255)          DEFAULT NULL,
    `status`            varchar(16)  NOT NULL,
    `processor_id`      binary(16)            DEFAULT NULL,
    `updated_at`        timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at`        timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `processed_at`      timestamp    NULL     DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `token_constraint` (`contract_address`, `network`),
    UNIQUE KEY `Index_963` (`token_name`),
    KEY `FK_TWR_WORLD` (`world_id`),
    KEY `FK_TWR_PROCESSOR` (`processor_id`),
    KEY `FK_TWR_REQUESTER` (`requester_id`),
    CONSTRAINT `FK_TWR_PROCESSOR` FOREIGN KEY (`processor_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_TWR_REQUESTER` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_TWR_WORLD_ID` FOREIGN KEY (`world_id`) REFERENCES `spaces` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.tokens definition

CREATE TABLE `tokens`
(
    `token_category_id`          varchar(255)          DEFAULT NULL,
    `id`                         binary(16)   NOT NULL,
    `token_name`                 varchar(255) NOT NULL,
    `token_whitelist_request_id` binary(16)   NOT NULL,
    `contract_address`           varchar(64)  NOT NULL,
    `network`                    varchar(16)  NOT NULL,
    `token_type`                 varchar(16)  NOT NULL,
    `world_id`                   binary(16)   NOT NULL,
    `updated_at`                 timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at`                 timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `token_constraint` (`network`, `contract_address`),
    UNIQUE KEY `Index_962` (`token_name`),
    KEY `FK_TOKENS_WORLD` (`world_id`),
    KEY `FK_TOKENS_TWRS` (`token_whitelist_request_id`),
    CONSTRAINT `FK_TOKEN_WORLD_ID` FOREIGN KEY (`world_id`) REFERENCES `spaces` (`id`),
    CONSTRAINT `FK_TWR_ID` FOREIGN KEY (`token_whitelist_request_id`) REFERENCES `token_whitelist_requests` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.user_lkp definition

CREATE TABLE `user_lkp`
(
    `spaceId`    binary(16) NOT NULL,
    `userId`     binary(16) NOT NULL,
    `x`          float      NOT NULL,
    `y`          float      NOT NULL,
    `z`          float      NOT NULL,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `worldId`    binary(16) NOT NULL,
    PRIMARY KEY (`userId`, `worldId`),
    KEY `fkIdx_489` (`spaceId`),
    KEY `fkIdx_492` (`userId`),
    KEY `FK_845` (`worldId`),
    CONSTRAINT `FK_488` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_491` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_843` FOREIGN KEY (`worldId`) REFERENCES `spaces` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.user_membership definition

CREATE TABLE `user_membership`
(
    `id`       binary(16) NOT NULL,
    `isAdmin`  tinyint    NOT NULL DEFAULT '0',
    `memberOf` binary(16) NOT NULL,
    PRIMARY KEY (`id`, `memberOf`),
    KEY `fkIdx_478` (`id`),
    KEY `fkIdx_481` (`memberOf`),
    CONSTRAINT `FK_477` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_480` FOREIGN KEY (`memberOf`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.user_space_attributes definition

CREATE TABLE `user_space_attributes`
(
    `attributeId` binary(16) NOT NULL,
    `userId`      binary(16) NOT NULL,
    `spaceId`     binary(16) NOT NULL,
    PRIMARY KEY (`attributeId`, `userId`, `spaceId`),
    KEY `fkIdx_676` (`attributeId`),
    KEY `fkIdx_682` (`userId`),
    KEY `fkIdx_693` (`spaceId`),
    CONSTRAINT `FK_675` FOREIGN KEY (`attributeId`) REFERENCES `attributes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_681` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_692` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.user_spaces definition

CREATE TABLE `user_spaces`
(
    `spaceId` binary(16) NOT NULL,
    `userId`  binary(16) NOT NULL,
    `isAdmin` tinyint    NOT NULL DEFAULT '0',
    PRIMARY KEY (`spaceId`, `userId`),
    KEY `fkIdx_419` (`spaceId`),
    KEY `fkIdx_486` (`userId`),
    CONSTRAINT `FK_418` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_485` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.user_spaces_dynamic definition

CREATE TABLE `user_spaces_dynamic`
(
    `userId`  binary(16) NOT NULL,
    `spaceId` binary(16) NOT NULL,
    PRIMARY KEY (`userId`, `spaceId`),
    KEY `FK_1026` (`spaceId`),
    KEY `FK_1029` (`userId`),
    CONSTRAINT `FK_1024` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`),
    CONSTRAINT `FK_1027` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.user_vanity definition

CREATE TABLE `user_vanity`
(
    `vanityId` binary(16) NOT NULL,
    `userId`   binary(16) NOT NULL,
    PRIMARY KEY (`vanityId`),
    KEY `fkIdx_495` (`userId`),
    KEY `fkIdx_653` (`vanityId`),
    CONSTRAINT `FK_494` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_652` FOREIGN KEY (`vanityId`) REFERENCES `vanities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.world_definition definition

CREATE TABLE `world_definition`
(
    `id`               binary(16) NOT NULL,
    `created_at`       timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `tiers`            json       NOT NULL DEFAULT (json_object()),
    `userSpacesLimit`  int        NOT NULL DEFAULT '0',
    `gat_anchor_space` binary(16)          DEFAULT NULL,
    `config`           json       NOT NULL DEFAULT (json_object()),
    PRIMARY KEY (`id`),
    KEY `fkIdx_828` (`id`),
    CONSTRAINT `FK_826` FOREIGN KEY (`id`) REFERENCES `spaces` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.wows definition

CREATE TABLE `wows`
(
    `userId`     binary(16) NOT NULL,
    `spaceId`    binary(16) NOT NULL,
    `updated_at` timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`userId`, `spaceId`),
    KEY `fkIdx_718` (`userId`),
    KEY `fkIdx_722` (`spaceId`),
    CONSTRAINT `FK_716` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_720` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.aux_table definition

CREATE TABLE `aux_table`
(
    `spaceId`    binary(16) NOT NULL,
    `some_stuff` varchar(32) DEFAULT NULL,
    PRIMARY KEY (`spaceId`),
    KEY `fkIdx_437` (`spaceId`),
    CONSTRAINT `FK_436` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.invitations definition

CREATE TABLE `invitations`
(
    `id`         binary(16)                                                    NOT NULL,
    `email`      varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    `expires_at` timestamp                                                     NOT NULL,
    `created_at` timestamp                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` timestamp                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `spaceId`    binary(16)                                                    NOT NULL,
    `isAdmin`    tinyint                                                       NOT NULL DEFAULT '0',
    PRIMARY KEY (`id`, `spaceId`),
    KEY `fkIdx_447` (`spaceId`),
    CONSTRAINT `FK_446` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.online_users definition

CREATE TABLE `online_users`
(
    `userId`     binary(16) NOT NULL,
    `spaceId`    binary(16) NOT NULL,
    `updated_at` timestamp  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`spaceId`, `userId`),
    KEY `fkIdx_789` (`userId`),
    KEY `fkIdx_792` (`spaceId`),
    CONSTRAINT `FK_787` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_790` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.space_attributes definition

CREATE TABLE `space_attributes`
(
    `attributeId` binary(16) NOT NULL,
    `spaceId`     binary(16) NOT NULL,
    `value`       int        NOT NULL,
    PRIMARY KEY (`attributeId`, `spaceId`, `value`),
    KEY `fkIdx_686` (`attributeId`),
    KEY `fkIdx_690` (`spaceId`),
    CONSTRAINT `FK_685` FOREIGN KEY (`attributeId`) REFERENCES `attributes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_689` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.space_integrations definition

CREATE TABLE `space_integrations`
(
    `spaceId`           binary(16) NOT NULL,
    `integrationTypeId` binary(16) NOT NULL,
    `data`              json       NOT NULL DEFAULT (json_object()),
    PRIMARY KEY (`spaceId`, `integrationTypeId`),
    KEY `fkIdx_615` (`integrationTypeId`),
    KEY `fkIdx_618` (`spaceId`),
    CONSTRAINT `FK_614` FOREIGN KEY (`integrationTypeId`) REFERENCES `integration_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_617` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.space_playlists definition

CREATE TABLE `space_playlists`
(
    `spaceId` binary(16) NOT NULL,
    `trackId` binary(16) NOT NULL,
    `order`   int        NOT NULL,
    PRIMARY KEY (`spaceId`, `trackId`, `order`),
    KEY `ID1` (`trackId`),
    KEY `FK_PLAYLIST_SPACE` (`spaceId`),
    CONSTRAINT `FK_PLAYLIST_SPACE` FOREIGN KEY (`spaceId`) REFERENCES `spaces` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_PLAYLIST_TRACK` FOREIGN KEY (`trackId`) REFERENCES `audio_tracks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.token_rules definition

CREATE TABLE `token_rules`
(
    `token_group_user_id` binary(16)   NOT NULL,
    `id`                  binary(16)   NOT NULL,
    `token_id`            binary(16)   NOT NULL,
    `space_id`            binary(16)   NOT NULL,
    `space_admin_id`      binary(16)   NOT NULL,
    `token_rule_name`     varchar(255) NOT NULL,
    `rule`                json         NOT NULL,
    `updated_at`          timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at`          timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `Index_961` (`token_rule_name`),
    KEY `FK_TOKEN_RULES_SPACE` (`space_id`),
    KEY `FK_TOKEN_RULES_GROUP` (`token_group_user_id`),
    KEY `FK_TOKEN_RULE_ADMIN` (`space_admin_id`),
    KEY `FK_TOKEN_RULES_TOKEN` (`token_id`),
    CONSTRAINT `FK_TR_ADMIN` FOREIGN KEY (`space_admin_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_TR_GROUP_USER` FOREIGN KEY (`token_group_user_id`) REFERENCES `users` (`id`),
    CONSTRAINT `FK_TR_SPACE` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`),
    CONSTRAINT `FK_TR_TID` FOREIGN KEY (`token_id`) REFERENCES `tokens` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.space_integration_events definition

CREATE TABLE `space_integration_events`
(
    `id`                binary(16)   NOT NULL,
    `spaceId`           binary(16)   NOT NULL,
    `integrationTypeId` binary(16)   NOT NULL,
    `title`             varchar(255) NOT NULL,
    `description`       text         NOT NULL,
    `hosted_by`         varchar(255) NOT NULL,
    `image_hash`        varchar(255) NOT NULL,
    `start`             datetime     NOT NULL,
    `end`               datetime     NOT NULL,
    `created`           timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `modified`          timestamp    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `web_link`          varchar(255)          DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `FK_SIE_SPACE_INTEGRATION` (`spaceId`, `integrationTypeId`),
    CONSTRAINT `FK_SIE_SPACE_INTEGRATION` FOREIGN KEY (`spaceId`, `integrationTypeId`) REFERENCES `space_integrations` (`spaceId`, `integrationTypeId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


-- momentum3a.space_integration_users definition

CREATE TABLE `space_integration_users`
(
    `spaceId`           binary(16) NOT NULL,
    `integrationTypeId` binary(16) NOT NULL,
    `userId`            binary(16) NOT NULL,
    `flag`              tinyint    NOT NULL DEFAULT '0',
    `data`              json       NOT NULL DEFAULT (json_object()),
    PRIMARY KEY (`spaceId`, `integrationTypeId`, `userId`),
    KEY `FK_SIU_SPACE_INTEGRATIONS` (`spaceId`, `integrationTypeId`),
    KEY `FK_SIU_USER` (`userId`),
    CONSTRAINT `FK_SIU_SPACE_INTEGRATIONS` FOREIGN KEY (`spaceId`, `integrationTypeId`) REFERENCES `space_integrations` (`spaceId`, `integrationTypeId`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `FK_SIU_USERS` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;