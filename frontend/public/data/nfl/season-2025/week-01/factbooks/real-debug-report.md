# REAL Factbook Generation Debug Report

**Game:** 2025-09-05-dal-phi
**Total API Calls:** 2
**Total Facts Generated:** 10
**Failed API Calls:** 7

## 📊 Data Sources Summary

- **ESPN API Calls:** 2
- **Real Data Facts:** 10
- **Enhanced Data Facts:** 0
- **Failed API Calls:** 7

## 🔍 Detailed API Call Log

### 1. ESPN Team Data

**Timestamp:** 2025-09-02T23:09:01.499Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6

**Response Data:**
```json
{
  "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/6?lang=en&region=us",
  "id": "6",
  "guid": "b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234",
  "uid": "s:20~l:28~t:6",
  "alternateIds": {
    "sdr": "8809"
  },
  "slug": "dallas-cowboys",
  "location": "Dallas",
  "name": "Cowboys",
  "nickname": "Cowboys",
  "abbreviation": "DAL",
  "displayName": "Dallas Cowboys",
  "shortDisplayName": "Cowboys",
  "color": "002a5c",
  "alternateColor": "b0b7bc",
  "isActive": true,
  "isAllStar": false,
  "logos": [
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500/dal.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "default"
      ],
      "lastUpdated": "2024-06-25T18:47Z"
    },
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500-dark/dal.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "dark"
      ],
      "lastUpdated": "2024-06-25T18:59Z"
    },
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/dal.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "scoreboard"
      ],
      "lastUpdated": "2024-06-25T18:48Z"
    },
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500-dark/scoreboard/dal.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "scoreboard",
        "dark"
      ],
      "lastUpdated": "2024-06-25T18:59Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/primary_logo_on_white_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_white_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/primary_logo_on_black_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_black_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/primary_logo_on_primary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_primary_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/primary_logo_on_secondary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_secondary_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/secondary_logo_on_white_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_white_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/secondary_logo_on_black_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_black_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/secondary_logo_on_primary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_primary_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    },
    {
      "href": "https://a.espncdn.com/guid/b0fc8fb7-9dbe-e574-9008-6f0ee7c6b234/logos/secondary_logo_on_secondary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_secondary_color"
      ],
      "lastUpdated": "2024-12-03T20:49Z"
    }
  ],
  "record": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/6/record?lang=en&region=us"
  },
  "oddsRecords": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/0/teams/6/odds-records?lang=en&region=us"
  },
  "athletes": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/6/athletes?lang=en&region=us"
  },
  "venue": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/venues/3687?lang=en&region=us",
    "id": "3687",
    "guid": "a6d02626-ee51-3e35-98f1-2b05c0b9b2b3",
    "fullName": "AT&T Stadium",
    "address": {
      "city": "Arlington",
      "state": "TX",
      "zipCode": "76011",
      "country": "USA"
    },
    "grass": false,
    "indoor": true,
    "images": [
      {
        "href": "https://a.espncdn.com/i/venues/nfl/day/3687.jpg",
        "width": 2000,
        "height": 1125,
        "alt": "",
        "rel": [
          "full",
          "day"
        ]
      },
      {
        "href": "https://a.espncdn.com/i/venues/nfl/day/interior/3687.jpg",
        "width": 2000,
        "height": 1125,
        "alt": "",
        "rel": [
          "full",
          "day",
          "interior"
        ]
      }
    ]
  },
  "groups": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/groups/1?lang=en&region=us"
  },
  "ranks": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/6/ranks?lang=en&region=us"
  },
  "statistics": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/6/statistics?lang=en&region=us"
  },
  "leaders": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/6/leaders?lang=en&region=us"
  },
  "links": [
    {
      "language": "en-US",
      "rel": [
        "clubhouse",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/_/name/dal/dallas-cowboys",
      "text": "Clubhouse",
      "shortText": "Clubhouse",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "roster",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/roster/_/name/dal/dallas-cowboys",
      "text": "Roster",
      "shortText": "Roster",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "stats",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/stats/_/name/dal/dallas-cowboys",
      "text": "Statistics",
      "shortText": "Statistics",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "schedule",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/schedule/_/name/dal",
      "text": "Schedule",
      "shortText": "Schedule",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "photos",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/photos/_/name/dal",
      "text": "photos",
      "shortText": "photos",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "tickets",
        "desktop",
        "team"
      ],
      "href": "https://www.vividseats.com/dallas-cowboys-tickets--sports-nfl-football/performer/214?wsUser=717",
      "text": "Tickets",
      "shortText": "Tickets",
      "isExternal": true,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "draftpicks",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/draft/teams/_/name/dal/dallas-cowboys",
      "text": "Draft Picks",
      "shortText": "Draft Picks",
      "isExternal": false,
      "isPremium": true
    },
    {
      "language": "en-US",
      "rel": [
        "transactions",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/transactions/_/name/dal",
      "text": "Transactions",
      "shortText": "Transactions",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "injuries",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/injuries/_/name/dal",
      "text": "Injuries",
      "shortText": "Injuries",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "depthchart",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/depth/_/name/dal",
      "text": "Depth Chart",
      "shortText": "Depth Chart",
      "isExternal": false,
      "isPremium": false
    }
  ],
  "injuries": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/injuries?lang=en&region=us"
  },
  "notes": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/notes?lang=en&region=us"
  },
  "againstTheSpreadRecords": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/6/ats?lang=en&region=us"
  },
  "franchise": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/franchises/6?lang=en&region=us"
  },
  "depthCharts": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/6/depthcharts?lang=en&region=us"
  },
  "projection": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/6/projection?lang=en&region=us"
  },
  "events": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/6/events?lang=en&region=us"
  },
  "transactions": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/6/transactions?lang=en&region=us"
  },
  "coaches": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/coaches?lang=en&region=us"
  }
}
```

