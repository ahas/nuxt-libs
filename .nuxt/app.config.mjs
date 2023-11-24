
import { updateAppConfig } from '#app/config'
import { defuFn } from 'defu'

const inlineConfig = {
  "nuxt": {
<<<<<<< HEAD
    "buildId": "f150f325-5889-4a2d-bb62-b32925c08956"
=======
    "buildId": "dev"
>>>>>>> 1eb3094 (feat(shortcut): Support cross-platform)
  }
}

// Vite - webpack is handled directly in #app/config
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    updateAppConfig(newModule.default)
  })
}



export default /* #__PURE__ */ defuFn(inlineConfig)
