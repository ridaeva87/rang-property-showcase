export type AdminPremiseOption = {
  id: string;
  name?: string | null;
  title?: string | null;
  address: string;
  objectId?: string | null;
};

export function formatPremiseGroupAddress(address: string) {
  return address
    .replace(/^г\.\s*Казань,\s*/i, "")
    .replace(/^Казань,\s*/i, "")
    .replace(/^ул\.\s*/i, "")
    .replace(/,\s*д\.\s*/i, ", ")
    .replace(/,\s*корпус\s*/i, " корп. ")
    .replace(/,\s*корп\.\s*/i, " корп. ");
}

export function groupPremisesByAddress<T extends AdminPremiseOption>(premises: T[]) {
  const groups = new Map<string, { address: string; premises: T[] }>();
  for (const premise of premises) {
    const key = premise.objectId || premise.address;
    const group = groups.get(key) || { address: formatPremiseGroupAddress(premise.address), premises: [] };
    group.premises.push(premise);
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((a, b) => a.address.localeCompare(b.address, "ru"))
    .map((group) => ({
      ...group,
      premises: group.premises.sort((a, b) =>
        (a.name || a.title || "").localeCompare(b.name || b.title || "", "ru", { numeric: true }),
      ),
    }));
}

export function GroupedPremiseOptions({ premises }: { premises: AdminPremiseOption[] }) {
  return groupPremisesByAddress(premises).map((group) => (
    <optgroup key={group.address} label={group.address}>
      {group.premises.map((premise) => (
        <option key={premise.id} value={premise.id}>
          {premise.name || premise.title}
        </option>
      ))}
    </optgroup>
  ));
}
