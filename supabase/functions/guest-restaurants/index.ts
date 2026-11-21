import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { guestCaller, guestBudget } from "../_shared/guest-access.ts";

const ALLOWED_WEB_ORIGIN = "https://ryanantjohnson.github.io";
const ALLOWED_ORIGINS = new Set(["https://tablerec.co", "https://www.tablerec.co", ALLOWED_WEB_ORIGIN, "capacitor://localhost", "http://localhost", "https://localhost"]);
const MAX_BODY_BYTES = 8192;
const MAX_QUERY_LENGTH = 120;
const RATE_LIMIT_PER_MINUTE = 10;
const RATE_WINDOW_SECONDS = 60;
const MAX_NEARBY_SEARCH_POINTS = 5;
const GOOGLE_TIMEOUT_MS = 10000;

function makeCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };

  if (!origin || ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin || ALLOWED_WEB_ORIGIN;
  }

  return headers;
}

function jsonResponse(
  body: unknown,
  status: number,
  corsHeaders: Record<string, string>,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function roundCoord(value: number) {
  return Math.round(value * 1000) / 1000;
}

const toRad = (value: number) => value * Math.PI / 180;
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(a));
}

function nearbySearchPoints(latitude: number, longitude: number, radiusMeters: number) {
  const points = [{ latitude, longitude, radiusMeters: Math.min(radiusMeters, 10000) }];
  if (radiusMeters <= 6500) return points;

  // Four offset searches dramatically improve dense-area coverage while keeping
  // Google request cost bounded. Each result is later clipped to the requested circle.
  const offsetMeters = Math.min(radiusMeters * 0.52, 7800);
  const latDelta = offsetMeters / 111320;
  const lngDelta = offsetMeters / (111320 * Math.max(0.2, Math.cos(toRad(latitude))));
  points.push(
    { latitude: latitude + latDelta, longitude, radiusMeters: Math.min(10000, radiusMeters) },
    { latitude: latitude - latDelta, longitude, radiusMeters: Math.min(10000, radiusMeters) },
    { latitude, longitude: longitude + lngDelta, radiusMeters: Math.min(10000, radiusMeters) },
    { latitude, longitude: longitude - lngDelta, radiusMeters: Math.min(10000, radiusMeters) },
  );
  return points.slice(0, MAX_NEARBY_SEARCH_POINTS);
}

