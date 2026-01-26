import { useMemo } from 'react';
import type { Target, Profile, TargetWithProfile } from '../lib/types';

interface MatchScore {
  target: Target;
  score: number;
  reasons: string[];
}

interface MatchOptions {
  minScore?: number;
  limit?: number;
  sortBy?: 'score' | 'date' | 'budget';
}

// Mapping between categories and business sectors (can be extended)
const CATEGORY_SECTOR_MAP: Record<string, string[]> = {
  'Elettronica': ['Elettronica e Tecnologia'],
  'Moda e Abbigliamento': ['Moda e Abbigliamento'],
  'Casa e Giardino': ['Casa e Arredamento'],
  'Casa e Arredamento': ['Casa e Arredamento'],
  'Sport e Tempo Libero': ['Sport e Fitness'],
  'Auto e Moto': ['Auto e Moto'],
  'Servizi Professionali': ['Servizi Professionali'],
  'Immobiliare': ['Immobiliare'],
  'Lavoro': ['Servizi Professionali'],
  'Ristorazione e Food': ['Ristorazione e Food'],
  'Bellezza e Benessere': ['Bellezza e Benessere'],
  'Altro': ['Altro'],
};

// Helper to normalize location (city/region)
function normalizeLocation(location: string): string {
  return location.toLowerCase().trim();
}

// Helper to check if locations match (same city or region)
function locationsMatch(loc1: string, loc2: string): boolean {
  const norm1 = normalizeLocation(loc1);
  const norm2 = normalizeLocation(loc2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // One contains the other (e.g., "Milano" matches "Milano, Lombardia")
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  return false;
}

// Helper to check if category matches seller's primary sector
function categoryMatchesSector(category: string, sector: string | null): boolean {
  if (!sector) return false;
  
  // Direct match (exact)
  if (category === sector) return true;
  
  // Check mapping for flexible matching
  const mappedSectors = CATEGORY_SECTOR_MAP[category] || [];
  return mappedSectors.some((s) => 
    sector.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(sector.toLowerCase())
  );
}

// Helper to extract region from location
function getRegionFromLocation(location: string): string {
  const loc = normalizeLocation(location);
  
  // Check for major cities and map to regions
  const regionMap: Record<string, string> = {
    'milano': 'Lombardia',
    'roma': 'Lazio',
    'napoli': 'Campania',
    'torino': 'Piemonte',
    'palermo': 'Sicilia',
    'genova': 'Liguria',
    'bologna': 'Emilia-Romagna',
    'firenze': 'Toscana',
    'bari': 'Puglia',
    'venezia': 'Veneto',
    'verona': 'Veneto',
    'padova': 'Veneto',
  };
  
  for (const [city, region] of Object.entries(regionMap)) {
    if (loc.includes(city)) return region;
  }
  
  // Try direct region match
  const regions = ['Lombardia', 'Lazio', 'Campania', 'Piemonte', 'Sicilia', 'Liguria', 
    'Emilia-Romagna', 'Toscana', 'Puglia', 'Veneto', 'Calabria', 'Sardegna', 'Abruzzo'];
  
  for (const region of regions) {
    if (loc.includes(region.toLowerCase())) return region;
  }
  
  return loc; // Fallback to location itself
}

// Helper to check if regions match
function regionsMatch(loc1: string, loc2: string): boolean {
  const region1 = getRegionFromLocation(loc1);
  const region2 = getRegionFromLocation(loc2);
  return region1 === region2;
}

/**
 * Calculate match score between a seller and a buyer request (target)
 * Based on predictive matching logic:
 * - Category Match: 50 points (Fundamental)
 * - Region Match: 30 points (Geographic asset)
 * - Budget Match: 20 points (Within seller's operating range?)
 * 
 * @param seller - Seller profile
 * @param buyerRequest - Buyer target/request
 * @returns Match score (0-100) and reasons
 */
export function calculateMatchScore(
  seller: Profile,
  buyerRequest: Target
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Match per Categoria (Fondamentale) - 50 points
  if (categoryMatchesSector(buyerRequest.category, seller.primary_sector)) {
    score += 50;
    reasons.push(`✓ Categoria corrispondente: ${buyerRequest.category}`);
  }

  // 2. Match per Regione (Asset geografico) - 30 points
  if (regionsMatch(seller.city, buyerRequest.location)) {
    score += 30;
    reasons.push(`✓ Stessa regione geografica`);
  } else if (locationsMatch(seller.city, buyerRequest.location)) {
    // Partial credit for same city even if region doesn't match exactly
    score += 20;
    reasons.push(`✓ Stessa località`);
  }

  // 3. Match per Budget (Rientra nel range del venditore?) - 20 points
  // Note: Since we don't have minPrice/maxPrice in seller profile,
  // we give points if budget exists and is reasonable
  if (buyerRequest.budget) {
    // Give full points if budget exists (seller can evaluate if it fits their range)
    score += 20;
    reasons.push(`✓ Budget disponibile: €${buyerRequest.budget.toLocaleString()}`);
  }
  // Note: If you add minPrice/maxPrice to Profile, you can check:
  // if (buyerRequest.budget >= seller.minPrice && buyerRequest.budget <= seller.maxPrice)
  
  return {
    score: Math.min(score, 100), // Ensure max 100
    reasons,
  };
}

// Find best matching targets for a seller
export function findMatchingTargets(
  seller: Profile,
  targets: TargetWithProfile[],
  options: MatchOptions = {}
): MatchScore[] {
  const { minScore = 20, limit = 50, sortBy = 'score' } = options;

  const matches: MatchScore[] = targets
    .map((target) => {
      const { score, reasons } = calculateMatchScore(seller, target);
      return {
        target,
        score,
        reasons,
      };
    })
    .filter((match) => match.score >= minScore);

  // Sort matches
  matches.sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return (
          new Date(b.target.created_at).getTime() -
          new Date(a.target.created_at).getTime()
        );
      case 'budget':
        const budgetA = a.target.budget || 0;
        const budgetB = b.target.budget || 0;
        return budgetB - budgetA;
      case 'score':
      default:
        return b.score - a.score;
    }
  });

  return matches.slice(0, limit);
}

