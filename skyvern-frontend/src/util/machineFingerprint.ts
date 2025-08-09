/**
 * Return the fingerprint of the machine hosting the Skyvern UI.
 *
 * The value is injected at build time via the `VITE_SYSTEM_FINGERPRINT`
 * environment variable and should uniquely identify the host system.
 */
export function generateMachineId(): string {
  return import.meta.env.VITE_SYSTEM_FINGERPRINT ?? "unknown-machine";
}
