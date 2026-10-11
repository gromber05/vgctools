import { ITEM_NAMES, SPECIES_NAMES } from '@/lib/champions/data';

export function DataLists() {
  return (
    <>
      <datalist id="dl-species">
        {SPECIES_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="dl-items">
        {ITEM_NAMES.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
    </>
  );
}
