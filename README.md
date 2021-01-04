# Bredit
Bredit is a webapp for recording and editing screen recordings with or without sound and video from a webcam.

Its goal is to provide an easy way to create screen captures in a small shareable file without having to download or install any third party software, or send any potentially private information to a server. Bredit is 100% client side and can be easily self hosted using any static site hosting solution such as netlify or github pages.

It uses [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/MediaRecorder) for video creation,
and [gif.js](https://jnordberg.github.io/gif.js/) for GIF rendering.

Bredit is hosted on my website [here](https://www.alexthings.co.uk/bredit/index.html?g)

## Running locally
```bash
npm i
npm run dev
```
Navigate to [localhost:5000](http://localhost:5000)

This project was created using the [SvelteJS starter Template](https://github.com/sveltejs/template).
