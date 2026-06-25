# Swachh Ratham Project Workflow

## Project Goal

Swachh Ratham is a mobile-first waste collection and circular economy prototype. The goal is to let citizens upload unused household objects, classify them as reusable, repairable, recyclable, or disposable, request pickups, allow admins to assign drivers, and allow drivers to collect items while EcoPoints are awarded to citizens.

The system aims to support:

- Responsible disposal of household objects.
- Reuse, repair, and recycling before disposal.
- Pickup tracking across citizen, admin, and driver roles.
- Reward-based participation through EcoPoints.
- Location-based pickup selection using map pins.

## User Roles

### Citizen

- Register or log in.
- Add object details and images.
- Select pickup address using map pin.
- Request single or bulk pickup.
- Track object and pickup status.
- View EcoPoints and profile details.

### Admin

- View platform dashboard.
- Manage pickup requests.
- Assign drivers to single pickups.
- Assign one driver to all items in a bulk order.
- View analytics.
- View delivered orders.

### Driver

- View assigned pickups.
- Accept pickup.
- Open map directions from current location to pickup point.
- Update pickup status.
- Mark pickup as collected or delivered.

## Application Workflow

### 1. Account Creation Workflow

1. User opens the mobile app.
2. User creates account with email or phone number.
3. System sends OTP.
4. User enters OTP.
5. Backend verifies OTP.
6. User account becomes active.
7. User is logged in.

### 2. Login Workflow

1. User enters email or phone number.
2. User enters password.
3. Backend validates credentials.
4. Backend returns JWT token.
5. Mobile app stores token.
6. User is redirected to role-based dashboard.

### 3. Citizen Object Upload Workflow

1. Citizen opens Add Object page.
2. Citizen enters object name, quantity, category, condition, material, usability, damage level, and description.
3. Citizen uploads or captures image.
4. Citizen selects pickup location using map pin.
5. Backend classifies object using rule-based scoring.
6. Object is saved with classification, preferred action, reason, and confidence.
7. Citizen requests pickup.

### 4. Bulk Pickup Workflow

1. Citizen enables bulk pickup mode.
2. Citizen adds multiple objects to cart.
3. Citizen selects one pickup address for the whole cart.
4. Backend creates pickup requests for all cart objects.
5. Backend assigns a common `bulk_group_id`.
6. Admin sees the bulk order as one grouped request.
7. Admin assigns one driver to the whole bulk order.

### 5. Admin Assignment Workflow

1. Admin opens pickup management.
2. Admin views pending single pickups and grouped bulk orders.
3. Admin selects a pickup or bulk group.
4. Admin enters driver ID.
5. Backend validates driver.
6. Backend updates pickup status to `Assigned`.
7. Assigned pickup appears in driver dashboard.

### 6. Driver Collection Workflow

1. Driver logs in.
2. Driver opens Pickups tab.
3. Driver sees assigned pickups.
4. Driver opens pickup details.
5. Driver taps `Accepted`.
6. App requests location permission.
7. App opens Google Maps directions from driver location to pickup pin.
8. Driver updates status through pickup lifecycle.
9. When status becomes `Collected`, backend calculates EcoPoints.
10. Citizen receives EcoPoints.

## Pipelines

### Authentication Pipeline

```text
Mobile auth form
  -> Backend auth endpoint
  -> User lookup
  -> Password validation or OTP validation
  -> JWT generation
  -> Token saved in mobile AsyncStorage
  -> Role-based navigation
```

### Object Classification Pipeline

```text
Citizen object form
  -> Object metadata
  -> Rule-based classification engine
  -> Classification score comparison
  -> Classification result
  -> Preferred action
  -> Confidence score
  -> Save object
```

### Pickup Request Pipeline

```text
Citizen selects object
  -> Citizen selects pickup pin/address
  -> Backend creates pickup request
  -> Status: Pending
  -> Admin views request
  -> Admin assigns driver
  -> Status: Assigned
  -> Driver views request
```

### Bulk Pickup Pipeline

```text
Citizen adds objects to cart
  -> Citizen selects one pickup address
  -> Backend creates multiple pickup rows
  -> Backend assigns shared bulk_group_id
  -> Admin sees one grouped bulk order
  -> Admin assigns one driver to whole group
  -> Driver receives grouped assigned work
```

### EcoPoints Pipeline

```text
Driver marks pickup Collected
  -> Backend checks reward was not already given
  -> Backend calculates item-impact score
  -> EcoPoints added to citizen
  -> Pickup stores ecopoints_awarded
  -> Tracking log updated
```

EcoPoints formula:

```text
EcoPoints = item score x quantity x condition multiplier x action multiplier
```

## Folder Structure

```text
Swatch Ratham/
  README.md
  PROJECT_WORKFLOW.md
  backend/
    app/
      main.py
      database.py
      models.py
      schemas.py
      services.py
      auth.py
      routers/
        auth_routes.py
        object_routes.py
        pickup_routes.py
        driver_routes.py
        admin_routes.py
        user_routes.py
    requirements.txt
  mobile/
    App.tsx
    app.json
    package.json
    src/
      api.ts
      components.tsx
      LocationPicker.tsx
      storage.ts
      theme.ts
      types.ts
      context/
        AuthContext.tsx
      screens/
        LoginScreen.tsx
        RegisterScreen.tsx
        SplashScreen.tsx
        CitizenHomeScreen.tsx
        AddObjectScreen.tsx
        MyObjectsScreen.tsx
        ObjectDetailsScreen.tsx
        PickupRequestScreen.tsx
        AdminDashboardScreen.tsx
        PickupManagementScreen.tsx
        AnalyticsScreen.tsx
        DeliveredOrdersScreen.tsx
        DriverDashboardScreen.tsx
        AssignedPickupDetailsScreen.tsx
        ProfileScreen.tsx
```

