// Thin wrapper so tests can mock UUID generation
export const crypto = {
  randomUUID: () => globalThis.crypto.randomUUID(),
}
