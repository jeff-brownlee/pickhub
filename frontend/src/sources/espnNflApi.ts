import fetch from "node-fetch";

// ESPN NFL API configuration (Official ESPN API)
const ESPN_BASE_URL = "https://sports.core.api.espn.com";
const ESPN_API_KEY = process.env.ESPN_API_KEY; // API key from environment variables (optional)

export interface EspnNflApiConfig {
  apiKey?: string;
  baseUrl?: string;
  week?: number;
  season?: number;
  seasonType?: number; // 1 = preseason, 2 = regular season, 3 = playoffs, etc.
}

export async function fetchEspnNflOdds(config: EspnNflApiConfig = {}): Promise<any> {
  const {
    apiKey = ESPN_API_KEY,
    baseUrl = ESPN_BASE_URL,
    week = 1,
    season = 2025,
    seasonType = 2 // Regular season (1 = preseason, 2 = regular season)
  } = config;

  // Step 1: Fetch NFL events to get event IDs for specific week
  const eventsUrl = `${baseUrl}/v2/sports/football/leagues/nfl/seasons/${season}/types/${seasonType}/weeks/${week}/events?lang=en&region=us&limit=1000`;
  
  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "pickhub/0.1.0"
  };

  // Add API key if provided
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }

  try {
    console.log(`Fetching ESPN events: ${eventsUrl}`);
    const eventsResponse = await fetch(eventsUrl, { headers });
    
    if (!eventsResponse.ok) {
      throw new Error(`ESPN API error: ${eventsResponse.status} ${eventsResponse.statusText}`);
    }

    const eventsData = await eventsResponse.json() as any;
    console.log(`✅ Successfully fetched ${eventsData.items?.length || 0} events from ESPN API`);

    // Step 2: Fetch full event data and odds for each event reference
    const eventsWithOdds = [];
    for (const eventRef of eventsData.items) {
      if (!eventRef.$ref) continue;
      
      try {
        // Fetch the full event data from the reference URL
        console.log(`Fetching full event data from: ${eventRef.$ref}`);
        const eventResponse = await fetch(eventRef.$ref, { headers });
        
        if (!eventResponse.ok) {
          console.log(`❌ Failed to fetch event data: ${eventResponse.status}`);
          continue;
        }
        
        const eventData = await eventResponse.json() as any;
        console.log(`✅ Fetched event data for: ${eventData.name || eventData.id}`);
        
        // Extract event ID and competition ID for odds fetching
        const eventId = eventData.id;
        const competition = eventData.competitions?.[0];
        if (!competition) {
          console.log(`❌ No competition found for event ${eventId}`);
          eventsWithOdds.push(eventData);
          continue;
        }
        
        const competitionId = competition.id;
        const oddsUrl = `${baseUrl}/v2/sports/football/leagues/nfl/events/${eventId}/competitions/${competitionId}/odds`;
        
        try {
          console.log(`Fetching odds for event ${eventId}: ${oddsUrl}`);
          const oddsResponse = await fetch(oddsUrl, { headers });
          
          if (oddsResponse.ok) {
            const oddsData = await oddsResponse.json();
            eventsWithOdds.push({
              ...eventData,
              odds: oddsData
            });
            console.log(`✅ Fetched odds for event ${eventId}`);
          } else {
            console.log(`❌ Failed to fetch odds for event ${eventId}: ${oddsResponse.status}`);
            eventsWithOdds.push(eventData); // Include event without odds
          }
        } catch (oddsError) {
          console.log(`❌ Error fetching odds for event ${eventId}:`, oddsError instanceof Error ? oddsError.message : String(oddsError));
          eventsWithOdds.push(eventData); // Include event without odds
        }
        
      } catch (eventError) {
        console.log(`❌ Error fetching event data:`, eventError instanceof Error ? eventError.message : String(eventError));
        continue;
      }
    }

    return {
      ...eventsData,
      items: eventsWithOdds
    };
    
  } catch (error) {
    console.error("Error fetching ESPN API data:", error);
    throw error;
  }
}

// Web scraping approach for ESPN Bet
export async function scrapeEspnBetOdds(week: number = 1): Promise<any> {
  console.log(`Scraping ESPN Bet odds for Week ${week}...`);
  
  // ESPN Bet website URLs (actual domain)
  const baseUrl = "https://sportsbook.espn.com";
  const nflUrl = `${baseUrl}/sport/football/league/nfl`;
  
  const headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": baseUrl
  };

  try {
    console.log(`Fetching: ${nflUrl}`);
    const response = await fetch(nflUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`✅ Successfully fetched HTML (${html.length} characters)`);
    
    // Parse the HTML to extract odds data
    // This would need to be implemented based on ESPN Bet's actual HTML structure
    // For now, return a placeholder structure
    
    return {
      source: "web_scraping",
      url: nflUrl,
      html_length: html.length,
      games: [] // Would be populated by HTML parsing
    };
    
  } catch (error) {
    console.error("Error scraping ESPN Bet:", error);
    throw error;
  }
}
