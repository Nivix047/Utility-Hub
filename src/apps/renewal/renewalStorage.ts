import { parseRecords, type RenewalRecord } from './producerRecords';
export const storageKey = 'utility-hub:producer-renewals:v1';
export function loadRecords(local: Pick<Storage,'getItem'>, session: Pick<Storage,'getItem'>): RenewalRecord[] {
  const saved = local.getItem(storageKey);
  // A saved empty list is authoritative: do not resurrect old tab data after clearing.
  return parseRecords(saved !== null ? saved : session.getItem(storageKey));
}
export function persistRecords(records: RenewalRecord[], local: Pick<Storage,'setItem'>, session: Pick<Storage,'removeItem'>) {
  local.setItem(storageKey, JSON.stringify(records));
  // Only discard the previous tab copy after the persistent write succeeds.
  session.removeItem(storageKey);
}
