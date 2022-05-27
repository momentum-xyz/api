import { v4 as uuidv4 } from 'uuid';
import { stringify as uuidStringify } from 'uuid';

export function uuidToBytes(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

export function bytesToUuid(uuid: Buffer): string {
  return uuidStringify(uuid);
}

export function generateUuid(): Buffer {
  return Buffer.from(uuidv4().replace(/-/g, ''), 'hex');
}

export function ethToBytes(eth: string): Buffer {
  return Buffer.from(eth.replace('0x', ''), 'hex');
}

export function bytesToEth(eth: Buffer): string {
  return '0x' + eth.toString('hex');
}
