# Security and privacy plan

How UbuntuLink protects people's information, in plain language, in three parts:

1. **Protection built into the platform** — what keeps users' information safe today.
2. **Trust and safety features** — identity checks, payments and issue reporting, and the privacy choices
   behind them.
3. **Next steps** — how we're extending privacy and security as the platform grows.

It's written against South Africa's **POPIA** (Protection of Personal Information Act) and the **Consumer
Protection Act**.

---

## Part 1 — Protection built into the platform

| Protection | What it means for users |
|---|---|
| **Passwords are scrambled** (Argon2 hashing) | Even we can't read anyone's password. A leaked database wouldn't reveal them. |
| **Logins expire after an hour** | A stolen login stops working quickly. |
| **You only see your own jobs** | Requests, quotes, bookings, the work tracker, reviews and chats are visible only to the customer and provider involved. |
| **We never keep ID numbers** | A provider's South African ID number is checked, then thrown away. We keep only "verified: yes". |
| **Photos are cleaned** | Location data hidden inside phone photos (GPS) is removed before upload, so a photo can't reveal where someone lives. Only real image files are accepted. |
| **Fair ratings** | Only the customer who booked a completed job can review it, and only once. |
| **No double-booking** | A job can't be booked twice, even if two people tap at the same moment. |
| **Secrets kept out of the code** | Passwords and keys live in the hosting settings, not in the code; the code history has been checked. |
| **Sign-in disclaimer** | Users acknowledge that UbuntuLink connects them with providers and doesn't do the work itself. |

---

## Part 2 — Trust and safety features

| Feature | How it works | Why it's designed this way |
|---|---|---|
| **Provider identity verification** | Becoming a provider requires a valid South African ID number, a photo of the ID document and a selfie. The ID number is validated (format, date of birth and check digit). | **We don't keep the ID number, the ID photo or the selfie** — only the result, "verified". A selfie used for matching is **biometric data**, the most sensitive category under POPIA, so holding as little as possible is the safest design. Verified providers carry a ✓ badge. |
| **Payments** | Payment for the accepted quote is triggered when the provider marks the job completed. | UbuntuLink **never handles or stores card details**, so there's nothing for an attacker to steal. |
| **Report an issue** | From any quote, booking or provider profile, users describe the problem and receive a reference number. | Gives every user a clear complaints path, which consumer law expects. |
| **Private messaging** | Customers and providers chat inside the app. | Numbers and emails don't have to be shared, and only the two people in a conversation can read it. |
| **Platform disclaimer** | Users confirm that UbuntuLink connects them with independent providers and doesn't do the work itself. | Makes the platform's role clear. |

---

## Part 3 — Next steps, and how

### Priority security improvements

| Gap | Why it matters | How to fix it |
|---|---|---|
| **Database password was exposed** in a file on a teammate's GitHub branch | Anyone who saw it could read the database | **Change the database password now** in Supabase, update the hosting settings, and delete that branch. |
| **Password reset is weak** — only needs email and phone number | Someone who knows both could take over an account | Send a **one-time reset link by email** that expires after 15 minutes. |
| **The AI service is open to the internet** | Anyone could use our AI (running up cost) or send it data | Let it accept requests **only from our own backend**, using a shared secret. |
| **No limit on repeated attempts** | Password guessing, spam messages, AI abuse | **Limit how often** anyone can try to log in, register, message or use AI in a short time. |
| **Test/debug tools still switched on** | Unneeded ways into the system | **Remove** the ID-check test endpoint before launch. |

### Legal and privacy setup (POPIA)

| To do | How |
|---|---|
| **Appoint an Information Officer** | Name a responsible person (usually a founder) and **register them with the Information Regulator** (free, online). |
| **Privacy notice and terms pages** | A plain-language privacy notice (what we collect, why, who we share it with, how long we keep it, users' rights) and full terms, reviewed by a **lawyer**. Include that our database is in Europe and the AI provider is overseas, and why that's allowed. |
| **Rework the disclaimer** | Under consumer law a platform **can't disclaim its own negligence**. Limit the disclaimer to what we don't control (a provider's workmanship), in plain language, and state what we *do* do: verify IDs, show ratings, keep messages, handle complaints. |
| **Consent at registration** | Move the disclaimer to sign-up with "I agree to the Terms and have read the Privacy Notice" and "I am 18 or older", and ask once before photos or voice go to the AI. |
| **Record consent properly** | Store the date and the version of the terms each user accepted; ask again when the terms change. |
| **Agreements with our suppliers** | Sign the standard **data processing agreements** with our database, hosting and AI providers, requiring them to protect the data. Choose an AI plan that **doesn't train on our customers' data**. |
| **PAIA manual** | Publish the short standard document explaining how people can request their records (required of private companies). |
| **"Your data" on Profile** | **Download my data** and **Delete my account** buttons: an automatic download, and a real deletion (keeping only what the law requires, such as financial records, with names removed). |
| **Retention in practice** | A nightly clean-up that deletes or anonymises data once its time is up, following the published schedule. |
| **Share less with the AI** | Strip names, phone numbers and emails from messages before they go to the AI. |
| **Breach procedure** | Finalise the incident plan and **rehearse it once**: who decides, how to lock things down, and how to notify the Regulator and users quickly. |

### Stronger protection (within a few months of launch)

| Improvement | How |
|---|---|
| **Safer login storage** in the browser | Keep the login in a protected browser cookie that page scripts can't read. |
| **Photos out of the main database** | Move them to private file storage with short-lived links. |
| **Extra encryption** for the most sensitive fields (phone numbers, chats) | Encrypt them individually, so a stolen database backup is unreadable. |
| **Browser security settings** | Standard protections that stop other websites embedding or injecting into ours. |
| **Logs without personal data** | Log what happened, not what people wrote; delete logs after 30 days. |
| **Automatic security checks** | Turn on GitHub's free vulnerability alerts and code scanning. |

### If ID verification becomes real

Use an **accredited identity-verification company** that checks against Home Affairs. Ask for **explicit
consent** for the selfie match. Keep only the **result** ("verified on this date"), never the ID photo, selfie
or ID number.

---

## Order of work

| When | What |
|---|---|
| **Now** | Change the exposed database password · remove the debug tool · privacy notice and consent at registration |
| **Before launch** | Fix the password reset · lock down the AI service · add attempt limits · Information Officer · privacy notice, terms and disclaimer (lawyer-reviewed) · supplier agreements · real "Your data" · breach plan |
| **First 3 months** | Stronger protection list · automatic retention clean-up |
| **Ongoing** | Review this plan whenever we collect a new kind of data; rehearse the breach plan yearly |

---

## What to say if asked

- *"We never store ID numbers, ID photos or selfies — only whether the ID was verified."*
- *"Passwords are scrambled, logins expire, and every job is visible only to the two people involved."*
- *"UbuntuLink never handles card details."*
- *"Our privacy work follows POPIA's eight conditions — next we're adding the privacy notice, consent at
  sign-up, and download-or-delete-your-data, and registering our Information Officer with the Regulator."*
