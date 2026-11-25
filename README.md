# Borneo Wild Capture — Premium Edition

A responsive, multi-page static website for Borneo Wild Capture, built around the approved Luxury Borneo Wildlife Expedition visual direction.

## Pages
- Home
- Expeditions
- Essential Escape (3 days / 2 nights)
- Wildlife Experience (4 days / 3 nights)
- Wildlife Moments (5 days / 4 nights)
- How to Get Here
- Wildlife Gallery
- People & Culture
- Our Story
- Booking & Contact

## Brand assets
The site uses the original Borneo Wild Capture logo and supplied photographs from the existing `borneo-wild-capture` repository. Source image files are referenced directly at their existing raw GitHub paths; no image edits or generated replacement photographs are used. Keep the original repository and asset paths available.

## Booking and admin dashboard
The booking inquiry form validates the visitor's details, saves the enquiry to the Supabase `bookings` table, and then opens WhatsApp with the enquiry prefilled. Visitors must still press Send in WhatsApp; saving an enquiry does not confirm availability or a reservation.

The admin dashboard at `admin.html` uses Supabase Auth to manage booking enquiries, expedition packages, FAQs and fixed tour departures. The public booking page displays upcoming departures and remaining shared seats. Run `supabase/tour-availability.sql` in Supabase SQL Editor after the base schema and admin access policy to enable the availability calendar, booking-to-departure links and capacity protection. A booking enquiry reserves seats until it is cancelled or deleted. Booking records include travel date, travel style and message details. Configure the Supabase project using `assets/js/supabase-config.js` and run `supabase/schema.sql` in the Supabase SQL Editor. Keep public sign-ups disabled and create trusted admin accounts manually. Never put a Supabase `service_role` or secret key in frontend files.

## Deployment
A GitHub Pages workflow is included at `.github/workflows/pages.yml`. Enable GitHub Pages for this repository and choose **GitHub Actions** as the deployment source. After that, pushes to `main` deploy automatically.

## Local preview
Open `index.html` directly or serve this directory with any static file server. No build step or package installation is required.


## Exclusive date-range booking

The public booking page now offers a rolling 30-day calendar. Guests select a start and end date; any date already occupied by a non-cancelled booking (including legacy fixed-departure bookings) is disabled. Overlapping date ranges are also rejected by a database trigger to prevent simultaneous submissions from double-booking the same dates. Guests can use **Ask for Custom Date** to request unavailable dates directly over WhatsApp; custom pricing is quoted manually by the team.

Before enabling this flow on the live database, run the complete `supabase/tour-availability.sql` file again in the Supabase SQL Editor. It adds the date-range columns, availability RPC, overlap lock/validation trigger, and legacy-date compatibility. Cancelled bookings release their date range. The admin booking details show the selected date range.


Deployment is published from the main branch through GitHub Actions and GitHub Pages.
