const sql = `
    SELECT CASE WHEN ISNULL(MAX(user_attrs.flag)) THEN 0 ELSE 1 END AS isFavorited,
           spaces.id                                                as rawId,
           BIN_TO_UUID(spaces.id)                                   as id,
           BIN_TO_UUID(spaces.uiTypeId)                             as uiTypeId,
           BIN_TO_UUID(spaces.ownedById)                            as ownedById,
           BIN_TO_UUID(spaces.parentId)                             as parentId,
           BIN_TO_UUID(spaces.spaceTypeId)                          as spaceTypeId,
           spaces.name                                              as name,
           spaces.allowed_subspaces,
           spaces.asset_parameters,
           spaces.child_placement,
           spaces.created_at,
           spaces.updated_at,
           spaces.visible,
           spaces.name_hash,
           spaces.mpath,
           spaces.asset_parameters,
           spaces.parameters2D,
           spaces.updated_at,
           spaces.created_at,
           spaces.parameters3D,
           spaces.allowed_subspaces,
           spaces.secret,
           spaces.visible,
           spaces.child_placement,
           spaces.minimap,
           spaces.frame_templates,
           spaces.metadata,
           CASE operatorSpace.visible
               WHEN 1 THEN BIN_TO_UUID(operatorSpace.id)
               ELSE NULL
               END                                                  AS 'operatorSpaceId'
    FROM spaces
             LEFT JOIN spaces operatorSpace ON operatorSpace.id = spaces.parentId
             LEFT JOIN spaces operatorNodes ON operatorNodes.parentId = operatorSpace.id
             LEFT JOIN user_space_attributes user_attrs ON user_attrs.spaceId = spaces.id
        AND user_attrs.userId = X'a29dfd716a7a4135a8d08db409086889'
             LEFT JOIN attributes attrs ON attrs.id = user_attrs.attributeId
        AND attrs.name = 'favorite'
    WHERE true
      AND JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_id") IS NOT NULL

      AND user_attrs.flag IS NOT NULL


    GROUP BY rawId
    ORDER BY ISNULL(user_attrs.spaceId) ASC,
             operatorSpace.visible DESC,
             CAST(
                     JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.commission")
                 AS DECIMAL(2, 2)
                 ) ASC,
             CAST(
                     JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.ownStake")
                 AS UNSIGNED
                 ) DESC,
             COUNT(operatorNodes.id) ASC,
             ISNULL(
                     JSON_EXTRACT(spaces.metadata, "$.kusama_metadata.validator_info.identity.parent")
                 ) ASC,
             spaces.name DESC;
`;

async function main() {
  const mysql = require('mysql2');

  // create the connection to database
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'momentum3a',

    port: 3301,
    password: 'BdBffHZB',
  });

  connection.query(sql, function (err, results, fields) {
    console.log(results); // results contains rows returned by server
    console.log(fields); // fields contains extra meta data about results, if available
  });
}

main();