const FOOD_PLACE_TYPES = new Set([
  "restaurant",
  "bagel_shop",
  "bakery",
  "cafe",
  "coffee_shop",
  "coffee_stand",
  "acai_shop",
  "juice_shop",
  "tea_house",
  "sandwich_shop",
  "deli",
  "dessert_shop",
  "donut_shop",
  "ice_cream_shop",
  "food_court",
  "cafeteria",
  "confectionery",
  "chocolate_shop",
  "candy_store",
  "cake_shop",
  "pastry_shop",
  "noodle_shop",
  "salad_shop",
  "snack_bar",
  "hot_dog_stand",
  "bistro",
  "diner",
  "cat_cafe",
  "dog_cafe",
  "bar",
  "bar_and_grill",
  "cocktail_bar",
  "lounge_bar",
  "sports_bar",
  "wine_bar",
  "pub",
  "irish_pub",
  "gastropub",
  "beer_garden",
  "brewpub",
  "brewery",
  "winery",
  "steak_house",
  "meal_takeaway",
  "meal_delivery",
  "pizza_delivery",
  "kebab_shop"
]);
const DISTRIBUTOR_PRIMARY_TYPES = new Set(["supplier", "manufacturer", "wholesaler", "warehouse", "distribution_center", "food_wholesaler", "beverage_distributor"]);
function isFoodPlace(place: any) {
  if (DISTRIBUTOR_PRIMARY_TYPES.has(String(place?.primaryType || ""))) return false;
  const types = [String(place?.primaryType || ""), ...(Array.isArray(place?.types) ? place.types : [])];
  return types.some((type: string) => FOOD_PLACE_TYPES.has(type) || type.endsWith("_restaurant"));
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = makeCorsHeaders(origin);

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey) {
      console.error("GOOGLE_PLACES_API_KEY is missing");
      return jsonResponse({ error: "Restaurant search is temporarily unavailable" }, 500, corsHeaders);
    }

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase server credentials are missing");
      return jsonResponse({ error: "Restaurant search is temporarily unavailable" }, 500, corsHeaders);
    }

    const userId = guestCaller(req);
    if (!userId) return jsonResponse({error:"Guest discovery is temporarily unavailable"},503,corsHeaders);

    const contentLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Request too large" }, 413, corsHeaders);
    }

    const rawBody = await req.text();

    if (rawBody.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Request too large" }, 413, corsHeaders);
    }

    let body: Record<string, unknown>;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400, corsHeaders);
    }

    const mode = String(body?.mode || "nearby").toLowerCase();

    if (!["nearby", "search", "autocomplete"].includes(mode)) {
      return jsonResponse({ error: "Invalid search mode" }, 400, corsHeaders);
    }

    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);

    const hasCoords =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    let query = "";
    let radiusMeters = 5000;

    if (mode === "search" || mode === "autocomplete") {
      query = String(body?.query || "").trim();

      if (query.length < 2) {
        return jsonResponse(
          { error: "Enter a restaurant name, city, or address" },
          400,
          corsHeaders,
        );
      }

      if (query.length > MAX_QUERY_LENGTH) {
        return jsonResponse(
          { error: `Search must be ${MAX_QUERY_LENGTH} characters or fewer` },
          400,
          corsHeaders,
        );
      }
    } else if (mode === "nearby") {
      if (!hasCoords) {
        return jsonResponse(
          { error: "Valid latitude and longitude are required" },
          400,
          corsHeaders,
        );
      }

      radiusMeters = Math.min(
        Math.max(Number(body?.radiusMeters ?? body?.radius) || 5000, 500),
        25000,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(8000)})},
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (!await guestBudget(supabase)) return jsonResponse({error:"Guest searches are busy. Please try again shortly."},429,corsHeaders,{"Retry-After":"60"});
    const callerHash = await sha256Hex(`tablescore:${userId}`);

    const { data: rateData, error: rateError } = await supabase.rpc(
      "consume_edge_rate_limit",
      {
        p_limiter: "guest-restaurants",
        p_caller_hash: callerHash,
        p_limit: RATE_LIMIT_PER_MINUTE,
        p_window_seconds: RATE_WINDOW_SECONDS,
      },
    );

    if (rateError) {
      console.error("Rate limit RPC error:", rateError.message);
      return jsonResponse(
        { error: "Restaurant search is temporarily unavailable" },
        500,
        corsHeaders,
      );
    }

    const rateRow = Array.isArray(rateData) ? rateData[0] : rateData;
    const allowed = Boolean(rateRow?.allowed);
    const remaining = Number(rateRow?.remaining ?? 0);
    const resetAt = rateRow?.reset_at ? String(rateRow.reset_at) : null;

    const rateHeaders: Record<string, string> = {
      "X-RateLimit-Limit": String(RATE_LIMIT_PER_MINUTE),
      "X-RateLimit-Remaining": String(Math.max(remaining, 0)),
    };

    if (resetAt) {
      rateHeaders["X-RateLimit-Reset"] = resetAt;
    }

    if (!allowed) {
      return jsonResponse(
        { error: "Too many restaurant searches. Please wait a moment and try again." },
        429,
        corsHeaders,
        {
          ...rateHeaders,
          "Retry-After": "60",
        },
      );
    }

    const normalizedCacheInput =
      (mode === "search" || mode === "autocomplete")
        ? JSON.stringify({
            mode,
            query: query.toLowerCase(),
            latitude: hasCoords ? roundCoord(latitude) : null,
            longitude: hasCoords ? roundCoord(longitude) : null,
          })
        : JSON.stringify({
            mode,
            latitude: roundCoord(latitude),
            longitude: roundCoord(longitude),
            radiusMeters: Math.round(radiusMeters / 250) * 250,
          });

    const cacheKey = await sha256Hex("nearby-v15-food-drink:"+normalizedCacheInput);

    const { data: cachedPayload, error: cacheReadError } = await supabase.rpc(
      "get_edge_cache",
      { p_cache_key: cacheKey },
    );

    if (cacheReadError) {
      console.error("Cache read error:", cacheReadError.message);
    } else if (cachedPayload) {
      return jsonResponse(
        {
          ...cachedPayload,
          cached: true,
        },
        200,
        corsHeaders,
        rateHeaders,
      );
    }

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.addressComponents",
      "places.location",
      "places.primaryType",
      "places.primaryTypeDisplayName",
      "places.types",
      "places.googleMapsUri",
    ].join(",");

    const getAddressPart = (components: any[], wanted: string[]) => {
      const match = (components || []).find((component: any) =>
        wanted.some((type) => (component.types || []).includes(type))
      );
      return match?.longText || match?.shortText || null;
    };

    const isRestaurantPlace = isFoodPlace;

    const mapRestaurant = (place: any) => {
      const components = place.addressComponents || [];
      return {
        google_place_id: place.id || null,
        name: place.displayName?.text || "Unnamed restaurant",
        address: place.formattedAddress || null,
        city: getAddressPart(components, ["locality","postal_town","sublocality","administrative_area_level_3"]),
        state_region: getAddressPart(components, ["administrative_area_level_1"]),
        postal_code: getAddressPart(components, ["postal_code"]),
        country: getAddressPart(components, ["country"]),
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
        primary_type: place.primaryType || null,
        primary_type_name: place.primaryTypeDisplayName?.text || null,
        types: Array.isArray(place.types) ? place.types : [],
        google_maps_url: place.googleMapsUri || null,
      };
    };

    let restaurants: any[] = [];
    let areas:any[]=[];
    let searchedPoints = 1;

    if (mode === "autocomplete") {
      const googleBody: Record<string, unknown> = { input: query };
      if (hasCoords) googleBody.locationBias = { circle: { center: { latitude, longitude }, radius: 30000 } };
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);
      try {
        const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          headers: {"Content-Type":"application/json","X-Goog-Api-Key":apiKey,"X-Goog-FieldMask":"suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types"},
          body: JSON.stringify(googleBody), signal: controller.signal,
        });
        const text = await response.text();
        if (!response.ok) { console.error("Google Autocomplete error:", response.status, text.slice(0,1000)); return jsonResponse({error:"Restaurant suggestions request failed",status:response.status},502,corsHeaders,rateHeaders); }
        let data:any; try { data=JSON.parse(text); } catch { return jsonResponse({error:"Restaurant suggestions returned an invalid response"},502,corsHeaders,rateHeaders); }
        restaurants=(Array.isArray(data?.suggestions)?data.suggestions:[]).map((s:any)=>{
          const p=s?.placePrediction; if(!p?.placeId || !isFoodPlace(p))return null;
          return {google_place_id:p.placeId,place_id:p.placeId,name:p?.structuredFormat?.mainText?.text||"Restaurant",address:p?.structuredFormat?.secondaryText?.text||null,primary_type:"restaurant",primary_type_name:"Restaurant",types:Array.isArray(p?.types)?p.types:[]};
        }).filter(Boolean).slice(0,7);
      } catch (error) { console.error("Google Autocomplete network error:", error); return jsonResponse({error:"Restaurant suggestions timed out. Please try again."},504,corsHeaders,rateHeaders); }
      finally { clearTimeout(timeoutId); }
      // City suggestions require a separate collection request; restaurant arrays remain compatible with older clients.
      const areaController=new AbortController(),areaTimeout=setTimeout(()=>areaController.abort(),GOOGLE_TIMEOUT_MS);
      try{
        const areaResponse=await fetch("https://places.googleapis.com/v1/places:autocomplete",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":apiKey,"X-Goog-FieldMask":"suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types"},body:JSON.stringify({input:query,includedPrimaryTypes:["(cities)"]}),signal:areaController.signal});
        if(areaResponse.ok){const data=await areaResponse.json();areas=(data.suggestions||[]).map((s:any)=>{const p=s.placePrediction;if(!p?.placeId)return null;return {kind:"area",google_place_id:p.placeId,name:p.structuredFormat?.mainText?.text||query,address:p.structuredFormat?.secondaryText?.text||"",types:p.types||[]};}).filter(Boolean).slice(0,2);}
      }catch{console.warn("City suggestions temporarily unavailable");}finally{clearTimeout(areaTimeout);}
    } else if (mode === "search") {
      const googleBody: Record<string, unknown> = {
        textQuery: query,
        maxResultCount: 20,
      };
      if (hasCoords) {
        googleBody.locationBias = { circle: { center: { latitude, longitude }, radius: 30000 } };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);
      try {
        const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {"Content-Type":"application/json","X-Goog-Api-Key":apiKey,"X-Goog-FieldMask":fieldMask},
          body: JSON.stringify(googleBody),
          signal: controller.signal,
        });
        const text = await response.text();
        if (!response.ok) {
          console.error("Google Places error:", response.status, text.slice(0,1000));
          return jsonResponse({error:"Restaurant search request failed",status:response.status},502,corsHeaders,rateHeaders);
        }
        let data:any; try { data=JSON.parse(text); } catch { return jsonResponse({error:"Restaurant search returned an invalid response"},502,corsHeaders,rateHeaders); }
        restaurants=(Array.isArray(data?.places)?data.places:[]).filter(isRestaurantPlace).map(mapRestaurant);
      } catch (error) {
        console.error("Google Places network error:", error);
        return jsonResponse({error:"Restaurant search timed out. Please try again."},504,corsHeaders,rateHeaders);
      } finally { clearTimeout(timeoutId); }
    } else {
      const points = nearbySearchPoints(latitude, longitude, radiusMeters);
      searchedPoints = points.length;
      const places = new Map<string, any>();

      const searchPoint = async (point: {latitude:number;longitude:number;radiusMeters:number}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);
        try {
          const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
            method:"POST",
            headers:{"Content-Type":"application/json","X-Goog-Api-Key":apiKey,"X-Goog-FieldMask":fieldMask},
            body:JSON.stringify({
              includedTypes:[...FOOD_PLACE_TYPES],
              maxResultCount:20,
              rankPreference:"DISTANCE",
              locationRestriction:{circle:{center:{latitude:point.latitude,longitude:point.longitude},radius:point.radiusMeters}},
            }),
            signal:controller.signal,
          });
          if(!response.ok){console.error("Google Nearby error:",response.status,(await response.text()).slice(0,1000));return;}
          const data=await response.json();
          for(const place of (Array.isArray(data?.places)?data.places:[])){
            if(place?.id && isRestaurantPlace(place)) places.set(place.id,place);
          }
        } catch(error){ console.error("Google Nearby request failed:",error); }
        finally { clearTimeout(timeoutId); }
      };

      // Five calls max, executed concurrently. Deduplicate by Google Place ID,
      // then enforce the original requested circle so offset searches cannot leak distant places.
      await Promise.all(points.map(searchPoint));
      restaurants=[...places.values()].map(mapRestaurant).filter((restaurant:any)=>{
        const lat=Number(restaurant.latitude), lng=Number(restaurant.longitude);
        return Number.isFinite(lat) && Number.isFinite(lng) &&
          distanceMeters(latitude,longitude,lat,lng) <= radiusMeters + 50;
      }).sort((a:any,b:any)=>
        distanceMeters(latitude,longitude,Number(a.latitude),Number(a.longitude)) -
        distanceMeters(latitude,longitude,Number(b.latitude),Number(b.longitude))
      );
    }

    const payload = {
      restaurants,
      areas,
      count: restaurants.length,
      mode,
      searched_points: searchedPoints,
    };

    const ttlSeconds = mode === "autocomplete" ? 120 : mode === "search" ? 300 : 180;

    const { error: cacheWriteError } = await supabase.rpc(
      "set_edge_cache",
      {
        p_cache_key: cacheKey,
        p_payload: payload,
        p_ttl_seconds: ttlSeconds,
      },
    );

    if (cacheWriteError) {
      console.error("Cache write error:", cacheWriteError.message);
    }

    return jsonResponse(
      {
        ...payload,
        cached: false,
      },
      200,
      corsHeaders,
      rateHeaders,
    );
  } catch (error) {
    console.error("nearby-restaurants error:", error);

    return jsonResponse(
      { error: "Unexpected server error" },
      500,
      corsHeaders,
    );
  }
});

