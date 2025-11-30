import json
import sys
import os
import pickle
import numpy as np
from lightfm import LightFM

# ---------- Load Model ----------
script_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(script_dir, "model.pkl")

model = None
dataset = None
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, "rb") as f:
        model, dataset = pickle.load(f)

# ---------- Get Inputs ----------
if len(sys.argv) < 3:
    print("Usage: python predict.py <user_id_or_null> '<food_items_json_array>' '<user_features_json_or_null>'", file=sys.stderr)
    sys.exit(1)

user_id_input = sys.argv[1] if sys.argv[1] != "null" else None
food_items = json.loads(sys.argv[2])
user_features_input = json.loads(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] != "null" else None

# Debug: Print what we received (only if user_features provided)
if user_features_input:
    print(f"DEBUG: user_id_input={user_id_input}, user_features={json.dumps(user_features_input)}", file=sys.stderr)

if not isinstance(food_items, list):
    print("❌ Input must be a JSON array of food items.", file=sys.stderr)
    sys.exit(1)

# ---------- Content-Based Scoring Function (for items not in training or new users) ----------
def score_item_content_based(item, user_features):
    """
    Score items based on:
    1. Baseline score (item rating)
    2. Dietary preferences matching
    3. Preferred ingredients from past interactions
    """
    # Start with baseline score from item rating (scale 0-10)
    baseline_score = 5.0  # Default baseline (middle of 0-10 scale)
    if item.get("rating") is not None:
        try:
            rating = item.get("rating")
            # Handle Decimal types from database
            if hasattr(rating, '__float__'):
                rating = float(rating)
            else:
                rating = float(rating)
            if rating > 0:
                # Convert 0-5 rating to 0-10 scale
                baseline_score = min(10.0, max(0.0, rating * 2.0))
        except (ValueError, TypeError):
            pass
    
    score = baseline_score
    
    # If no user features, return baseline score
    if not user_features:
        return max(0.0, min(10.0, score))  # Clamp to 0-10
    
    # Get item data for searching
    item_ingredients = []
    if item.get("ingredients"):
        item_ingredients = [str(ing).lower() for ing in item.get("ingredients", [])]
    
    # Create searchable text from ingredients, name, and description
    item_name = str(item.get("name", "")).lower()
    item_description = str(item.get("description", "")).lower()
    ingredients_text = " ".join(item_ingredients) if item_ingredients else ""
    searchable_text = f"{ingredients_text} {item_name} {item_description}".strip()
    
    # 1. Dietary preferences matching
    dietary_prefs = user_features.get("dietary_preferences", [])
    
    if dietary_prefs:
        vegetarian_keywords = ["vegetarian", "vegan"]
        meat_keywords = ["chicken", "beef", "pork", "lamb", "duck", "turkey", "meat", "fish", "seafood", "turkey"]
        dairy_keywords = ["milk", "cheese", "butter", "cream", "yogurt", "dairy", "cheddar"]
        gluten_keywords = ["wheat", "flour", "bread", "pasta", "gluten"]
        
        is_vegetarian = any(pref.lower() in vegetarian_keywords for pref in dietary_prefs)
        is_vegan = any("vegan" in pref.lower() for pref in dietary_prefs)
        is_dairy_free = any("dairy-free" in pref.lower() or "dairy_free" in pref.lower() for pref in dietary_prefs)
        is_gluten_free = any("gluten-free" in pref.lower() or "gluten_free" in pref.lower() for pref in dietary_prefs)
        
        # Check for conflicts in searchable text (ingredients, name, description)
        has_meat = any(meat in searchable_text for meat in meat_keywords)
        has_dairy = any(dairy in searchable_text for dairy in dairy_keywords)
        has_gluten = any(gluten in searchable_text for gluten in gluten_keywords)
        
        # Penalize conflicts (reduce score proportionally based on baseline)
        conflict_penalty_ratio = 0.2  # Reduce to 20% of original score for major conflicts
        minor_penalty_ratio = 0.5  # Reduce to 50% for minor conflicts
        
        if (is_vegetarian or is_vegan) and has_meat:
            score = baseline_score * conflict_penalty_ratio  # Heavy penalty, but based on item's rating
        
        if is_vegan and has_dairy:
            score = baseline_score * conflict_penalty_ratio  # Heavy penalty for dairy in vegan diet
        
        if is_dairy_free and has_dairy:
            score = baseline_score * minor_penalty_ratio  # Moderate penalty for dairy
        
        if is_gluten_free and has_gluten:
            score = baseline_score * minor_penalty_ratio  # Moderate penalty for gluten
        
        # Bonus for matching preferences (only if no conflicts, scale with baseline)
        bonus_multiplier = 1.3  # 30% boost for matches
        if is_vegetarian and not has_meat:
            score = baseline_score * bonus_multiplier  # Boost based on item's rating
        if is_vegan and not has_meat and not has_dairy:
            score = baseline_score * 1.4  # 40% boost for vegan-friendly
        if is_dairy_free and not has_dairy:
            score = baseline_score * 1.2  # 20% boost for dairy-free
        if is_gluten_free and not has_gluten:
            score = baseline_score * 1.2  # 20% boost for gluten-free
    
    # 2. Preferred ingredients matching (from past interactions)
    # Scale bonus based on baseline score
    preferred_ingredients = user_features.get("preferred_ingredients", [])
    if preferred_ingredients and item_ingredients:
        matching_ingredients = sum(
            1 for pref_ing in preferred_ingredients
            if any(pref_ing.lower() in ing or ing in pref_ing.lower() for ing in item_ingredients)
        )
        if matching_ingredients > 0:
            match_ratio = matching_ingredients / max(len(preferred_ingredients), 1)
            # Add bonus proportional to baseline (up to 30% boost)
            ingredient_bonus = baseline_score * match_ratio * 0.3
            score = min(10.0, score + ingredient_bonus)
    
    # Clamp final score to 0-10 range
    return max(0.0, min(10.0, score))

