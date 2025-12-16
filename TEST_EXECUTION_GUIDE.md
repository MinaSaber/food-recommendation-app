# Test Execution Guide

## Overview
This guide provides instructions for running and validating all test cases for the restaurant recommendations flow.

## Prerequisites
1. Install dependencies: `npm install`
2. Set up test database (if using integration tests)
3. Ensure Prisma client is generated: `npx prisma generate`

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm test

# Run specific test file
npm test restaurant-recommendations.service.spec.ts

# Run with coverage
npm test -- --coverage
```

### Integration Tests
```bash
# Run integration tests (requires test database)
npm run test:e2e
```

### Manual Testing via API
```bash
# Start the application
npm run start:dev

# Test endpoint (requires authentication token)
curl -X GET http://localhost:3000/restaurants/1/recommendations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Test Case Validation Checklist

### ✅ API Endpoint Tests
- [ ] TC-API-001: Valid request returns sorted recommendations
- [ ] TC-API-002: Restaurant not found returns 404
- [ ] TC-API-003: User not found returns 404
- [ ] TC-API-004: Empty menu returns empty array
- [ ] TC-API-005: Invalid ID format returns 400

### ✅ Dietary Preference Tests
- [ ] TC-DIET-001: Vegetarian user with meat item = 0 score
- [ ] TC-DIET-002: Vegetarian user with vegetarian item = boosted
- [ ] TC-DIET-003: Vegan user with dairy item = 0 score
- [ ] TC-DIET-004: Dairy-free user with dairy item = reduced score
- [ ] TC-DIET-005: Gluten-free user with gluten item = reduced score
- [ ] TC-DIET-006: No preferences = base score
- [ ] TC-DIET-007: Multiple preferences = combined logic

### ✅ Ingredient Importance Tests
- [ ] TC-ING-001: Main ingredient in name = 1.0 score
- [ ] TC-ING-002: Multiple main ingredients scored correctly
- [ ] TC-ING-003: "Served with" items = accessory (0.2-0.3)
- [ ] TC-ING-004: Salad main ingredient = 1.0
- [ ] TC-ING-005: Soup first ingredient = 1.0
- [ ] TC-ING-006: Side dish all ingredients = main (0.8-1.0)
- [ ] TC-ING-007: Burger protein main, toppings accessory

### ✅ Interaction Score Tests
- [ ] TC-INT-ING-001: Main ingredient match = high score
- [ ] TC-INT-ING-002: Side ingredient match = low score
- [ ] TC-INT-ING-003: Multiple main matches = very high
- [ ] TC-INT-ING-004: No interactions = 0 score
- [ ] TC-INT-ING-005: Recent vs old interactions weighted
- [ ] TC-INT-ING-006: Multiple items weighted average

### ✅ Tag-Based Tests
- [ ] TC-TAG-001: Exact tag match = high score
- [ ] TC-TAG-002: Partial tag match = medium-high
- [ ] TC-TAG-003: Product type match only = medium
- [ ] TC-TAG-004: No tags = neutral (5.0)
- [ ] TC-TAG-005: Multi-tag bonus applied
- [ ] TC-TAG-006: Tag importance weights correct

### ✅ Combined Score Tests
- [ ] TC-INT-COMB-001: High ingredient + high tag = very high
- [ ] TC-INT-COMB-002: High ingredient + low tag = medium-high
- [ ] TC-INT-COMB-003: Low ingredient + high tag = low

### ✅ Collaborative Score Tests
- [ ] TC-COLLAB-001: ML model available = ML prediction
- [ ] TC-COLLAB-002: ML unavailable = content-based fallback
- [ ] TC-COLLAB-003: ML fails = graceful fallback

### ✅ Final Score Tests
- [ ] TC-FINAL-001: All scores high = 10
- [ ] TC-FINAL-002: Weighted combination correct
- [ ] TC-FINAL-003: Score clamping works (0-10)

### ✅ Edge Cases
- [ ] TC-EDGE-001: Empty ingredients array
- [ ] TC-EDGE-002: Null category
- [ ] TC-EDGE-003: Very long name/description
- [ ] TC-EDGE-004: Special characters
- [ ] TC-EDGE-005: Duplicate ingredients
- [ ] TC-EDGE-006: Case insensitive matching
- [ ] TC-EDGE-007: Missing optional fields
- [ ] TC-EDGE-008: Zero rating

### ✅ Integration Tests
- [ ] TC-INTEG-001: Complete flow - new user
- [ ] TC-INTEG-002: Complete flow - active user
- [ ] TC-INTEG-003: Complete flow - multiple restaurants

## Expected Results

### Score Ranges
- **Dietary Score**: 0-10 (0 = conflict, 10 = perfect match)
- **Interaction Score**: 0-10 (0 = no history, 10 = perfect match)
- **Collaborative Score**: 0-10 (ML prediction or fallback)
- **Final Score**: 0-10 (weighted combination)

### Score Weights
- Dietary: 10%
- Interaction: 60%
- Collaborative: 30%

### Ingredient Score Ranges
- **Main ingredients**: 0.8-1.0
- **Secondary ingredients**: 0.4-0.7
- **Accessory ingredients**: 0.1-0.3

### Tag Score Ranges
- **Exact match**: 8-10
- **Partial match**: 5-8
- **Product type only**: 4-6
- **No match**: 5.0 (neutral)

## Debugging Tips

1. **Check score breakdowns**: Each item should have detailed `scoreBreakdown`
2. **Verify ingredient scores**: Check `interactionScoreBreakdown.ingredientMatches`
3. **Verify tag matches**: Check `interactionScoreBreakdown.tagMatches`
4. **Check reasoning**: Ingredient scores include `reasoning` array
5. **Validate sorting**: Items should be sorted by `score` descending

## Common Issues

### Issue: Scores are all 0
**Cause**: No user interactions or dietary conflicts
**Solution**: Add test events or check dietary preferences

### Issue: Scores are all the same
**Cause**: All items have same characteristics
**Solution**: Use diverse test data

### Issue: Wrong item ranked first
**Cause**: Score calculation issue
**Solution**: Check individual score components in breakdown

### Issue: Performance slow
**Cause**: Too many items or complex calculations
**Solution**: Optimize or add pagination

## Test Data Files

- `test-data/mock-test-data.ts`: Comprehensive mock data
- Use this data for consistent testing across all scenarios

## Next Steps

1. Run all unit tests
2. Run integration tests
3. Perform manual API testing
4. Validate score calculations
5. Check edge cases
6. Performance testing
7. Document any issues found



