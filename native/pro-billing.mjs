import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
let identity=null, configured=false, queue=Promise.resolve();
function serial(work){const result=queue.then(work);queue=result.catch(()=>{});return result;}
async function identify(userId){
  if(!Capacitor.isNativePlatform()||!userId)throw Error('Open the installed app and sign in.');
  const config=window.TableRecProConfig;
  const key=Capacitor.getPlatform()==='ios'?config.iosPublicKey:config.androidPublicKey;
  if(!key)throw Error('Store setup is not ready yet.');
  if(!configured){await Purchases.configure({apiKey:key,appUserID:userId});configured=true;}
  else if(identity!==userId)await Purchases.logIn({appUserID:userId});
  identity=userId;
}
window.TableRecBilling={
  offerings:userId=>serial(async()=>{await identify(userId);return Purchases.getOfferings();}),
  purchase:(userId,aPackage)=>serial(async()=>{await identify(userId);return Purchases.purchasePackage({aPackage});}),
  restore:userId=>serial(async()=>{await identify(userId);return Purchases.restorePurchases();}),
  reset:()=>serial(async()=>{if(configured&&identity)await Purchases.logOut();identity=null;})
};
