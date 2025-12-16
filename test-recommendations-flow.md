# Comprehensive Test Cases for Restaurant Recommendations Flow

## Test Flow Overview

**Endpoint**: `GET /restaurants/:restaurantId/recommendations`
**Flow**:

1. Validate restaurant exists
2. Get food items for restaurant
3. Get user data
4. Score each item (dietary + interaction + collaborative)
5. Return sorted by score

---

## Test Case Categories

### 1. API Endpoint Tests

#### TC-API-001: Happy Path - Valid Request

**Given**: Valid restaurantId and authenticated user
**When**: GET /restaurants/1/recommendations
**Then**:

- Status: 200 OK
- Returns array of ScoredFoodItemDto
- Items sorted by score (descending)
- Each item has: id, name, description, price, ingredients, rating, score, scoreBreakdown

#### TC-API-002: Restaurant Not Found

**Given**: Non-existent restaurantId (999)
**When**: GET /restaurants/999/recommendations
**Then**:

- Status: 404 Not Found
- Error: "Restaurant with ID 999 not found"

#### TC-API-003: User Not Found

**Given**: Valid restaurantId but invalid userId
**When**: GET /restaurants/1/recommendations (with invalid user)
**Then**:

- Status: 404 Not Found
- Error: "User with ID {userId} not found"

#### TC-API-004: Empty Restaurant Menu

**Given**: Valid restaurant with no food items
**When**: GET /restaurants/1/recommendations
**Then**:

- Status: 200 OK
- Returns empty array []

#### TC-API-005: Invalid Restaurant ID Format

**Given**: Non-numeric restaurantId
**When**: GET /restaurants/abc/recommendations
**Then**:

- Status: 400 Bad Request
- Validation error

---

### 2. Dietary Preference Score Tests

#### TC-DIET-001: Vegetarian User - Meat Item

**Given**:

- User: { dietaryPreferences: ["vegetarian"] }
- Item: { name: "Beef Burger", ingredients: ["beef", "bread"] }
  **When**: Calculate dietary score
  **Then**:
- Score: 0 (hard conflict)
- Reason: Vegetarian cannot have meat

#### TC-DIET-002: Vegetarian User - Vegetarian Item

**Given**:

- User: { dietaryPreferences: ["vegetarian"] }
- Item: { name: "Vegetable Salad", ingredients: ["lettuce", "tomato"] }
  **When**: Calculate dietary score
  **Then**:
- Score: > 5.0 (boosted)
- Reason: Matches vegetarian preference

#### TC-DIET-003: Vegan User - Dairy Item

**Given**:

- User: { dietaryPreferences: ["vegan"] }
- Item: { name: "Cheese Pizza", ingredients: ["cheese", "dough"] }
  **When**: Calculate dietary score
  **Then**:
- Score: 0 (hard conflict)
- Reason: Vegan cannot have dairy

#### TC-DIET-004: Dairy-Free User - Dairy Item

**Given**:

- User: { dietaryPreferences: ["dairy-free"] }
- Item: { name: "Cream Soup", ingredients: ["cream", "chicken"] }
  **When**: Calculate dietary score
  **Then**:
- Score: baseScore \* 0.5 (50% reduction)
- Reason: Soft conflict

#### TC-DIET-005: Gluten-Free User - Gluten Item

**Given**:

- User: { dietaryPreferences: ["gluten-free"] }
- Item: { name: "Wheat Bread", ingredients: ["wheat", "flour"] }
  **When**: Calculate dietary score
  **Then**:
- Score: baseScore \* 0.5 (50% reduction)
- Reason: Soft conflict

#### TC-DIET-006: No Dietary Preferences

**Given**:

- User: { dietaryPreferences: null }
- Item: { name: "Chicken Meal", ingredients: ["chicken", "rice"] }
  **When**: Calculate dietary score
  **Then**:
- Score: baseScore (from rating)
- Reason: No preferences to match

#### TC-DIET-007: Multiple Dietary Preferences

**Given**:

- User: { dietaryPreferences: ["vegetarian", "gluten-free"] }
- Item: { name: "Vegetable Salad", ingredients: ["lettuce", "tomato"] }
  **When**: Calculate dietary score
  **Then**:
- Score: boosted (matches vegetarian, no gluten)
- Reason: Matches all preferences

---

### 3. Ingredient Importance Scoring Tests

#### TC-ING-001: Main Ingredient in Name

**Given**:

- Item: { name: "Fried Chicken with Rice", description: "...", ingredients: ["chicken", "rice"] }
  **When**: Extract ingredients with scores
  **Then**:
