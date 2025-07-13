import { redis_raw } from "./cache.ts";

export const locationToCoordinates = async (
  location: string,
): Promise<{ lat: number; lng: number; name: string } | undefined> => {
  const res = await requestAddressToCoordinates(location);
  console.log(res);
  if (!res || res.length === 0) {
    return;
  }
  const { geometry, formatted_address: name } = res[0];
  return { ...geometry.location, name };
};

const requestAddressToCoordinates = async (
  address: string,
): Promise<
  {
    geometry: { location: { lat: number; lng: number } };
    formatted_address: string;
  }[]
> => {
  const cached = await redis_raw.get(`geocode:${address}`);
  if (cached) {
    console.log(`Cache hit for address: ${address}`);
    return JSON.parse(cached);
  }
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("region", "au");
  url.searchParams.set("components", "country:AU");
  url.searchParams.set("limit", "1");
  url.searchParams.set("address", address);
  url.searchParams.set("key", Deno.env.get("GOOGLE_API_KEY") || "");
  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(
        `Error fetching coordinates for address ${address}: ${res.statusText}`,
      );
      return [];
    }
    const result = (await res.json()).results;
    await redis_raw.set(`geocode:${address}`, JSON.stringify(result));
    // if(result)
    return result;
  } catch (e) {
    console.error(e);
    return [];
  }
};