**Extracted Facts:**
- **teams.away.name**: "Dallas Cowboys" (Source: ESPN API)
- **teams.away.abbreviation**: "DAL" (Source: ESPN API)
- **teams.away.id**: "6" (Source: ESPN API)

---

### 2. ESPN Team Data

**Timestamp:** 2025-09-02T23:09:01.603Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21

**Response Data:**
```json
{
  "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/21?lang=en&region=us",
  "id": "21",
  "guid": "d1a9b001-1df7-fbd7-ae4c-6ca7065286ec",
  "uid": "s:20~l:28~t:21",
  "alternateIds": {
    "sdr": "8823"
  },
  "slug": "philadelphia-eagles",
  "location": "Philadelphia",
  "name": "Eagles",
  "nickname": "Eagles",
  "abbreviation": "PHI",
  "displayName": "Philadelphia Eagles",
  "shortDisplayName": "Eagles",
  "color": "06424d",
  "alternateColor": "000000",
  "isActive": true,
  "isAllStar": false,
  "logos": [
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500/phi.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "default"
      ],
      "lastUpdated": "2024-06-25T18:55Z"
    },
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500-dark/phi.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "dark"
      ],
      "lastUpdated": "2024-06-25T18:56Z"
    },
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500/scoreboard/phi.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "scoreboard"
      ],
      "lastUpdated": "2024-06-25T18:56Z"
    },
    {
      "href": "https://a.espncdn.com/i/teamlogos/nfl/500-dark/scoreboard/phi.png",
      "width": 500,
      "height": 500,
      "alt": "",
      "rel": [
        "full",
        "scoreboard",
        "dark"
      ],
      "lastUpdated": "2024-06-25T18:56Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/primary_logo_on_white_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_white_color"
      ],
      "lastUpdated": "2024-12-03T20:48Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/primary_logo_on_black_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_black_color"
      ],
      "lastUpdated": "2024-12-03T20:48Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/primary_logo_on_primary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_primary_color"
      ],
      "lastUpdated": "2024-12-03T20:47Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/primary_logo_on_secondary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "primary_logo_on_secondary_color"
      ],
      "lastUpdated": "2024-12-03T20:48Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/secondary_logo_on_white_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_white_color"
      ],
      "lastUpdated": "2024-12-03T20:48Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/secondary_logo_on_black_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_black_color"
      ],
      "lastUpdated": "2024-12-03T20:48Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/secondary_logo_on_primary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_primary_color"
      ],
      "lastUpdated": "2024-12-03T20:48Z"
    },
    {
      "href": "https://a.espncdn.com/guid/d1a9b001-1df7-fbd7-ae4c-6ca7065286ec/logos/secondary_logo_on_secondary_color.png",
      "width": 4096,
      "height": 4096,
      "alt": "",
      "rel": [
        "full",
        "secondary_logo_on_secondary_color"
      ],
      "lastUpdated": "2024-12-03T20:48Z"
    }
  ],
  "record": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/21/record?lang=en&region=us"
  },
  "oddsRecords": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/0/teams/21/odds-records?lang=en&region=us"
  },
  "athletes": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/21/athletes?lang=en&region=us"
  },
  "venue": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/venues/3806?lang=en&region=us",
    "id": "3806",
    "guid": "a1e68291-b8a7-3428-9754-7bfc568e5d71",
    "fullName": "Lincoln Financial Field",
    "address": {
      "city": "Philadelphia",
      "state": "PA",
      "zipCode": "19148",
      "country": "USA"
    },
    "grass": true,
    "indoor": false,
    "images": [
      {
        "href": "https://a.espncdn.com/i/venues/nfl/day/3806.jpg",
        "width": 2000,
        "height": 1125,
        "alt": "",
        "rel": [
          "full",
          "day"
        ]
      },
      {
        "href": "https://a.espncdn.com/i/venues/nfl/day/interior/3806.jpg",
        "width": 2000,
        "height": 1125,
        "alt": "",
        "rel": [
          "full",
          "day",
          "interior"
        ]
      }
    ]
  },
  "groups": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/groups/1?lang=en&region=us"
  },
  "ranks": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/21/ranks?lang=en&region=us"
  },
  "statistics": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/21/statistics?lang=en&region=us"
  },
  "leaders": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/21/leaders?lang=en&region=us"
  },
  "links": [
    {
      "language": "en-US",
      "rel": [
        "clubhouse",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/_/name/phi/philadelphia-eagles",
      "text": "Clubhouse",
      "shortText": "Clubhouse",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "roster",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/roster/_/name/phi/philadelphia-eagles",
      "text": "Roster",
      "shortText": "Roster",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "stats",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/stats/_/name/phi/philadelphia-eagles",
      "text": "Statistics",
      "shortText": "Statistics",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "schedule",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/schedule/_/name/phi",
      "text": "Schedule",
      "shortText": "Schedule",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "photos",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/photos/_/name/phi",
      "text": "photos",
      "shortText": "photos",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "tickets",
        "desktop",
        "team"
      ],
      "href": "https://www.vividseats.com/philadelphia-eagles-tickets--sports-nfl-football/performer/669?wsUser=717",
      "text": "Tickets",
      "shortText": "Tickets",
      "isExternal": true,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "draftpicks",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/draft/teams/_/name/phi/philadelphia-eagles",
      "text": "Draft Picks",
      "shortText": "Draft Picks",
      "isExternal": false,
      "isPremium": true
    },
    {
      "language": "en-US",
      "rel": [
        "transactions",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/transactions/_/name/phi",
      "text": "Transactions",
      "shortText": "Transactions",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "injuries",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/injuries/_/name/phi",
      "text": "Injuries",
      "shortText": "Injuries",
      "isExternal": false,
      "isPremium": false
    },
    {
      "language": "en-US",
      "rel": [
        "depthchart",
        "desktop",
        "team"
      ],
      "href": "https://www.espn.com/nfl/team/depth/_/name/phi",
      "text": "Depth Chart",
      "shortText": "Depth Chart",
      "isExternal": false,
      "isPremium": false
    }
  ],
  "injuries": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/injuries?lang=en&region=us"
  },
  "notes": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/notes?lang=en&region=us"
  },
  "againstTheSpreadRecords": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/types/1/teams/21/ats?lang=en&region=us"
  },
  "franchise": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/franchises/21?lang=en&region=us"
  },
  "depthCharts": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/21/depthcharts?lang=en&region=us"
  },
  "projection": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/21/projection?lang=en&region=us"
  },
  "events": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/21/events?lang=en&region=us"
  },
  "transactions": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2025/teams/21/transactions?lang=en&region=us"
  },
  "coaches": {
    "$ref": "http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/coaches?lang=en&region=us"
  }
}
```

