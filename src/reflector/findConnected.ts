import { ValidatorSpace } from './interfaces';

export function findConnected(kusamaId: string, all: ValidatorSpace[], taken: ValidatorSpace[]) {
  // console.log('ID=' + kusamaId);
  let isTaken = false;

  for (const node of taken) {
    if (node.kusamaId === kusamaId) {
      isTaken = true;
      break;
    }
  }

  if (isTaken) {
    return;
  }

  const current = all.find((el) => {
    return el.kusamaId === kusamaId;
  });

  if (!current) {
    // console.log(`Can not find space for this Kusama Account ID: ${kusamaId}`);
    return;
  }

  taken.push(current);

  for (const node of all) {
    if (node.kusamaParentId === current.kusamaId) {
      findConnected(node.kusamaId, all, taken);
    }
  }

  if (current.kusamaParentId && current.kusamaParentId !== 'f'.repeat(47)) {
    findConnected(current.kusamaParentId, all, taken);
  }
}
