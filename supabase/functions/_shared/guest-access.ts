// Guest discovery is read-only. Ignore unverified JWT subjects and client IDs.
// IP hashing limits ordinary abuse; a shared global budget also caps rotating/
// spoofed caller identifiers. No IP addresses are saved in restaurant records.
export function guestCaller(req: Request): string | null {
  const ip=(req.headers.get("x-forwarded-for")||req.headers.get("cf-connecting-ip")||"").split(",")[0].trim();
  return ip && ip.length<=128 ? "guest:"+ip : null;
}
export async function guestBudget(client: any): Promise<boolean> {
  const {data,error}=await client.rpc("consume_edge_rate_limit",{
    p_limiter:"guest-discovery-global",p_caller_hash:"all-guests",
    p_limit:60,p_window_seconds:60
  });
  return !error && (Array.isArray(data)?data[0]:data)?.allowed===true;
}