- chicken: score = 1.0, role = "main"
- rice: score = 0.2-0.3, role = "accessory"
- Reason: Chicken is first in name, rice is after "with"

#### TC-ING-002: Multiple Main Ingredients

**Given**:

- Item: { name: "Half chicken + kofta meal", description: "...", ingredients: ["chicken", "kofta", "rice"] }
  **When**: Extract ingredients with scores
  **Then**:
- chicken: score = 1.0, role = "main"
- kofta: score = 0.9, role = "main"
- rice: score = 0.2, role = "accessory"
- Reason: Both proteins before "+", rice after "served with"

#### TC-ING-003: "Served With" Pattern

**Given**:

- Item: { name: "Quarter chicken meal", description: "served with rice, bread, sesame paste", ingredients: ["chicken", "rice", "bread", "sesame"] }
  **When**: Extract ingredients with scores
  **Then**:
- chicken: score = 1.0, role = "main"
- rice: score = 0.2, role = "accessory"
- bread: score = 0.2, role = "accessory"
- sesame: score = 0.2, role = "accessory"
- Reason: Everything after "served with" is accessory

#### TC-ING-004: Salad - Main Ingredient

**Given**:

- Item: { name: "Sesame Paste Salad", description: "...", category: "Salad", ingredients: ["sesame", "lettuce"] }
  **When**: Extract ingredients with scores
  **Then**:
- sesame: score = 1.0, role = "main"
- lettuce: score = 0.6, role = "secondary"
- Reason: Sesame is main in salad name

#### TC-ING-005: Soup - First Ingredient Main

**Given**:

- Item: { name: "Mushroom Soup", description: "...", category: "Soup", ingredients: ["mushrooms", "cream", "onion"] }
  **When**: Extract ingredients with scores
  **Then**:
- mushrooms: score = 1.0, role = "main"
- cream: score = 0.5, role = "secondary"
- onion: score = 0.5, role = "secondary"
- Reason: First ingredient in soup name is main

#### TC-ING-006: Side Dish - All Ingredients Main

**Given**:

- Item: { name: "Fried Rice", description: "...", category: "Side Dish", ingredients: ["rice", "eggs", "peas"] }
  **When**: Extract ingredients with scores
  **Then**:
- rice: score = 0.8-1.0, role = "main"
- eggs: score = 0.8, role = "main"
- peas: score = 0.8, role = "main"
- Reason: All ingredients are main in side dish

#### TC-ING-007: Burger - Protein Main, Toppings Secondary

**Given**:

- Item: { name: "Beef Burger with Mushrooms", description: "...", category: "Main Course", ingredients: ["beef", "bread", "mushrooms", "cheese"] }
  **When**: Extract ingredients with scores
  **Then**:
- beef: score = 1.0, role = "main"
- mushrooms: score = 0.3, role = "accessory"
- cheese: score = 0.3, role = "accessory"
- bread: score = 0.4-0.5, role = "secondary"
- Reason: Protein is main, toppings are accessory

---

### 4. Interaction Score Tests (Ingredient Matching)

#### TC-INT-ING-001: Perfect Match - Main Ingredients

**Given**:

- User loved: "Fried Chicken with Rice" (chicken=1.0, rice=0.2)
- Current item: "Grilled Chicken Meal" (chicken=1.0)
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: High (8-10)
- Reason: Main ingredient match with high importance

#### TC-INT-ING-002: Partial Match - Side Ingredient

**Given**:

- User loved: "Fried Chicken with Rice" (chicken=1.0, rice=0.2)
- Current item: "Arabic Rice" (rice=1.0)
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: Low-Medium (2-4)
- Reason: Only side ingredient matches, shouldn't trigger rice recommendations

#### TC-INT-ING-003: Multiple Main Ingredient Matches

**Given**:

- User loved: "Half chicken + kofta meal" (chicken=1.0, kofta=0.9)
- Current item: "Quarter chicken + kofta meal" (chicken=1.0, kofta=0.9)
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: Very High (9-10)
- Reason: Both main ingredients match

#### TC-INT-ING-004: No Past Interactions

**Given**:

- User: No past events
- Current item: "Chicken Meal"
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: 0
- totalScore: 0
- Reason: No history to match

#### TC-INT-ING-005: Recent vs Old Interactions

**Given**:

- User loved (30+ days ago): "Chicken Meal"
- User loved (5 days ago): "Beef Burger"
- Current item: "Chicken Meal"
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: Medium-High
- Reason: Recent interactions weighted 2x, but old still counts

