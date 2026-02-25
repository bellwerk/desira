export type ExperimentVariant = "a" | "b";

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getExperimentVariant(
  seed: string,
  experimentKey: string
): ExperimentVariant {
  const hash = hashSeed(`${experimentKey}:${seed}`);
  return hash % 2 === 0 ? "a" : "b";
}
