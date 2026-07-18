export type BuyerLocationSource = 'gps' | 'manual' | 'profile';

export type BuyerLocation = {
  city: string;
  state: string;
  source: BuyerLocationSource;
};

export function formatBuyerLocation(location: BuyerLocation) {
  return location.state ? `${location.city}, ${location.state}` : location.city;
}
