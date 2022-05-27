import { ValidatorSpace } from '../interfaces';

export function findOperatorName(nodes: ValidatorSpace[]): string {
  const self = {};
  const parent = {};

  for (const node of nodes) {
    const arr = node.name.split('/');

    let selfName = null;
    let parentName = null;

    if (arr.length === 1) {
      selfName = arr[0];
    }
    if (arr.length === 2) {
      selfName = arr[1];
      parentName = arr[0];
    }
    if (arr.length > 2) {
      parentName = arr.shift();
      selfName = arr.join('/');
    }

    if (selfName) {
      if (!self[selfName]) {
        self[selfName] = 0;
      }
      self[selfName]++;
    }

    if (parentName) {
      if (!parent[parentName]) {
        parent[parentName] = 0;
      }
      parent[parentName]++;
    }
  }

  // console.log(parent);
  // console.log(self);
  const { key: name1, value: value1 } = getMaxKey(parent);
  const { key: name2, value: value2 } = getMaxKey(self);

  // console.log(name1, value1, name2, value2);
  if (value1 > 0 && name1) {
    return name1.trim();
  }

  return name2.trim();
}

function getMaxKey(map: Record<string, number>): { key: string; value: number } {
  let value = 0;
  let key = null;

  for (const k in map) {
    if (map[k] > value) {
      value = map[k];
      key = k;
    }
  }

  return { key, value };
}
