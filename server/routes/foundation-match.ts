import { RequestHandler } from "express";

// MAC Foundation shade database with RGB color values
const MAC_FOUNDATIONS = [
  { name: "NC15", rgb: [235, 200, 170], undertone: "neutral-cool" },
  { name: "NC20", rgb: [220, 185, 155], undertone: "neutral-cool" },
  { name: "NC25", rgb: [205, 170, 140], undertone: "neutral-cool" },
  { name: "NC30", rgb: [190, 155, 125], undertone: "neutral-cool" },
  { name: "NC35", rgb: [175, 140, 110], undertone: "neutral-cool" },
  { name: "NC40", rgb: [160, 125, 95], undertone: "neutral-cool" },
  { name: "NC42", rgb: [150, 115, 85], undertone: "neutral-cool" },
  { name: "NC45", rgb: [140, 105, 75], undertone: "neutral-cool" },
  { name: "NC50", rgb: [125, 90, 60], undertone: "neutral-cool" },
  
  { name: "NW15", rgb: [240, 205, 175], undertone: "neutral-warm" },
  { name: "NW20", rgb: [225, 190, 160], undertone: "neutral-warm" },
  { name: "NW25", rgb: [210, 175, 145], undertone: "neutral-warm" },
  { name: "NW30", rgb: [195, 160, 130], undertone: "neutral-warm" },
  { name: "NW35", rgb: [180, 145, 115], undertone: "neutral-warm" },
  { name: "NW40", rgb: [165, 130, 100], undertone: "neutral-warm" },
  { name: "NW43", rgb: [155, 120, 90], undertone: "neutral-warm" },
  { name: "NW45", rgb: [145, 110, 80], undertone: "neutral-warm" },
  { name: "NW50", rgb: [130, 95, 65], undertone: "neutral-warm" },
  
  { name: "C1", rgb: [245, 210, 180], undertone: "cool" },
  { name: "C2", rgb: [230, 195, 165], undertone: "cool" },
  { name: "C3", rgb: [215, 180, 150], undertone: "cool" },
  { name: "C4", rgb: [200, 165, 135], undertone: "cool" },
  { name: "C5", rgb: [185, 150, 120], undertone: "cool" },
  { name: "C6", rgb: [170, 135, 105], undertone: "cool" },
  { name: "C7", rgb: [155, 120, 90], undertone: "cool" },
  { name: "C8", rgb: [140, 105, 75], undertone: "cool" },
  
  { name: "W1", rgb: [250, 215, 185], undertone: "warm" },
  { name: "W2", rgb: [235, 200, 170], undertone: "warm" },
  { name: "W3", rgb: [220, 185, 155], undertone: "warm" },
  { name: "W4", rgb: [205, 170, 140], undertone: "warm" },
  { name: "W5", rgb: [190, 155, 125], undertone: "warm" },
  { name: "W6", rgb: [175, 140, 110], undertone: "warm" },
  { name: "W7", rgb: [160, 125, 95], undertone: "warm" },
  { name: "W8", rgb: [145, 110, 80], undertone: "warm" },
];

// Calculate color distance using Delta E (simplified version)
function calculateColorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  
  // Convert RGB to Lab color space for more accurate color matching
  // This is a simplified version - in production you'd want a more sophisticated algorithm
  const deltaR = r1 - r2;
  const deltaG = g1 - g2;
  const deltaB = b1 - b2;
  
  // Weighted Euclidean distance (gives more weight to differences in red and green)
  return Math.sqrt(2 * deltaR * deltaR + 4 * deltaG * deltaG + 3 * deltaB * deltaB);
}

// Determine undertone based on RGB values
function determineUndertone(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  
  // Simple undertone detection logic
  if (r > g && r > b) {
    return g > b ? "warm" : "neutral-warm";
  } else if (b > r && b > g) {
    return "cool";
  } else {
    return "neutral-cool";
  }
}

export interface FoundationMatchRequest {
  rgb: [number, number, number];
}

export interface FoundationMatchResponse {
  bestMatch: {
    name: string;
    rgb: [number, number, number];
    undertone: string;
    confidence: number;
  };
  alternativeMatches: Array<{
    name: string;
    rgb: [number, number, number];
    undertone: string;
    distance: number;
  }>;
  userUndertone: string;
  recommendations: string[];
}

export const handleFoundationMatch: RequestHandler = (req, res) => {
  try {
    const { rgb } = req.body as FoundationMatchRequest;
    
    if (!rgb || !Array.isArray(rgb) || rgb.length !== 3) {
      return res.status(400).json({ error: "Invalid RGB values provided" });
    }
    
    // Ensure RGB values are within valid range
    const validRgb = rgb.map(value => Math.max(0, Math.min(255, Math.round(value)))) as [number, number, number];
    
    // Calculate distances to all foundation shades
    const matches = MAC_FOUNDATIONS.map(foundation => ({
      ...foundation,
      distance: calculateColorDistance(validRgb, foundation.rgb)
    })).sort((a, b) => a.distance - b.distance);
    
    const bestMatch = matches[0];
    const userUndertone = determineUndertone(validRgb);
    
    // Calculate confidence based on distance (closer = higher confidence)
    const maxDistance = 200; // Approximate max distance for skin tones
    const confidence = Math.max(0, Math.min(100, Math.round((1 - bestMatch.distance / maxDistance) * 100)));
    
    // Get top 3 alternative matches
    const alternativeMatches = matches.slice(1, 4);
    
    // Generate recommendations based on results
    const recommendations = [];
    
    if (confidence < 70) {
      recommendations.push("Consider trying the shade in natural lighting before purchasing");
    }
    
    if (userUndertone !== bestMatch.undertone) {
      recommendations.push(`Your skin appears to have ${userUndertone} undertones, but we matched you with a ${bestMatch.undertone} shade. You might also want to try shades from the ${userUndertone} range.`);
    }
    
    recommendations.push("For best results, test the foundation on your jawline in natural daylight");
    recommendations.push("This project is based on MAC Studio Fix Fluid or Pro Longwear formulations shades. https://www.maccosmetics.in/products/face/foundations");
    
    const response: FoundationMatchResponse = {
      bestMatch: {
        name: bestMatch.name,
        rgb: bestMatch.rgb,
        undertone: bestMatch.undertone,
        confidence
      },
      alternativeMatches: alternativeMatches.map(match => ({
        name: match.name,
        rgb: match.rgb,
        undertone: match.undertone,
        distance: Math.round(match.distance)
      })),
      userUndertone,
      recommendations
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Foundation matching error:', error);
    res.status(500).json({ error: "Internal server error during foundation matching" });
  }
};
