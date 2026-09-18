# Feedback inbox

Feedback is available near the top of Settings in English, Malay, and Arabic. It accepts a required message (up to 3,000 characters), optional 1–5 rating, and optional reply email. No practice history is sent. Netlify also stores technical request metadata for spam prevention, as disclosed in Privacy.

Read submissions at https://app.netlify.com/sites/myzikr/forms (sign into the site owner's Netlify account). Open `zikr-feedback`; check Spam if a submission is missing. Export CSV from the form inbox and import that file into Google Sheets when you want spreadsheet analysis. There is no automatic Google Sheets sync and no separate database to configure. Do not publish the inbox or exported email addresses.

Form detection must remain enabled. The hidden HTML form in `index.html` registers the exact field names at deploy time. The React form posts URL-encoded fields to `/feedback-received.html`; the hidden form's action selects that acknowledgement page. A honeypot and Netlify's spam filtering are enabled. Netlify account limits and usage policies apply; review them in the dashboard before a large campaign.

Feedback needs internet. The form retains text after a failed request while it remains mounted; it does not save drafts across navigation or app closure. A 15-second timeout lets users retry. A network failure after delivery may result in duplicate feedback on retry. We intentionally do not silently queue offline submissions or attach local practice data.

Local Vite preview does not process Netlify Forms. Test storage on a Netlify deployment and verify the record in the private inbox; a successful HTTP response alone is insufficient. Automated component tests cover acknowledgement, unexpected responses, offline attempts, field allowlisting, retained text on failure, and duplicate clicks while pending.
