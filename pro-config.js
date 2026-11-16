/* Public build configuration only. Secret RevenueCat keys belong on the server. */
window.TableRecProConfig = Object.freeze({
  showEntry: false,
  purchasesEnabled: false,
  entitlement: 'tablerec_pro',
  offering: 'tablerec_pro',
  iosPublicKey: '',
  androidPublicKey: '',
  features: Object.freeze({recipeWheel: false, happyHour: false, reservations: false})
});
