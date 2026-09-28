# Baydaar Experiences website

Static site: `index.html`, `style.css`, `main.js`, `img/`. No build step. Upload the folder to any host.

## Before going live, fill these in `main.js` → `CONFIG`

| Setting | What to put |
|---|---|
| `WHATSAPP` | Business WhatsApp number, digits only, e.g. `923001234567`. Empty = email fallback. |
| `LICENCE` | DTS / tourism licence number. Shows in the trust line when filled. |
| `TRIPS[].deps` | Real departure dates and seats left. **Current dates and seats are samples.** Past dates hide automatically. |

Ideally `TRIPS` is loaded from the Baydaar app's API so the board and the booking widget stay live.

## Forms

- **Booking widget** prices the trip on the page, then sends people to the real app (`/app/experience/<id>`) to submit.
- **15-minute call** builds a WhatsApp (or email) message with the chosen slot. To store bookings automatically, connect it to a backend or Calendly/Cal.com.

## Photo credits

Client photos from baydaarexperiences.com. Hunza, Attabad, Katpana, Deosai, Rakaposhi: public domain (Wikimedia Commons). K2 panorama (simonsimages), Passu (Raki_Man), Eagle's Nest (Yasin Chaudhry), Cappadocia (Arian Zwegers): CC BY, credited in the footer.
