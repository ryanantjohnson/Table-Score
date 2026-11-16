// Pure server policy. Never import client profile fields or client receipt claims.
export function membership({userId,marks=[],subscriber=null,allowSandbox=false,purchasesEnabled=false,now=Date.now()}){
  if(marks.includes('first_round'))return {user_id:userId,active:true,source:'first_round',expires_at:null,purchases_enabled:false};
  const entitlement=subscriber?.entitlements?.tablerec_pro;
  const subscription=entitlement&&subscriber?.subscriptions?.[entitlement.product_identifier];
  const expires=entitlement?.expires_date;
  const expiry=expires===null?Infinity:Date.parse(expires||'');
  const grace=Date.parse(subscription?.grace_period_expires_date||'');
  const validDate=Number.isFinite(Date.parse(entitlement?.purchase_date||''));
  const sandbox=subscription?.is_sandbox===true;
  const active=!!(subscription&&validDate&&!subscription.refunded_at&&(allowSandbox||!sandbox)&&Math.max(expiry,Number.isFinite(grace)?grace:0)>now);
  return {user_id:userId,active,source:active?'subscription':'free',expires_at:active?(expiry===Infinity?null:new Date(Math.max(expiry,Number.isFinite(grace)?grace:0)).toISOString()):null,purchases_enabled:purchasesEnabled};
}
