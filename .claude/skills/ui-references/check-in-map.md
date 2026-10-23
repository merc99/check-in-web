# Check-in component map

Where to look first for each piece of the app. Left column is the job; first source listed is the first to try.

| Job in Check-in | First look | Also |
|---|---|---|
| Bottom sheet (check-in, profile, crew switcher) | Arc `bottom-sheet` | Tailgrids Sheet, ReUI Sheet |
| Sliding tab bar indicator | transitions.dev `tabs-sliding` | Bencho Tab bar |
| Segmented control / theme toggle | Arc `segmented-control`, `theme-switch` | Opensource UI Segmented Control |
| Count-up numbers (crew n/total, check-in count) | Arc `animated-counter` | transitions.dev `number-pop-in`, `spinning-counter`; Bencho Rolling counter |
| Heart / reactions on posts | transitions.dev `like-button` | Arc `reactions`; Opensource UI Like Toggle; Bencho Emoji reactions |
| Joy moment confetti | Bencho Confetti | transitions.dev Confetti burst (Pro) |
| Success / check-in stamp | transitions.dev `success-check`, `checkbox-check` | Arc `confirm-morph` |
| Avatar stack with lift | transitions.dev `avatar-group-hover` | Arc `avatar-group`; Bencho Avatar group |
| Week heatmap / streak grid | Arc `activity-heatmap` | Opensource UI Daily Activity Calendar; BoardUI contributions |
| Toasts and live arrival pill | Arc `toast-stack` | transitions.dev `toast-open-close`; Bencho Toast stack |
| Email OTP sign-in | Opensource UI OTP Boxed Input | Bencho One-time code; ReUI Input OTP |
| Delete account / leave crew | Arc `hold-to-confirm` | Opensource UI Hold to Delete, Slide to Confirm |
| Swipe actions on a post | Arc `swipe-actions` | |
| Pull to refresh the feed | Bencho Pull to refresh | |
| Skeleton loading | transitions.dev `skeleton-loader-and-reveal` | Arc `skeleton` |
| Empty states | ReUI Empty | Arc `empty-state` |
| Onboarding steps | Arc `onboarding-checklist`, `stepper` | ReUI Stepper |
| Invite ticket | Bencho Ticket | Opensource UI Event Ticket, Circle Cut Frame |
| Crew goal dial (You tab) | Gauge UI | Opensource UI Progress Ring |
| Error shake on forms | transitions.dev `error-state-shake` | Bencho Form error |
| Text reveals (titles) | Arc `in-view-title`, `text-reveal` | transitions.dev `texts-reveal` |
| Check-in landing page | Launch UI | Aura, Oversight sections, Cue |
| Case study (diagrams, MDX, video) | Pele, mdxcn | Oversight Claude video skills; Opensource UI iPhone mockups |
| Custom icon set craft | Iconography Encyclopedia (human ref) | Component Gallery |
| Visual QA against references | Squints | transitions.dev `npx transitions-agent` |
