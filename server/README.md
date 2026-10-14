# Future photo-analysis integration

This release intentionally does not deploy or connect an AI backend. The app supports manual photo logs now. The following is the contract for a later implementation, not a claim of live AI analysis.

Configure an HTTPS endpoint under Profile → Settings → Photo intelligence → Advanced. A backend access token may be kept in sessionStorage for the current session. Never enter a provider API key in the app. Connection tokens are excluded from backups.

## Request

`POST /analyze` with `Content-Type: application/json` and, if configured, `Authorization: Bearer <service-access-token>`:

```json
{
  "image": "data:image/jpeg;base64,...",
  "description": "Two rotis, dal, and a teaspoon of ghee"
}
```

The client resizes images to at most 1280 pixels per side and strips original metadata by drawing to a canvas. Only the selected photo and description are sent, after the user taps Estimate macros. The profile, body measurements, diary and activities are not sent.

## Response

```json
{
  "items": [
    { "name": "Roti", "unit": "2 medium rotis", "cal": 220, "protein": 7, "carbs": 44, "fat": 2 }
  ],
  "notes": "Portions and cooking oil are estimated. Review before saving."
}
```

Return nutrition for the whole described portion, not per 100 g. `items` must contain 1–20 foods. All nutrition fields must be finite, nonnegative numbers. An empty list means no food could be identified. The user reviews and edits every item before saving. The client times out after 45 seconds, handles non-2xx responses and refuses invalid estimates.

## Backend requirements for the next iteration

- Store the OpenAI API key only in server-side secret storage. Use an image-capable model and the Responses API with strict structured output matching this contract.
- Authenticate requests, enforce per-user limits and request body limits, validate image signatures and inputs, and use a fixed upstream API URL.
- Allow CORS only for `https://arush-barure.github.io` (and explicitly approved preview origins); CORS is not authentication.
- Do not log photos, bearer tokens or provider keys. Set `Cache-Control: no-store` and avoid retaining uploaded images.
- Treat any text in images/descriptions as user data, not system instructions. Make hidden ingredients, portion uncertainty and non-food images explicit.
- Verify with real photos and provider failures before marking the feature connected in the UI.

Official references: [image inputs](https://developers.openai.com/api/docs/guides/images-vision), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
