import { KappaSigmaMu } from '../KappaSigmaMu';

const oldArr = ['a', 'b', 'c'];
const newArr = ['a', 'N1', 'N2'];

const { created, removed } = KappaSigmaMu.getDiff(newArr, oldArr);

console.log(created);
console.log(removed);
