# Backend change required: existing customer -> provider

The frontend now calls `POST /api/provider-profiles/me` when an authenticated customer completes the "Become a provider" form.

## 1. Create provider profile for the signed-in user

**Endpoint**

`POST /api/provider-profiles/me`

**Authentication**

Required. Do not accept a `userId` from the browser; derive the user from the JWT/current authenticated principal.

**Request body**

```json
{
  "idNumber": "8001015009087",
  "bio": "Experienced plumber serving Durban North.",
  "location": "Durban North",
  "serviceRadiusKm": 20,
  "availableToday": true
}
```

**Behaviour**

- Look up the currently authenticated `users` row.
- If that user already has a `provider_profile`, return HTTP `409 Conflict`.
- Validate `idNumber` server-side with CheckID before creating the provider profile. Do not rely on the browser-only 13-digit check.
- If CheckID rejects the ID, return HTTP `400 Bad Request` and do not create a provider profile.
- Otherwise create one with `provider_profile.user_id = currentUser.id`.
- Recommended defaults: `rating = 0`, `review_count = 0`.
- Save `bio`, `location`, `service_radius_km`, and `available_today` from the request.
- If you track validation on the provider profile, set `id_validated = true` after CheckID succeeds. The frontend does not need the raw ID returned in the response.
- Return the created provider-profile DTO.

No schema migration is required for this relationship because `provider_profile.user_id` already references `users.id` and is unique.

## 2. Make `/api/users/me` report the upgraded account as a provider

After the profile is created, the frontend immediately calls `GET /api/users/me` again. Its response must return `isProvider: true` when a `provider_profile` exists for that user.

If `isProvider` is already calculated from `provider_profile`, no change is needed here.

If provider/customer role is stored inside the JWT itself, either issue a refreshed JWT after conversion or change provider authorization to derive provider status from the database. Otherwise the user may have to log out and back in before provider-only endpoints work.

## 3. Store years of experience when adding a service

The existing frontend call remains:

`PUT /api/provider-profiles/me/services`

The new form sends:

```json
{
  "serviceId": 1,
  "yearsExperience": 5,
  "minPrice": 300,
  "maxPrice": 800
}
```

Add `yearsExperience` to the request DTO if it is not already present and persist it to `provider_service.years_experience`.

The endpoint should derive the provider profile from the authenticated user rather than accepting a provider-profile ID from the client.