# ---------- Get Internal Mappings (if model exists) ----------
user_str_to_internal = {}
item_str_to_internal = {}
known_features = set()

if dataset:
    user_id_mapping = dataset._user_id_mapping
    item_id_mapping = dataset._item_id_mapping
    
    for internal_id, original_id in user_id_mapping.items():
        user_str_to_internal[str(original_id)] = internal_id
        if isinstance(original_id, int):
            user_str_to_internal[original_id] = internal_id
    
    for internal_id, original_id in item_id_mapping.items():
        item_str_to_internal[str(original_id)] = internal_id
        if isinstance(original_id, int):
            item_str_to_internal[original_id] = internal_id
    
    known_features = set(dataset._item_feature_mapping.keys())

# ---------- Handle User (Known or New) ----------
user_internal_id = None
user_features = None
is_new_user = False
use_ml_model = False

if user_id_input and user_id_input != "null" and dataset:
    # Known user - try to find in training data
    user_id_str = str(user_id_input)
    user_id_int = None
    try:
        user_id_int = int(user_id_input)
    except ValueError:
        pass
    
    if user_id_str in user_str_to_internal:
        user_internal_id = user_str_to_internal[user_id_str]
        use_ml_model = True
    elif user_id_int is not None and user_id_int in user_str_to_internal:
        user_internal_id = user_str_to_internal[user_id_int]
        use_ml_model = True
    
    if not use_ml_model:
        # User not found, treat as new user with features
        is_new_user = True
else:
    # No userId provided, must be new user
    is_new_user = True

# Always set user features if provided (needed for content-based scoring of items not in training)
user_features = None
if user_features_input:
    user_features = user_features_input

# ---------- Score All Items ----------
results = []

for item in food_items:
    item_id_str = str(item["id"])
    score = 0.0
    use_ml_for_item = False
    
    # Try to use ML model if available and item is in training data
    if model and dataset and item_id_str in item_str_to_internal and use_ml_model:
        try:
            # Build item features
            category = item.get("category", "Unknown")
            ingredients = item.get("ingredients", [])
            features = [f"category:{category}"] + [f"ingredient:{ing}" for ing in ingredients]
            valid_features = [f for f in features if f in known_features]
            
            if not valid_features:
                valid_features = ["category:Unknown"]
            
            item_features = dataset.build_item_features([(item_id_str, valid_features)])
            item_internal_id = item_str_to_internal[item_id_str]
            
            # Predict using ML model
            ml_score = model.predict(
                user_ids=[user_internal_id],
                item_ids=[item_internal_id],
                item_features=item_features
            )[0]
            
            score = float(ml_score)
            use_ml_for_item = True
        except Exception as e:
            # Fall back to content-based if ML fails
            print(f"⚠️  Warning: ML prediction failed for item {item_id_str}, using content-based: {str(e)}", file=sys.stderr)
            use_ml_for_item = False
    
    # Use content-based scoring if:
    # 1. Item not in training data
    # 2. User not in training data
    # 3. ML model not available
    # 4. ML prediction failed
    if not use_ml_for_item:
        score = score_item_content_based(item, user_features)
    
    results.append({
        "food_item_id": item["id"],
        "name": item.get("name"),
        "predicted_score": score
    })

if not results:
    print("❌ No items to score.", file=sys.stderr)
    sys.exit(1)

print(json.dumps(results, indent=2))
