# Միլիոնատեր Quiz

Հայերեն, mobile-first browser quiz game with PWA offline caching.

## Run locally

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173/` or `http://[::1]:4173/`.

Service workers work on `localhost` or HTTPS. Opening `index.html` directly will play the game, but will not test offline caching.

## Edit questions

Questions live in `questions.js`:

```js
{
  level: 1,
  category: "Հայաստան",
  prompt: "Ո՞րն է Հայաստանի մայրաքաղաքը",
  answers: ["Գյումրի", "Երևան", "Վանաձոր", "Կապան"],
  correctIndex: 1,
  explanation: "Երևանը Հայաստանի մայրաքաղաքն է։"
}
```

Use levels `1` through `15`. The game randomly selects one question per level each round.
When deploying updated questions or UI, bump `CACHE_NAME` in `service-worker.js` so returning players receive the new files.

## MVP Included

- Armenian splash and onboarding
- Home hub with XP, coins, streak, and play CTA
- Classic 15-question ladder mode
- Answer confirmation bar
- Correct and wrong answer states with explanation
- 50:50 and audience lifelines
- Prize ladder modal
- Pause/settings modal
- Local progress storage
- Offline PWA cache
- Optional Firebase Analytics via `analytics-config.js`

## Analytics

Analytics is disabled by default. To enable Firebase Analytics, paste your Firebase Web App config into `analytics-config.js` and set `enabled: true`.

The app tracks anonymous gameplay events only: app/session start, game start, question shown, answer result, lifeline use, settings changes, and game finish.

## Future Play Store path

The project is already PWA-ready with `manifest.json` and `service-worker.js`. For Google Play, wrap it with Capacitor or a Trusted Web Activity, generate PNG launcher icons, and publish the wrapped Android project.