#### TC-INT-ING-006: Multiple Past Items - Weighted Average

**Given**:

- User loved: 3x "Chicken Meal", 1x "Beef Burger"
- Current item: "Chicken Meal"
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: High (chicken appears 3x more)
- Reason: Weighted by frequency

---

### 5. Tag-Based Scoring Tests

#### TC-TAG-001: Exact Tag Match

**Given**:

- User loved: Items with tags ["meal", "chicken"]
- Current item: Tags ["meal", "chicken"]
  **When**: Calculate tag score
  **Then**:
- tagScore: High (8-10)
- combinationBonus: Applied
- Reason: Exact tag combination match

#### TC-TAG-002: Partial Tag Match

**Given**:

- User loved: Items with tags ["meal", "chicken", "grilled"]
- Current item: Tags ["meal", "chicken"]
  **When**: Calculate tag score
  **Then**:
- tagScore: Medium-High (6-8)
- Reason: 2/3 tags match

#### TC-TAG-003: Product Type Match Only

**Given**:

- User loved: Items with tags ["meal", "chicken"]
- Current item: Tags ["meal", "beef"]
  **When**: Calculate tag score
  **Then**:
- tagScore: Medium (5-6)
- Reason: Only product type matches

#### TC-TAG-004: No Tags

**Given**:

- User loved: Items with tags ["meal", "chicken"]
- Current item: Tags []
  **When**: Calculate tag score
  **Then**:
- tagScore: 5.0 (neutral)
- Reason: No tags to match

#### TC-TAG-005: Multi-Tag Bonus

**Given**:

- User loved: Items with tags ["meal", "chicken"]
- Current item: Tags ["meal", "chicken", "grilled", "spicy"]
  **When**: Calculate tag score
  **Then**:
- tagScore: High with bonus
- tagCountBonus: Applied
- Reason: More tags = stronger signal

#### TC-TAG-006: Tag Importance Weights

**Given**:

- User loved: Items with tags ["meal", "chicken", "spicy"]
- Current item: Tags ["meal", "chicken", "spicy"]
  **When**: Calculate tag score
  **Then**:
- "meal" (product type): weight = 1.0
- "chicken" (ingredient): weight = 0.8
- "spicy" (characteristic): weight = 0.5
- Reason: Product types weighted higher

---

### 6. Combined Interaction Score Tests

#### TC-INT-COMB-001: High Ingredient + High Tag Match

**Given**:

- User loved: "Half chicken + kofta meal" (tags: ["meal", "chicken", "combo"])
- Current item: "Quarter chicken meal" (tags: ["meal", "chicken"])
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: High (chicken match)
- tagScore: High (meal + chicken match)
- totalScore: Very High (9-10)
- Formula: (ingredientScore _ 0.6) + (tagScore _ 0.4)

#### TC-INT-COMB-002: High Ingredient + Low Tag Match

**Given**:

- User loved: "Chicken Meal" (tags: ["meal", "chicken"])
- Current item: "Chicken Burger" (tags: ["burger", "chicken"])
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: High (chicken match)
- tagScore: Medium (only chicken tag matches, different product type)
- totalScore: Medium-High (6-7)
- Reason: Ingredient match strong, but different product type

#### TC-INT-COMB-003: Low Ingredient + High Tag Match

**Given**:

- User loved: "Fried Chicken with Rice" (chicken=1.0, rice=0.2, tags: ["meal", "chicken"])
- Current item: "Rice Bowl" (rice=1.0, tags: ["meal"])
  **When**: Calculate interaction score
  **Then**:
- ingredientScore: Low (only rice matches, but it was accessory)
- tagScore: Medium (only "meal" matches)
- totalScore: Low (2-4)
- Reason: Side ingredient shouldn't trigger recommendations

---

### 7. Collaborative Score Tests

#### TC-COLLAB-001: ML Model Available

**Given**:

- ML model exists at ml/model.pkl
- User and item in training data
  **When**: Calculate collaborative score
  **Then**:
- collaborativeScore: ML prediction (0-10)
- Reason: Uses trained model

#### TC-COLLAB-002: ML Model Unavailable

**Given**:

- ML model doesn't exist
  **When**: Calculate collaborative score
  **Then**:
- collaborativeScore: Content-based fallback
- Formula: (dietaryScore + interactionScore) / 2
- Reason: Falls back to content-based

#### TC-COLLAB-003: ML Prediction Fails

