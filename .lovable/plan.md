

# Tapne — Travel Social Platform MVP

A clean, adventurous travel social platform where users discover trips, join communities, and create their own travel experiences.

---

## Design System

- **Primary color**: Soft teal palette
- **Style**: Card-based, spacious, medium rounded corners, soft shadows
- **Typography**: Clean sans-serif
- **Mode**: Light only
- **Feel**: Adventurous yet trustworthy, backpacker-friendly but premium

---

## Pages & Features

### 1. Landing Page
- Hero with headline: *"Find your kind of people. Then travel."*
- Two CTAs: "Explore Trips" (primary) and "Create a Trip" (secondary)
- Grid of 4–6 featured trip cards below
- "View All Trips" link
- Simple, inspiring — no long marketing sections

### 2. Browse Trips Page
- Search bar for destination text search
- Filter dropdown by trip type (Backpacking, Trek, Social, etc.)
- Sort by newest (default)
- Responsive grid of trip cards showing: cover image, title, destination, dates, budget, spots left, host name
- Loading skeletons, empty state, and pagination

### 3. Trip Detail Page
- Large cover image with title, destination, dates, budget, trip type badge
- Description section and host info
- Spots left indicator
- "Join Trip" button with smart states (enabled, full, already joined, login prompt)
- Participants list with avatars

### 4. Create Trip Page
- Clean single-page form: title, destination, dates, budget, trip type, description, max group size
- Inline validation (required fields, date logic, numeric budget)
- Loading state on submit, success message, redirect to trip detail

### 5. Authentication Screens
- Sign Up and Login pages with minimal design
- Clear input fields and error messages
- Mock auth state management with redirect to intended action

### 6. Profile Page
- Profile image, name, bio, location
- Tabs for trips created and trips joined (simplified card format)
- "Edit Profile" button with modal for own profile

---

## Shared Components & UX

- **Navbar**: Logo, Explore Trips, Create Trip, Profile/Login — with logged-in (avatar + dropdown) and logged-out states
- **Footer**: Simple with links
- **Reusable components**: TripCard, UserCard, Button, Input, Badge, Modal, Dropdown
- **States everywhere**: Loading skeletons, empty states with motivational messages, error states, success feedback
- **Fully responsive**: Mobile-first stacked layouts, easy tap targets

## Mock Data
- Realistic trips: Goa backpacking, Himachal trek, Bali social trip, Rajasthan desert camp
- Realistic user profiles with placeholder avatars