## Work Breakdown Structure

### 1. Project Setup

- Create backend FastAPI project.
- Create Expo React Native mobile project.
- Configure API URL.
- Configure database connection.
- Set up basic folder structure.

### 2. Authentication Module

- Build registration.
- Build login.
- Add email or phone identifier support.
- Add OTP verification during registration.
- Store JWT token on mobile.
- Add role-based navigation.

### 3. Citizen Module

- Build citizen home page.
- Add object upload form.
- Add image picker and camera support.
- Add map-based pickup address selection.
- Add saved pickup address history.
- Add object list and details page.
- Add single and bulk pickup request flows.

### 4. Classification Module

- Add category, condition, material, usability, damage level, and hazard inputs.
- Implement rule-based scoring.
- Generate classification result.
- Generate confidence score.
- Generate preferred action and reason.

### 5. Admin Module

- Build admin dashboard.
- Build pickup management screen.
- Add single pickup assignment.
- Add bulk order grouping.
- Add bulk driver assignment.
- Add analytics page.
- Add delivered orders page.

### 6. Driver Module

- Build driver pickups dashboard.
- Add assigned pickup list.
- Add pickup details page.
- Add status update actions.
- Add map directions after accepting pickup.
- Add EcoPoints award trigger on collection.

### 7. Rewards Module

- Replace fixed EcoPoints with realistic item-impact score.
- Add quantity support.
- Add classification multiplier.
- Add condition multiplier.
- Store awarded points on pickup.
- Prevent duplicate rewards.

### 8. UI/UX Module

- Add environmental color theme.
- Add floating island navigation.
- Add dark/light/system appearance option in profile.
- Add profile actions.
- Improve empty states.
- Add safe-area support for phone notch.

## Data Flow

### Citizen Object Data Flow

```text
Citizen input
  -> Mobile AddObjectScreen
  -> POST /objects
  -> Backend ObjectCreate schema
  -> classify_object()
  -> ObjectItem database row
  -> Response to mobile
  -> Object appears in citizen object list
```

### Pickup Data Flow

```text
Citizen request
  -> POST /pickups/request or /pickups/request-bulk
  -> PickupRequest database row
  -> Admin GET /pickups
  -> Admin assigns driver
  -> PUT /pickups/{id}/assign or /pickups/bulk/{bulk_group_id}/assign
  -> Driver GET /drivers/{driver_id}/pickups
  -> Driver status update
  -> PUT /pickups/{id}/status
```

### Location Data Flow

```text
User selects map pin
  -> LocationPicker gets latitude/longitude
  -> Reverse geocoding creates readable address
  -> Address includes exact pin coordinates
  -> Address saved in AsyncStorage history
  -> Address sent with pickup request
  -> Driver accepts pickup
  -> App opens Google Maps directions
```

### EcoPoints Data Flow

```text
Pickup status = Collected
  -> Backend checks tracking history
  -> calculate_ecopoints(object)
  -> pickup.ecopoints_awarded updated
  -> citizen.ecopoints incremented
  -> tracking row created
  -> Citizen profile/home reflects new balance
```

## System Data Entities

### User

- `id`
- `name`
- `email`
- `phone`
- `password_hash`
- `role`
- `ecopoints`
- `otp_code`
- `otp_expires_at`

### ObjectItem

- `id`
- `user_id`
- `name`
- `quantity`
- `category`
- `condition`
- `material`
- `working_condition`
- `usability`
- `damage_level`
- `hazardous`
- `description`
- `image_url`
- `classification`
- `preferred_action`
- `classification_reason`
- `classification_confidence`
- `status`

### PickupRequest

- `id`
- `object_id`
- `user_id`
- `driver_id`
- `address`
- `status`
- `ecopoints_awarded`
- `bulk_group_id`

### ItemTracking

- `id`
- `object_id`
- `status`
- `note`
- `created_at`

## High-Level Architecture

```text
Expo React Native Mobile App
  -> API client
  -> FastAPI Backend
  -> SQL Database
  -> Object classification service
  -> Pickup management service
  -> EcoPoints calculation service
```

## Current Prototype Limitations

- OTP delivery is simulated through demo OTP alerts unless email/SMS provider credentials are added.
- Image uploads are stored as local/base64 URI values rather than cloud object storage.
- Location address history is stored locally on the device using AsyncStorage.
- Driver directions open external Google Maps.
- Classification is rule-based, not machine-learning based.

## Future Improvements

- Connect real email OTP service.
- Connect real SMS OTP provider.
- Store images in cloud storage.
- Add admin map view for all pickups.
- Add route optimization for drivers.
- Add persistent address book in backend.
- Add notification system.
- Add pickup cancellation and rescheduling.
- Add audit logs for admin actions.
