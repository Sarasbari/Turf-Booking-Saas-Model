# Turf Booking Frontend

## Scroll-linked landing hero (video scrubbing)

1. Put your hero video file in `frontend/public/`:
   - recommended filename: `landing-impact.webm`
2. Run the frontend:
   - `npm install`
   - `npm run dev`

The landing hero is implemented in:
- `src/components/ScrollVideoHero/ScrollVideoHero.tsx`

It is **scroll-driven** (no autoplay). The hero section is pinned while the video advances from start to finish based on scroll progress.

