/**
 * Persona configurations for the heuristic pick selection system
 * Each persona has weights for features and betting preferences
 */

import { PersonaConfig } from './types';

/**
 * Persona configurations with weights and preferences
 * Weights should sum to 1.0 for normalized scoring
 */
export const PERSONA_CONFIGS: Record<string, PersonaConfig> = {
  // Sports Analytics Nerd - balanced approach, weights NE/LM equally, mild PF
  nerd: {
    id: 'nerd',
    name: 'Sports Analytics Nerd',
    weights: {
      numberEdge: 0.4,      // Heavy on key number discipline
      lineMovement: 0.4,    // Equal weight to line movement
      priceFriendliness: 0.2 // Mild preference for good prices
    },
    preferences: {
      dogs: false,  // No strong preference for dogs
      unders: false // No strong preference for unders
    }
  },

  // Contrarian - flips LM, prefers dogs/unders
  contrarian: {
    id: 'contrarian',
    name: 'Contrarian',
    weights: {
      numberEdge: 0.3,      // Moderate key number focus
      lineMovement: 0.5,    // Heavy on line movement (will be flipped)
      priceFriendliness: 0.2 // Mild preference for good prices
    },
    preferences: {
      dogs: true,   // Prefers underdogs
      unders: true  // Prefers unders
    }
  },

  // Old Football Coach - heavy on key-number discipline
  coach: {
    id: 'coach',
    name: 'Old Football Coach',
    weights: {
      numberEdge: 0.6,      // Heavy on key number discipline
      lineMovement: 0.2,    // Less focus on line movement
      priceFriendliness: 0.2 // Moderate price awareness
    },
    preferences: {
      dogs: false,  // No strong preference for dogs
      unders: true  // Prefers unders (defensive mindset)
    }
  },

  // Frat Guy - leans toward favorites & overs
  fratguy: {
    id: 'fratguy',
    name: 'Frat Guy',
    weights: {
      numberEdge: 0.2,      // Less focus on key numbers
      lineMovement: 0.3,    // Moderate line movement focus
      priceFriendliness: 0.5 // Heavy on getting good prices
    },
    preferences: {
      dogs: false, // Prefers favorites
      unders: false // Prefers overs
    }
  },

  // Average Joe - balanced, no strong preferences
  joe: {
    id: 'joe',
    name: 'Average Joe',
    weights: {
      numberEdge: 0.33,     // Balanced approach
      lineMovement: 0.33,   // Balanced approach
      priceFriendliness: 0.34 // Slightly more price conscious
    },
    preferences: {
      dogs: false,  // No strong preference
      unders: false // No strong preference
    }
  },

  // Mobster - sharp bettor mindset, hunts value
  mobster: {
    id: 'mobster',
    name: 'Mobster',
    weights: {
      numberEdge: 0.4,      // Good key number awareness
      lineMovement: 0.4,    // Heavy on line movement (sharp money)
      priceFriendliness: 0.2 // Moderate price focus
    },
    preferences: {
      dogs: true,   // Prefers underdogs (value hunting)
      unders: false // No strong total preference
    }
  },

  // Hot Girl - casual bettor, follows trends
  hotgirl: {
    id: 'hotgirl',
    name: 'Hot Girl',
    weights: {
      numberEdge: 0.1,      // Minimal key number focus
      lineMovement: 0.6,    // Heavy on following trends
      priceFriendliness: 0.3 // Moderate price awareness
    },
    preferences: {
      dogs: false, // Prefers favorites (popular teams)
      unders: false // Prefers overs (exciting games)
    }
  },

  // Podcaster - narrative-driven, public opinion
  podcaster: {
    id: 'podcaster',
    name: 'Podcaster',
    weights: {
      numberEdge: 0.2,      // Minimal key number focus
      lineMovement: 0.4,    // Moderate trend following
      priceFriendliness: 0.4 // Heavy on public-friendly prices
    },
    preferences: {
      dogs: false, // Prefers favorites (popular picks)
      unders: false // Prefers overs (entertaining)
    }
  },

  // Pro - sharp bettor, hunts +EV spots
  pro: {
    id: 'pro',
    name: 'Sportsbook Pro',
    weights: {
      numberEdge: 0.5,      // Heavy on key numbers
      lineMovement: 0.3,    // Moderate line movement
      priceFriendliness: 0.2 // Moderate price focus
    },
    preferences: {
      dogs: true,   // Prefers underdogs (value)
      unders: false // No strong total preference
    }
  }
};

/**
 * Get persona config by ID
 */
export function getPersonaConfig(personaId: string): PersonaConfig | null {
  return PERSONA_CONFIGS[personaId] || null;
}

/**
 * Get all persona configs
 */
export function getAllPersonaConfigs(): PersonaConfig[] {
  return Object.values(PERSONA_CONFIGS);
}

/**
 * Validate that persona weights sum to 1.0
 */
export function validatePersonaWeights(config: PersonaConfig): boolean {
  const { numberEdge, lineMovement, priceFriendliness } = config.weights;
  const sum = numberEdge + lineMovement + priceFriendliness;
  return Math.abs(sum - 1.0) < 0.01; // Allow small floating point errors
}

/**
 * Get persona configs with validation
 */
export function getValidatedPersonaConfigs(): PersonaConfig[] {
  return getAllPersonaConfigs().filter(validatePersonaWeights);
}
