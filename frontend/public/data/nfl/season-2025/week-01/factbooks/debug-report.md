# Factbook Generation Debug Report

**Game:** 2025-09-05-dal-phi
**Total API Calls:** 9
**Total Facts Generated:** 39

## 📊 Data Sources Summary

- **ESPN API Calls:** 9
- **Real Data Facts:** 4
- **Enhanced Data Facts:** 4
- **Mock Data Facts:** 31

## 🔍 Detailed API Call Log

### 1. ESPN Team Data

**Timestamp:** 2025-09-02T23:06:30.771Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6

**Response Data:**
```json
{
  "id": "6",
  "displayName": "Dallas Cowboys",
  "abbreviation": "DAL",
  "record": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/record"
  },
  "venue": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/venue"
  },
  "statistics": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/statistics"
  },
  "athletes": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/athletes"
  }
}
```

**Extracted Facts:**
- **teams.away.name**: "Dallas Cowboys" (Source: ESPN API)
- **teams.away.abbreviation**: "DAL" (Source: ESPN API)
- **teams.away.id**: "6" (Source: ESPN API)

---

### 2. ESPN Team Data

**Timestamp:** 2025-09-02T23:06:30.772Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21

**Response Data:**
```json
{
  "id": "21",
  "displayName": "Philadelphia Eagles",
  "abbreviation": "PHI",
  "record": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/record"
  },
  "venue": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/venue"
  },
  "statistics": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/statistics"
  },
  "athletes": {
    "$ref": "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/athletes"
  }
}
```

**Extracted Facts:**
- **teams.home.name**: "Philadelphia Eagles" (Source: ESPN API)
- **teams.home.abbreviation**: "PHI" (Source: ESPN API)
- **teams.home.id**: "21" (Source: ESPN API)

---

### 3. ESPN Team Record

**Timestamp:** 2025-09-02T23:06:30.774Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/record

**Response Data:**
```json
{
  "items": [
    {
      "type": "total",
      "summary": "3-1-0",
      "stats": [
        {
          "name": "wins",
          "value": 3
        },
        {
          "name": "losses",
          "value": 1
        },
        {
          "name": "ties",
          "value": 0
        }
      ]
    }
  ]
}
```

**Extracted Facts:**
- **teams.away.record.wins**: 3 (Source: ESPN API)
- **teams.away.record.losses**: 1 (Source: ESPN API)
- **teams.away.record.winPercentage**: 0.75 (Source: ESPN API)

---

### 4. ESPN Team Record

**Timestamp:** 2025-09-02T23:06:30.774Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/record

**Response Data:**
```json
{
  "items": [
    {
      "type": "total",
      "summary": "3-1-0",
      "stats": [
        {
          "name": "wins",
          "value": 3
        },
        {
          "name": "losses",
          "value": 1
        },
        {
          "name": "ties",
          "value": 0
        }
      ]
    }
  ]
}
```

**Extracted Facts:**
- **teams.home.record.wins**: 3 (Source: ESPN API)
- **teams.home.record.losses**: 1 (Source: ESPN API)
- **teams.home.record.winPercentage**: 0.75 (Source: ESPN API)

---

### 5. ESPN Venue Data

**Timestamp:** 2025-09-02T23:06:30.775Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/venue

**Response Data:**
```json
{
  "id": "1234",
  "fullName": "Lincoln Financial Field",
  "address": {
    "city": "Philadelphia",
    "state": "PA"
  },
  "grass": true,
  "indoor": false
}
```

**Extracted Facts:**
- **venue.name**: "Lincoln Financial Field" (Source: ESPN API)
- **venue.city**: "Philadelphia" (Source: ESPN API)
- **venue.state**: "PA" (Source: ESPN API)
- **venue.surface**: "grass" (Source: ESPN API)
- **venue.indoor**: false (Source: ESPN API)

---

### 6. ESPN Team Statistics

**Timestamp:** 2025-09-02T23:06:30.779Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/statistics

**Response Data:**
```json
{
  "splits": {
    "categories": [
      {
        "name": "offense",
        "displayName": "Offense",
        "stats": [
          {
            "name": "pointsPerGame",
            "value": 24.5
          },
          {
            "name": "yardsPerGame",
            "value": 350
          },
          {
            "name": "passingYards",
            "value": 250
          },
          {
            "name": "rushingYards",
            "value": 100
          }
        ]
      }
    ]
  }
}
```

