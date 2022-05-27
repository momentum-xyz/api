import { u8aToHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

const address = '0xeea2f3ddf9e608ba57df3fdf413e9b66943b906183541bbfb3eaaedd49b02355';
console.log(encodeAddress(address)); // 5HTbfH2vBdNbrFpDtLMQ6cuRcs3z7kfdk73wPfwnie1ZETD4

const wallet = '5HTbfH2vBdNbrFpDtLMQ6cuRcs3z7kfdk73wPfwnie1ZETD4';
console.log(u8aToHex(decodeAddress(wallet))); // 0xeea2f3ddf9e608ba57df3fdf413e9b66943b906183541bbfb3eaaedd49b02355

const andrey_address = '0xb48945891f9db963fedc4d5fe13c954bb58b0b7dc0e6f24a5612a960fbf08315';
console.log(encodeAddress(andrey_address));

const userId = 'd0161ca2-06e7-4485-8642-9b4d61fb1e2f';

console.log('---');
console.log(encodeAddress('0x98C434AA30B542FD4D40B9210CCD14A356BFF5876764142C9EDEFAA6535D5371'));
