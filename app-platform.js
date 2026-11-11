/* Shared location bridge. Native builds use OS permissions, never WebView prompts. */
(function (root) {
  const browserGeo = root.navigator.geolocation;
  const native = !!root.Capacitor?.isNativePlatform?.();
  let plugin;
  function nativeGeo() {
    if (!plugin) {
      const cap = root.Capacitor;
      if (!cap?.isPluginAvailable?.('Geolocation')) throw new Error('Location needs the latest TableRec build. Choose a city for now.');
      plugin = {
        checkPermissions: () => cap.nativePromise('Geolocation', 'checkPermissions', {}),
        getCurrentPosition: options => cap.nativePromise('Geolocation', 'getCurrentPosition', options || {}),
        watchPosition: (options, callback) => Promise.resolve(cap.nativeCallback('Geolocation', 'watchPosition', options || {}, callback)),
        clearWatch: options => cap.nativePromise('Geolocation', 'clearWatch', options)
      };
    }
    return plugin;
  }
  function locationError(error) {
    const code = String(error?.code || '');
    return { code: code === 'OS-PLUG-GLOC-0003' ? 1 : /0010|0011/.test(code) ? 3 : 2,
      message: error?.message || 'Location is unavailable.' };
  }
  const watches = new Map();
  let nextWatch = 0;
  root.tableRecGeo = {
    get available() { return native || !!browserGeo; },
    async permission() {
      try {
        if (native) {
          const state = await nativeGeo().checkPermissions();
          return state.location === 'granted' || state.coarseLocation === 'granted' ? 'granted' : state.location;
        }
        return (await root.navigator.permissions?.query({ name: 'geolocation' }))?.state || 'unknown';
      } catch { return 'unknown'; }
    },
    getCurrentPosition(success, failure, options) {
      if (!native) {
        if (!browserGeo) return failure?.({code: 2, message: 'Location is unavailable.'});
        return browserGeo.getCurrentPosition(success, failure, options);
      }
      try { nativeGeo().getCurrentPosition(options).then(success, error => failure?.(locationError(error))); }
      catch (error) { failure?.(locationError(error)); }
    },
    watchPosition(success, failure, options) {
      if (!native) return browserGeo?.watchPosition(success, failure, options);
      const token = ++nextWatch;
      const record = { cancelled: false, id: null };
      watches.set(token, record);
      try {
        nativeGeo().watchPosition(options, (position, error) => {
          if (record.cancelled) return;
          if (error) failure?.(locationError(error));
          else if (position) success(position);
        }).then(id => {
          record.id = id;
          if (record.cancelled) return nativeGeo().clearWatch({id});
        }).catch(error => { watches.delete(token); if (!record.cancelled) failure?.(locationError(error)); });
      } catch (error) { watches.delete(token); failure?.(locationError(error)); }
      return token;
    },
    clearWatch(token) {
      if (!native) return browserGeo?.clearWatch(token);
      const record = watches.get(token);
      if (!record) return;
      record.cancelled = true;
      watches.delete(token);
      if (record.id) nativeGeo().clearWatch({id: record.id}).catch(() => {});
    }
  };
})(window);