**Given**:

- ML model exists but prediction fails
  **When**: Calculate collaborative score
  **Then**:
- collaborativeScore: Content-based fallback
- No error thrown
- Reason: Graceful fallback

---

### 8. Final Score Combination Tests

#### TC-FINAL-001: All Scores High

**Given**:

- dietaryScore: 10
- interactionScore: 10
- collaborativeScore: 10
  **When**: Combine scores
  **Then**:
- finalScore: 10
- Formula: (10 _ 0.1) + (10 _ 0.6) + (10 \* 0.3) = 10

#### TC-FINAL-002: Weighted Combination

**Given**:

- dietaryScore: 5
- interactionScore: 8
- collaborativeScore: 6
  **When**: Combine scores
  **Then**:
- finalScore: (5 _ 0.1) + (8 _ 0.6) + (6 \* 0.3) = 7.1
- Reason: Interaction score weighted 60%

#### TC-FINAL-003: Score Clamping

**Given**:

- dietaryScore: 15 (invalid)
- interactionScore: -5 (invalid)
  **When**: Combine scores
  **Then**:
- finalScore: Clamped to 0-10 range
- Reason: Scores must be 0-10

---

### 9. Edge Cases & Boundary Tests

#### TC-EDGE-001: Empty Ingredients Array

**Given**:

- Item: { ingredients: [] }
  **When**: Extract ingredients with scores
  **Then**:
- Returns empty array
- No errors

#### TC-EDGE-002: Null Category

**Given**:

- Item: { category: null }
  **When**: Extract ingredients with scores
  **Then**:
- Uses linguistic patterns only
- No category-based rules applied

#### TC-EDGE-003: Very Long Name/Description

**Given**:

- Item: { name: "Very long name...", description: "Very long description..." }
  **When**: Process item
  **Then**:
- Handles gracefully
- No performance issues
- Scores calculated correctly

#### TC-EDGE-004: Special Characters in Name

**Given**:

- Item: { name: "Chicken & Rice 🍗", description: "..." }
  **When**: Extract tags/ingredients
  **Then**:
- Handles special characters
- Tags extracted correctly

#### TC-EDGE-005: Duplicate Ingredients

**Given**:

- Item: { ingredients: ["chicken", "chicken", "rice"] }
  **When**: Extract ingredients with scores
  **Then**:
- Duplicates removed
- Each ingredient scored once

#### TC-EDGE-006: Case Insensitive Matching

**Given**:

- Item: { name: "CHICKEN MEAL", ingredients: ["Chicken", "RICE"] }
  **When**: Process item
  **Then**:
- Case-insensitive matching works
- Scores calculated correctly

#### TC-EDGE-007: Missing Optional Fields

**Given**:

- Item: { name: "Item", description: "...", price: null, rating: null }
  **When**: Process item
  **Then**:
- Handles null values gracefully
- Defaults applied

#### TC-EDGE-008: Zero Rating

**Given**:

- Item: { rating: 0 }
  **When**: Calculate dietary score
  **Then**:
- baseScore: 5.0 (default)
- Reason: Rating 0 means no rating, use default

---

### 10. Integration Tests

#### TC-INTEG-001: Complete Flow - New User

**Given**:

- New user (no interactions)
- Restaurant with 10 items
  **When**: GET /restaurants/1/recommendations
  **Then**:
- Returns 10 items sorted by score
- Scores based on dietary preferences + base rating
- interactionScore: 0 for all items

#### TC-INTEG-002: Complete Flow - Active User

**Given**:

- User with 5 past interactions
- Restaurant with 10 items
  **When**: GET /restaurants/1/recommendations
  **Then**:
- Returns 10 items sorted by score
- Items matching past preferences ranked higher
- Detailed breakdowns included

#### TC-INTEG-003: Complete Flow - Multiple Restaurants

**Given**:

- User with preferences
- Different restaurants with different items
  **When**: GET recommendations for each restaurant
  **Then**:
- Each restaurant returns appropriate recommendations
- Scores relative to that restaurant's items

---

### 11. Performance Tests

#### TC-PERF-001: Large Dataset

**Given**:

- Restaurant with 1000 food items
- User with 100 past interactions
  **When**: GET /restaurants/1/recommendations
  **Then**:
- Response time < 5 seconds
- All items scored correctly
- Memory usage reasonable

#### TC-PERF-002: Many Ingredients

**Given**:

- Item with 50 ingredients
  **When**: Extract ingredients with scores
  **Then**:
- Processes in reasonable time
- All ingredients scored

