/** Valor deserializado desde el storage comprimido. Puede ser null si no existe. */
export type DeserializedStorageValue = {
  state: Record<string, unknown>
  version?: number
} | null
