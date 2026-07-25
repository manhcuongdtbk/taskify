import { createApi } from "unsplash-js";

// More usage info: https://github.com/unsplash/unsplash-js
// TODO: Apply for production. More info: https://unsplash.com/oauth/applications/1006103
export const unsplash = createApi({
  accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
});
