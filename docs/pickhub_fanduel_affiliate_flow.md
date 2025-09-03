# 📊 PickHub → FanDuel Affiliate Flow

This document outlines how PickHub can integrate FanDuel affiliate links while staying compliant with state-by-state sports betting rules.

---

## Flow Diagram

```
[User opens PickHub] 
        │
        ▼
[Selects Persona → Game Analysis]
        │
        ▼
[Sees Pick + "Bet Now" CTA]
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
[Show FanDuel    [Show FanDuel    [Show Msg: 
Affiliate Link   Link but note:   "Not available 
to state-        "Only available  in your state."]
specific landing  in select states"]
page]             │
   │               │
   ▼               ▼
[User clicks → FanDuel landing page/app with affiliate tracking]
        │
        ▼
[User registers + deposits → CPA credit to PickHub]
```

---

## Key Notes

- **Location logic**  
  - MVP: always show FanDuel affiliate link but add disclaimer text.  
  - Future: detect user’s state and show state-specific link or alternative sportsbook.  

- **Affiliate tracking**  
  Handled via **Income Access**. Example:  
  ```
  https://fanduel.com?partner=YOURID&campaign=PICKHUB
  ```

- **User experience**  
  - Persona analysis feels authentic.  
  - CTA phrased in persona voice, e.g., *“Bet Maddie’s Pick on FanDuel.”*  

- **Compliance**  
  Always include responsible gaming text under each CTA:  
  > 21+, Gambling Problem? Call 1-800-GAMBLER
