import { IN_BROWSER, IN_SERVER, SUPPORTS_TOUCH } from "../shared/global";

export interface Platform {
  // Desktop OS
  win: boolean;
  linux: boolean;
  mac: boolean;
  // Mobile OS
  android: boolean;
  ios: boolean;
  // Runtime Platforms
  cordova: boolean;
  electron: boolean;
  // Browsers
  chrome: boolean;
  edge: boolean;
  firefox: boolean;
  opera: boolean;
  // Environments
  macLike: boolean;
  touch: boolean;
  server: boolean;
}

export function createDefaultPlatform(platform?: Partial<Platform>): Platform {
  const defaults = {
    win: false,
    linux: false,
    mac: false,
    android: false,
    ios: false,
    cordova: false,
    electron: false,
    chrome: false,
    edge: false,
    firefox: false,
    opera: false,
    macLike: false,
    touch: SUPPORTS_TOUCH,
    server: !IN_BROWSER,
  };

  if (platform) {
    Object.assign(defaults, platform);
  }

  return defaults;
}

export function getPlatform(userAgent?: string): Platform {
  const ua = userAgent ?? IN_BROWSER ? window.navigator.userAgent : undefined;

  if (ua) {
    const mac = /mac/i.test(ua);
    const ios = /iphone|ipad|ipod/i.test(ua);

    return {
      mac,
      ios,
      win: /win/i.test(ua),
      linux: /linux/i.test(ua),
      android: /android/i.test(ua),
      cordova: /cordova/i.test(ua),
      electron: /electron/i.test(ua),
      chrome: /chrome/i.test(ua),
      edge: /edge/i.test(ua),
      firefox: /firefox/i.test(ua),
      opera: /opera/i.test(ua),
      macLike: mac || ios,
      touch: SUPPORTS_TOUCH,
      server: IN_SERVER,
    };
  }

  return createDefaultPlatform();
}
