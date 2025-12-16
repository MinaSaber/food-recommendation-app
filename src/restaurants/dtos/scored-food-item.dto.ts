export class IngredientScoreDto {
  name: string;
  score: number; // 0.0 to 1.0 (importance weight)
  role: 'main' | 'secondary' | 'accessory';
}

export class TagScoreDto {
  tag: string;
  matched: boolean;
  weight: number;
}

export class InteractionScoreBreakdownDto {
  ingredientScore: number;
  tagScore: number;
  ingredientMatches: IngredientScoreDto[];
  tagMatches: TagScoreDto[];
  combinationBonus: number;
  totalScore: number;
}

export class ScoreBreakdownDto {
  dietaryPreferenceScore: number;
  interactionScore: number;
  interactionScoreBreakdown?: InteractionScoreBreakdownDto;
  collaborativeScore: number;
}

export class ScoredFoodItemDto {
  id: number;
  name: string;
  description: string;
  price: number;
  ingredients: string[];
  rating: number;
  score: number;
  scoreBreakdown: ScoreBreakdownDto;
}