---

### 12. Data Validation Tests

#### TC-DATA-001: Invalid Price Format

**Given**:

- Item: { price: "invalid" }
  **When**: Process item
  **Then**:
- Handles gracefully
- Defaults or error handling

#### TC-DATA-002: Invalid Rating Format

**Given**:

- Item: { rating: "invalid" }
  **When**: Process item
  **Then**:
- Handles gracefully
- Uses default rating

#### TC-DATA-003: SQL Injection Attempt

**Given**:

- restaurantId: "1; DROP TABLE food_items;--"
  **When**: GET /restaurants/{restaurantId}/recommendations
  **Then**:
- Parameter sanitized
- No SQL injection possible

---

## Test Data Mock Examples

### Mock User 1: Vegetarian with History

```json
{
  "id": 1,
  "dietaryPreferences": ["vegetarian"],
  "age": 25,
  "gender": "female",
  "budgetPreference": "medium",
  "events": [
    {
      "id": 1,
      "itemId": 10,
      "eventType": "order",
      "value": 5,
      "createdAt": "2024-12-01T10:00:00Z",
      "foodItem": {
        "id": 10,
        "name": "Vegetable Salad",
        "description": "Fresh vegetables",
        "ingredients": ["lettuce", "tomato", "cucumber"],
        "category": "Salad",
        "tags": ["salad", "vegetarian"]
      }
    }
  ]
}
```

### Mock User 2: Meat Lover

```json
{
  "id": 2,
  "dietaryPreferences": null,
  "age": 30,
  "gender": "male",
  "budgetPreference": "high",
  "events": [
    {
      "id": 2,
      "itemId": 20,
      "eventType": "order",
      "value": 5,
      "createdAt": "2024-12-10T10:00:00Z",
      "foodItem": {
        "id": 20,
        "name": "Half chicken + kofta meal",
        "description": "Half chicken and 3 pieces of kofta, served with rice",
        "ingredients": ["chicken", "kofta", "rice", "bread"],
        "category": "Meal",
        "tags": ["meal", "chicken", "kofta", "combo"]
      }
    }
  ]
}
```

### Mock Food Items

```json
[
  {
    "id": 1,
    "name": "Fried Chicken with Rice",
    "description": "Crispy fried chicken served with rice",
    "ingredients": ["chicken", "rice"],
    "category": "Meal",
    "tags": ["meal", "chicken", "fried"],
    "price": 50,
    "rating": 4.5
  },
  {
    "id": 2,
    "name": "Beef Burger",
    "description": "Juicy beef burger with cheese",
    "ingredients": ["beef", "bread", "cheese"],
    "category": "Main Course",
    "tags": ["burger", "beef"],
    "price": 40,
    "rating": 4.0
  },
  {
    "id": 3,
    "name": "Sesame Paste Salad",
    "description": "Fresh salad with sesame paste",
    "ingredients": ["sesame", "lettuce", "tomato"],
    "category": "Salad",
    "tags": ["salad", "vegetarian"],
    "price": 20,
    "rating": 4.5
  }
]
```

---

## Test Execution Checklist

- [ ] All API endpoint tests pass
- [ ] All dietary preference tests pass
- [ ] All ingredient importance tests pass
- [ ] All interaction score tests pass
- [ ] All tag-based tests pass
- [ ] All combined score tests pass
- [ ] All edge cases handled
- [ ] All integration tests pass
- [ ] Performance acceptable
- [ ] Data validation works
- [ ] Error handling works
- [ ] Score calculations accurate
- [ ] Sorting works correctly
- [ ] Detailed breakdowns included

---

## Expected Test Results Summary

| Category            | Total Tests | Expected Pass | Expected Fail |
| ------------------- | ----------- | ------------- | ------------- |
| API Tests           | 5           | 5             | 0             |
| Dietary Tests       | 7           | 7             | 0             |
| Ingredient Tests    | 7           | 7             | 0             |
| Interaction Tests   | 6           | 6             | 0             |
| Tag Tests           | 6           | 6             | 0             |
| Combined Tests      | 3           | 3             | 0             |
| Collaborative Tests | 3           | 3             | 0             |
| Final Score Tests   | 3           | 3             | 0             |
| Edge Cases          | 8           | 8             | 0             |
| Integration Tests   | 3           | 3             | 0             |
| Performance Tests   | 2           | 2             | 0             |
| Data Validation     | 3           | 3             | 0             |
| **TOTAL**           | **60**      | **60**        | **0**         |


