CREATE TABLE `token_whitelist_requests`
(
 `id`                   binary(16) NOT NULL ,
 `requester_id`         binary(16) NOT NULL ,
 `world_id`             binary(16) NOT NULL ,
 `token_name`           varchar(1024) NOT NULL ,
 `contract_address`     varchar(64) NOT NULL ,
 `network`              varchar(16) NOT NULL ,
 `token_type`           varchar(16) NOT NULL ,
 `token_category_id`    varchar(255) ,
 `status`               varchar(16) NOT NULL ,
 `processor_id`         binary(16) NULL ,
 `updated_at`           timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
 `created_at`           timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
 `processed_at`         timestamp NULL ,
 CONSTRAINT `token_constraint` UNIQUE (`contract_address`,`network`),

PRIMARY KEY (`id`)
);

CREATE TABLE `tokens`
(
 `id`                         binary(16) NOT NULL ,
 `token_name`                 varchar(1024) NOT NULL ,
 `token_whitelist_request_id` binary(16) NOT NULL ,
 `contract_address`           varchar(64) NOT NULL ,
 `network`                    varchar(16) NOT NULL ,
 `token_type`                 varchar(16) NOT NULL ,
 `token_category_id`          varchar(255) ,
 `world_id`                   binary(16) NOT NULL ,
 `updated_at`                 timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
 `created_at`                 timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,

CONSTRAINT `token_constraint` UNIQUE (`contract_address`,`network`),
PRIMARY KEY (`id`),
KEY `FK_TWR_ID` (`token_whitelist_request_id`),
CONSTRAINT `REF_TWR_ID` FOREIGN KEY `FK_TWR_ID` (`token_whitelist_request_id`) REFERENCES `token_whitelist_requests` (`id`)
);


CREATE TABLE `token_rules`
(
 `id`                   binary(16) NOT NULL ,
 `token_id`             binary(16) NOT NULL ,
 `space_id`             binary(16) NOT NULL ,
 `token_group_user_id`  binary(16) NOT NULL ,
 `space_admin_id`       binary(16) NOT NULL ,
 `token_rule_name`      varchar(1024) NOT NULL ,
 `rule`                 json NOT NULL ,
 `updated_at`           timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,
 `created_at`           timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ,

PRIMARY KEY (`id`),
KEY `FK_TID` (`token_id`),
CONSTRAINT `REF_TID` FOREIGN KEY `FK_TID` (`token_id`) REFERENCES `tokens` (`id`)
);

-- SEED:
-- INSERT INTO user_type ('id', 'name', 'description') VALUES ('00000000000000000000000000000008', 'TokenRuleGroup', 'Token gated access user group based on token rule.');