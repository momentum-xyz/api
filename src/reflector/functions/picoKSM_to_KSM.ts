export function picoKSM_to_microKSM(picoKSM: string): number {
  // pico = 10^-12
  // micro = 10^-6
  // https://en.wikipedia.org/wiki/Pico-
  // Number.MAX_SAFE_INTEGER length = 16

  if (picoKSM.length < 16) {
    return Math.round(parseInt(picoKSM) / 1_000_000);
  }

  // Cut off last 6 chars
  const str = picoKSM.slice(0, -6);
  return parseInt(str);
}

export function formatMicroKSM(microKSM: number): string {
  const KSM = microKSM / 1_000_000;
  return `${KSM.toPrecision(6)} KSM`;
}

// https://nodejs.org/api/modules.html#modules_accessing_the_main_module
//
if (require.main === module) {
  test();
}

function test() {
  const picoKSM = '54364264200013';
  const microKSM = picoKSM_to_microKSM(picoKSM);
  console.log(microKSM);
  console.log(formatMicroKSM(microKSM));
}