**Extracted Facts:**
- **teams.away.statistics.offense.pointsPerGame**: 24.5 (Source: ESPN API)
- **teams.away.statistics.offense.yardsPerGame**: 350 (Source: ESPN API)
- **teams.away.statistics.offense.passingYards**: 250 (Source: ESPN API)
- **teams.away.statistics.offense.rushingYards**: 100 (Source: ESPN API)

---

### 7. ESPN Team Statistics

**Timestamp:** 2025-09-02T23:06:30.779Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/statistics

**Response Data:**
```json
{
  "splits": {
    "categories": [
      {
        "name": "offense",
        "displayName": "Offense",
        "stats": [
          {
            "name": "pointsPerGame",
            "value": 24.5
          },
          {
            "name": "yardsPerGame",
            "value": 350
          },
          {
            "name": "passingYards",
            "value": 250
          },
          {
            "name": "rushingYards",
            "value": 100
          }
        ]
      }
    ]
  }
}
```

**Extracted Facts:**
- **teams.home.statistics.offense.pointsPerGame**: 24.5 (Source: ESPN API)
- **teams.home.statistics.offense.yardsPerGame**: 350 (Source: ESPN API)
- **teams.home.statistics.offense.passingYards**: 250 (Source: ESPN API)
- **teams.home.statistics.offense.rushingYards**: 100 (Source: ESPN API)

---

### 8. ESPN Player Data

**Timestamp:** 2025-09-02T23:06:30.784Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/athletes

**Response Data:**
```json
{
  "items": [
    {
      "id": "12345",
      "displayName": "Dak Prescott",
      "position": {
        "abbreviation": "QB"
      },
      "status": {
        "id": "1",
        "name": "Active"
      }
    }
  ]
}
```

**Extracted Facts:**
- **teams.away.keyPlayers[0].name**: "Dak Prescott" (Source: ESPN API)
- **teams.away.keyPlayers[0].position**: "QB" (Source: ESPN API)
- **teams.away.keyPlayers[0].status**: "active" (Source: ESPN API)

---

### 9. ESPN Player Data

**Timestamp:** 2025-09-02T23:06:30.784Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/athletes

**Response Data:**
```json
{
  "items": [
    {
      "id": "12345",
      "displayName": "Dak Prescott",
      "position": {
        "abbreviation": "QB"
      },
      "status": {
        "id": "1",
        "name": "Active"
      }
    }
  ]
}
```

**Extracted Facts:**
- **teams.home.keyPlayers[0].name**: "Jalen Hurts" (Source: ESPN API)
- **teams.home.keyPlayers[0].position**: "QB" (Source: ESPN API)
- **teams.home.keyPlayers[0].status**: "active" (Source: ESPN API)

---

### 10. Local Games Data

**Timestamp:** 2025-09-02T23:06:30.785Z
**URL:** C:\Users\jeffb\Documents\development\pickhub\frontend\public\data\nfl\season-2025\week-01\games.json

**Response Data:**
```json
{
  "spread": {
    "away": {
      "line": 7.5,
      "odds": -110
    },
    "home": {
      "line": -7.5,
      "odds": -110
    }
  },
  "total": {
    "over": {
      "line": 51,
      "odds": -110
    },
    "under": {
      "line": 51,
      "odds": -110
    }
  },
  "moneyline": {
    "away": {
      "odds": -223
    },
    "home": {
      "odds": -262
    }
  }
}
```

**Extracted Facts:**
- **bettingContext.currentLine.spread**: -7.5 (Source: Local games.json)
- **bettingContext.currentLine.total**: 51 (Source: Local games.json)
- **bettingContext.currentLine.moneyline.home**: -262 (Source: Local games.json)
- **bettingContext.currentLine.moneyline.away**: -223 (Source: Local games.json)

---

### 11. Enhanced Data

**Timestamp:** 2025-09-02T23:06:30.786Z
**URL:** N/A - Mock Data

**Response Data:**
```json
"Enhanced team data"
```

**Extracted Facts:**
- **teams.away.coaching.headCoach**: "Mike McCarthy" (Source: Enhanced Data)
- **teams.home.coaching.headCoach**: "Nick Sirianni" (Source: Enhanced Data)
- **trends[0].description**: "Dallas has won 4 of the last 6 meetings" (Source: Enhanced Data)
- **keyMatchups[0].description**: "Dallas passing offense vs Philadelphia secondary" (Source: Enhanced Data)

---

