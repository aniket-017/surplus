/**
 * Backfill product.location latitude/longitude so listings can be shown on the map.
 * Pass 1: copy the seller's profile address coordinates.
 * Pass 2: geocode "pincode, city, state" via Google (requires GOOGLE_MAPS_API_KEY).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY?.trim();

function hasCoordinates(location) {
  return (
    typeof location?.latitude === "number" &&
    typeof location?.longitude === "number"
  );
}

async function geocode(location) {
  const query = [location.pincode, location.city, location.state, "India"]
    .filter(Boolean)
    .join(", ");
  const url =
    "https://maps.googleapis.com/maps/api/geocode/json?" +
    `address=${encodeURIComponent(query)}` +
    "&components=country:IN" +
    `&key=${GOOGLE_MAPS_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  const point = data.results?.[0]?.geometry?.location;

  if (data.status !== "OK" || typeof point?.lat !== "number" || typeof point?.lng !== "number") {
    console.warn(`  geocode failed for "${query}": ${data.status} ${data.error_message || ""}`);
    return null;
  }

  return { latitude: point.lat, longitude: point.lng };
}

async function setCoordinates(product, coords) {
  await prisma.product.update({
    where: { id: product.id },
    data: {
      location: {
        address: product.location.address ?? null,
        city: product.location.city,
        state: product.location.state,
        pincode: product.location.pincode,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    },
  });
}

const products = await prisma.product.findMany({
  select: {
    id: true,
    title: true,
    location: true,
    seller: { select: { address: true } },
  },
});

const missing = products.filter((product) => !hasCoordinates(product.location));
console.log(`Products: ${products.length}, missing coordinates: ${missing.length}`);

let fromSeller = 0;
const stillMissing = [];

for (const product of missing) {
  const address = product.seller?.address;
  if (hasCoordinates(address) && String(address.pincode || "").trim() === product.location.pincode) {
    await setCoordinates(product, address);
    fromSeller += 1;
  } else {
    stillMissing.push(product);
  }
}

console.log(`Pass 1 (seller address): updated ${fromSeller}`);

let fromGeocode = 0;

if (!stillMissing.length) {
  console.log("Pass 2 skipped: nothing left to geocode");
} else if (!GOOGLE_MAPS_API_KEY) {
  console.log(`Pass 2 skipped: set GOOGLE_MAPS_API_KEY to geocode ${stillMissing.length} remaining`);
} else {
  const cache = new Map();

  for (const product of stillMissing) {
    const key = `${product.location.pincode}|${product.location.city}|${product.location.state}`.toLowerCase();
    if (!cache.has(key)) {
      cache.set(key, await geocode(product.location));
    }

    const coords = cache.get(key);
    if (coords) {
      await setCoordinates(product, coords);
      fromGeocode += 1;
    } else {
      console.log(`  - no coordinates for "${product.title}" (${product.id})`);
    }
  }

  console.log(`Pass 2 (geocode): updated ${fromGeocode} using ${cache.size} lookups`);
}

console.log(`Done. Remaining without coordinates: ${stillMissing.length - fromGeocode}`);

await prisma.$disconnect();
