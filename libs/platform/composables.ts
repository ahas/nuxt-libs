import type { Ref } from "vue";
import { IN_BROWSER, IN_SERVER } from "../shared/global";
import { getPlatform, type Platform } from "./platform";
import { useRequestHeaders } from "nuxt/dist/app/composables";

export function usePlatform(): Ref<Platform> {
  let ua: string | undefined = undefined;

  if (IN_SERVER) {
    ua = useRequestHeaders()["user-agent"];
  }

  const platform = ref(getPlatform(ua));

  if (IN_BROWSER) {
    watch(
      () => window.navigator.userAgent,
      (newVal) => {
        platform.value = getPlatform(newVal);
      }
    );
  }

  return platform;
}
