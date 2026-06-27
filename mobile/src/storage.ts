export const PICKUP_ADDRESS_KEY = "swachh_ratham_pickup_address";
export const PICKUP_ADDRESS_HISTORY_KEY = "swachh_ratham_pickup_address_history";

export function uniqueAddressHistory(addresses: string[]) {
  // Keep a short, de-duplicated list of recent pickup addresses for faster
  // citizen pickup requests.
  const seen = new Set<string>();
  return addresses
    .map((address) => address.trim())
    .filter(Boolean)
    .filter((address) => {
      const key = address.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}
