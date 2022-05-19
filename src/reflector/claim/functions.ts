import { Queryable, ValidatorSpace } from '../interfaces';
import { getAllValidators, getKusamaConfig, getUiTypeId } from '../functions';
import { findConnected } from '../findConnected';
import { KusamaOperator } from '../KusamaOperator';
import { escape } from 'mysql';
import { u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

export async function unclaimSpace(conn: Queryable, wallet: string, kusamaOperator: KusamaOperator): Promise<void> {
  console.log('Unclaim Space ', wallet);
  // 1 *** Find all nodes which has this_wallet as kusama_id or kusama_parent_id: node0…nodeN

  const config = await getKusamaConfig(conn);
  const nodes = await getAllValidators(conn, config);

  console.log('Total validators in mysql', nodes.length);

  const anchors = getAnchorNodes(wallet, nodes);
  if (anchors.length === 0) {
    console.error('Can not find anchors in validator nodes for wallet = ' + wallet);
    return;
  }
  console.log('Total Anchors ---', anchors.length);

  // 2 *** for node in node build a cluster: cluster0…clusterN (list0…listN)
  const clusters: ValidatorSpace[][] = getClusters(anchors, nodes);

  // 3 *** merge list0…listN into single listFinal (concat)
  let operatorNodes: ValidatorSpace[] = clusters.flat(1);

  // console.log(operatorNodes);

  // 4 *** leave only nodes with unique kusama_id in listFinal
  // https://stackoverflow.com/a/58429784/356223
  operatorNodes = [...new Map(operatorNodes.map((item) => [item.kusamaId, item])).values()];

  console.log('Total operator nodes', operatorNodes.length);
  // console.log(operatorNodes.length);

  let parentSpaceIds: string[] = operatorNodes.map((item) => item.parentSpaceId);
  console.log('1 parentSpaceIds=');
  console.log(parentSpaceIds);

  parentSpaceIds = [...new Set(parentSpaceIds)];
  console.log('2 parentSpaceIds=');
  console.log(parentSpaceIds);
  parentSpaceIds = parentSpaceIds.filter((item) => item !== config.spaces.validator_cloud);
  parentSpaceIds = parentSpaceIds.filter((item) => item !== null);
  console.log('3 parentSpaceIds=');
  console.log(parentSpaceIds);

  console.log('Updating parent for validators. Count:' + operatorNodes.length);
  await updateParent(conn, config.spaces.validator_cloud, operatorNodes);

  console.log('Updating visible for validators with parent = cloud');
  const sql = `
      UPDATE spaces
          JOIN space_attributes sa
          ON spaces.id = sa.spaceId
              AND sa.attributeId =
                  UUID_TO_BIN(${escape(config.attributes.kusama_validator_is_active)})
      SET visible = CASE WHEN sa.flag = 2 THEN 1 ELSE 0 END
      WHERE spaces.spaceTypeId = UUID_TO_BIN(${escape(config.space_types.validator_node)})
        AND spaces.parentId = UUID_TO_BIN(${escape(config.spaces.validator_cloud)})
  `;

  await conn.query(sql);

  if (parentSpaceIds.length > 0) {
    const operatorSpaceId = parentSpaceIds[0];
    console.log('Deleting operator space with ID = ' + operatorSpaceId);
    const sql = `
        DELETE
        FROM spaces
        WHERE id = UUID_TO_BIN(${escape(operatorSpaceId)})
          AND spaceTypeId = UUID_TO_BIN(${escape(config.space_types.operator)})
    `;

    await conn.query(sql);
  } else {
    console.log('Operator spaceId not found');
  }

  await kusamaOperator.mqtt.publish(`updates/spaces/changed`, config.spaces.operator_cloud, false);
  console.log('MQTT updates/spaces/changed', config.spaces.operator_cloud);
  console.log('MQTT updates/spaces/changed', config.spaces.validator_cloud);
}

export async function claimSpace(conn: Queryable, wallet: string, kusamaOperator: KusamaOperator): Promise<void> {
  // 1 *** Find all nodes which has this_wallet as kusama_id or kusama_parent_id: node0…nodeN

  console.log('Claim Space ', wallet);
  const config = await getKusamaConfig(conn);
  const nodes = await getAllValidators(conn, config);

  console.log('Total validators in mysql', nodes.length);

  const anchors = getAnchorNodes(wallet, nodes);
  if (anchors.length === 0) {
    console.error('Can not find anchors in validator nodes for wallet = ' + wallet);
    return;
  }
  console.log('Total Anchors ---', anchors.length);

  // 2 *** for node in node build a cluster: cluster0…clusterN (list0…listN)
  const clusters: ValidatorSpace[][] = getClusters(anchors, nodes);

  // 3 *** merge list0…listN into single listFinal (concat)
  let operatorNodes: ValidatorSpace[] = clusters.flat(1);

  // console.log(operatorNodes);

  // 4 *** leave only nodes with unique kusama_id in listFinal
  // https://stackoverflow.com/a/58429784/356223
  operatorNodes = [...new Map(operatorNodes.map((item) => [item.kusamaId, item])).values()];

  console.log('Total operator nodes', operatorNodes.length);
  // console.log(operatorNodes.length);

  let parentSpaceIds: string[] = operatorNodes.map((item) => item.parentSpaceId);
  console.log('1 parentSpaceIds=');
  console.log(parentSpaceIds);

  parentSpaceIds = [...new Set(parentSpaceIds)];
  console.log('2 parentSpaceIds=');
  console.log(parentSpaceIds);
  parentSpaceIds = parentSpaceIds.filter((item) => item !== config.spaces.validator_cloud);
  parentSpaceIds = parentSpaceIds.filter((item) => item !== null);
  console.log('3 parentSpaceIds=');
  console.log(parentSpaceIds);

  let operatorSpaceId: string = null;

  if (parentSpaceIds.length === 0) {
    console.log('CASE 0');
    const uiTypeId = await getUiTypeId(conn);
    operatorSpaceId = await kusamaOperator.create_legacy(wallet, wallet, uiTypeId, config);
    console.log('Created operator space ID = ' + operatorSpaceId);
  } else if (parentSpaceIds.length === 1) {
    console.log('CASE 1');
    operatorSpaceId = parentSpaceIds[0];
    console.log('Take existed operator space ID = ' + operatorSpaceId);
  } else {
    console.log('CASE MANY');
    // TODO find oldest space
    // AND remove other spaces after update

    // TODO temporary hack
    operatorSpaceId = parentSpaceIds[0];
    console.log('Take existed operator space ID = ' + operatorSpaceId);
  }

  await updateParent(conn, operatorSpaceId, operatorNodes);
  await tryMakeAdmin(conn, wallet, operatorSpaceId);

  await kusamaOperator.mqtt.publish(`updates/spaces/changed`, config.spaces.operator_cloud, false);
  console.log('MQTT updates/spaces/changed', config.spaces.operator_cloud);
  console.log('MQTT updates/spaces/changed', config.spaces.validator_cloud);
}

export async function getParentSpaceIds_byWallet(wallet) {}

export async function tryMakeAdmin(conn: Queryable, wallet: string, operatorSpaceId: string) {
  const hexWallet = u8aToHex(decodeAddress(wallet)).toLowerCase();

  let sql = `SELECT BIN_TO_UUID(userId) as userId
             FROM user_wallets
             WHERE wallet = ${hexWallet}`;

  const rows = await conn.query(sql);
  if (rows.length === 0) {
    console.error(`User with wallet = ${wallet} not found in user_wallets table`);
    return;
  }

  const userId: string = rows[0].userId;

  sql = `
      INSERT INTO user_spaces (spaceId, userId, isAdmin)
      VALUES (UUID_TO_BIN(${escape(operatorSpaceId)}), UUID_TO_BIN(${escape(userId)}), 1)
      ON DUPLICATE KEY UPDATE isAdmin = 1
  `;

  await conn.query(sql);
}

async function updateParent(conn: Queryable, parentId: string, nodes: ValidatorSpace[]) {
  if (nodes.length === 0) {
    return;
  }

  const values: string[] = [];

  for (const node of nodes) {
    values.push(`UUID_TO_BIN(${escape(node.spaceId)})`);
  }

  const sql = `
      UPDATE spaces
      SET parentId = UUID_TO_BIN(${escape(parentId)}),
          visible  = 1
      WHERE id IN (${values.join(',\n')})
  `;

  await conn.query(sql);
}

function getAnchorNodes(wallet: string, nodes: ValidatorSpace[]) {
  const anchors: ValidatorSpace[] = [];

  // console.log(wallet);
  for (const node of nodes) {
    // console.log(node.kusamaId, node.kusamaParentId);
    if (node.kusamaId === wallet || node.kusamaParentId === wallet) {
      anchors.push(node);
    }
  }

  return anchors;
}

function getClusters(anchors: ValidatorSpace[], nodes: ValidatorSpace[]): ValidatorSpace[][] {
  const clusters: ValidatorSpace[][] = [];
  for (const anchor of anchors) {
    const taken: ValidatorSpace[] = [];
    findConnected(anchor.kusamaId, nodes, taken);
    console.log('=====', taken.length);
    clusters.push(taken);
    console.log('===!!!', clusters.length);
    //break;
  }

  return clusters;
}