**Extracted Facts:**
- **teams.home.name**: "Philadelphia Eagles" (Source: ESPN API)
- **teams.home.abbreviation**: "PHI" (Source: ESPN API)
- **teams.home.id**: "21" (Source: ESPN API)

---

### 3. ESPN Team Record

**Timestamp:** 2025-09-02T23:09:01.701Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/record


**Errors:**
- Error: HTTP 404: Not Found

---

### 4. ESPN Team Record

**Timestamp:** 2025-09-02T23:09:01.935Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/record


**Errors:**
- Error: HTTP 404: Not Found

---

### 5. ESPN Venue Data

**Timestamp:** 2025-09-02T23:09:02.022Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/venue


**Errors:**
- Error: HTTP 404: Not Found

---

### 6. ESPN Team Statistics

**Timestamp:** 2025-09-02T23:09:02.107Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/statistics


**Errors:**
- Error: HTTP 404: Not Found

---

### 7. ESPN Team Statistics

**Timestamp:** 2025-09-02T23:09:02.216Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/statistics


**Errors:**
- Error: HTTP 404: Not Found

---

### 8. ESPN Player Data

**Timestamp:** 2025-09-02T23:09:02.297Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/6/athletes


**Errors:**
- Error: HTTP 404: Not Found

---

### 9. ESPN Player Data

**Timestamp:** 2025-09-02T23:09:02.391Z
**URL:** https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams/21/athletes


**Errors:**
- Error: HTTP 404: Not Found

---

### 10. Local Games Data

**Timestamp:** 2025-09-02T23:09:02.393Z
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