// Find best matching sellers for a target
export function findMatchingSellers(
  target: Target,
  sellers: Profile[]
): Array<{ seller: Profile; score: number; reasons: string[] }> {
  const matches = sellers
    .filter((seller) => seller.role === 'seller')
    .map((seller) => {
      const { score, reasons } = calculateMatchScore(seller, target);
      return {
        seller,
        score,
        reasons,
      };
    })
    .filter((match) => match.score >= 20)
    .sort((a, b) => b.score - a.score);

  return matches;
}

// React hook for matching engine
export function useMatchingEngine(
  seller: Profile | null,
  targets: TargetWithProfile[]
) {
  const matchingTargets = useMemo(() => {
    if (!seller || seller.role !== 'seller' || targets.length === 0) {
      return [];
    }

    return findMatchingTargets(seller, targets, {
      minScore: 30,
      limit: 100,
      sortBy: 'score',
    });
  }, [seller, targets]);

  const topMatches = useMemo(() => {
    return matchingTargets.slice(0, 10);
  }, [matchingTargets]);

  const matchesByCategory = useMemo(() => {
    const categoryMap = new Map<string, MatchScore[]>();
    
    matchingTargets.forEach((match) => {
      const category = match.target.category;
      const existing = categoryMap.get(category) || [];
      categoryMap.set(category, [...existing, match]);
    });

    return Array.from(categoryMap.entries()).map(([category, matches]) => ({
      category,
      matches,
      avgScore: matches.reduce((sum, m) => sum + m.score, 0) / matches.length,
      count: matches.length,
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [matchingTargets]);

  return {
    matchingTargets,
    topMatches,
    matchesByCategory,
    totalMatches: matchingTargets.length,
  };
}
