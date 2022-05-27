const s = '5,756,500,775,543,013,236';
console.log(s);
const s2 = replaceCommaSeparators(s);
console.log(s2);

const i = Number(s2.length);
console.log(i);
console.log(Number.MAX_VALUE);
console.log(Number.MAX_SAFE_INTEGER.toString().length);

const o = {
  totalStakeInEra: '5,756,500,775,543,013,236',
  lastEraReward: '733,475,567,982,798',
};

const totalStakeInEra = replaceCommaSeparators(o.totalStakeInEra);
const lastEraReward = replaceCommaSeparators(o.lastEraReward);

const totalStakeInEraReturn = (+lastEraReward / +totalStakeInEra) * 100;

console.log(totalStakeInEraReturn);

function replaceCommaSeparators(value: any): string {
  return value.toString().replace(/,/g, '');
}
