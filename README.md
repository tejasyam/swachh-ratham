# Swachh Ratham

Swachh Ratham is a functional mobile prototype for responsible household object disposal. Citizens upload unused objects, the app classifies them as reusable, repairable, recyclable, or disposable, admins assign pickups, drivers collect items, and citizens earn EcoPoints.

## Project Structure

```text
backend/
mobile/
README.md
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API base URL: `http://127.0.0.1:8000`

Interactive docs: `http://127.0.0.1:8000/docs`

SQLite is created automatically at `backend/swachh_ratham.db` on first startup.

## Mobile Setup

```bash
cd mobile
npm install
npm start
```

The mobile API URL is defined in `mobile/src/api.ts`.

Use `http://127.0.0.1:8000` for Expo web or iOS simulator. For Android emulator, change it to `http://10.0.2.2:8000`. For a physical phone, use your computer LAN IP, for example `http://192.168.1.20:8000`.

## Seed Logins

Admin:

```text
admin@swachhratham.com
admin123
```

Citizen:

```text
citizen@swachhratham.com
citizen123
```

Driver:

```text
driver@swachhratham.com
driver123
```

## Prototype Flow

1. Login as citizen.
2. Add an unused object with name, category, condition, description, address, and camera/gallery image.
3. The backend classifies the object using rule-based logic.
4. Request pickup for the classified object.
5. Login as admin and assign the request to driver ID `3`.
6. Login as driver and update the assigned pickup status to `Collected`.
7. The citizen receives 50 EcoPoints.
8. Admin analytics update automatically.

## Backend API

Authentication:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Objects:

- `POST /objects`
- `GET /objects`
- `GET /objects/{id}`
- `GET /users/{user_id}/objects`

Pickups:

- `POST /pickups/request`
- `GET /pickups`
- `GET /drivers/{driver_id}/pickups`
- `PUT /pickups/{pickup_id}/assign`
- `PUT /pickups/{pickup_id}/status`

Admin:

- `GET /admin/stats`

## Classification Rules

- Good condition furniture, books, clothes, toys: `Reusable`
- Broken electronics or appliances: `Repairable`
- Plastic, paper, metal, glass: `Recyclable`
- Severely damaged objects: `Disposable`

## Notes

This prototype stores Expo image URIs as `image_url` values rather than uploading binary files to object storage. That keeps the local demo simple while preserving the complete object upload and image picker flow.
