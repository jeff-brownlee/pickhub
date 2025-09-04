# 📊 PickHub → DraftKings Affiliate Flow

This document outlines how PickHub can integrate DraftKings affiliate links while staying compliant with state-by-state sports betting rules.

---

## Flow Diagram

```
[User opens PickHub] 
        │
        ▼
[Selects Persona → Game Analysis]
        │
        ▼
[Sees Pick + "Bet Now on DraftKings" CTA]
        │
        ▼
───────────── Compliance Branch ─────────────
        │
   [Check User Location] (IP/device geo)
        │
   ┌───────────────┬────────────────┐
   ▼               ▼                ▼
[In Legal State] [Unknown]      [Banned State]
   │               │                │
   │               │                │
   ▼               ▼                ▼
[Show DraftKings  [Show DraftKings  [Show Msg: 
Affiliate Link    Link but note:    "Not available 
to state-         "Only available   in your state."]
specific landing   in select states"]
page]              │
   │               │
   ▼               ▼
[User clicks → DraftKings landing page with affiliate tracking]
        │
        ▼
[User registers + deposits → CPA credit to PickHub]
```

---

## Key Notes

- **Location logic**  
  - MVP: always show DraftKings affiliate link but add disclaimer text.  
  - Future: detect user’s state and show state-specific DraftKings link or alternative sportsbook.  

- **Affiliate tracking**  
  Handled via **Income Access**. Example format:  
  ```
  https://sportsbook.draftkings.com/?s=affid_YOURID&campaign=PICKHUB
  ```

- **User experience**  
  - Persona analysis feels authentic.  
  - CTA phrased in persona voice, e.g., *“Cole Maddox says hammer this line on DraftKings.”*  

- **Compliance**  
  Always include responsible gaming text under each CTA:  
  > 21+, Gambling Problem? Call 1-800-GAMBLER
