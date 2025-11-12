import json
import sys
import os
import pickle
import numpy as np
from lightfm import LightFM

# ---------- Load Model ----------
script_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(script_dir, "model.pkl")

if not os.path.exists(MODEL_PATH):
    print("❌ Model not found. Please train it first.", file=sys.stderr)
    sys.exit(1)

with open(MODEL_PATH, "rb") as f:
    model, dataset = pickle.load(f)

# ---------- Get Inputs ----------
if len(sys.argv) < 3:
    print("Usage: python predict.py <user_id> '<food_items_json_array>'", file=sys.stderr)
    sys.exit(1)

user_id_input = sys.argv[1]
food_items = json.loads(sys.argv[2])

if not isinstance(food_items, list):
    print("❌ Input must be a JSON array of food items.", file=sys.stderr)
    sys.exit(1)

# ---------- Get Internal Mappings ----------
# Access the private mappings directly
user_id_mapping = dataset._user_id_mapping  # {internal_id: original_id}
item_id_mapping = dataset._item_id_mapping  # {internal_id: original_id}

# Reverse mappings: {original_id: internal_id}
# Handle both string and int IDs
user_str_to_internal = {}
for internal_id, original_id in user_id_mapping.items():
    # Store both string and int versions if needed
    user_str_to_internal[str(original_id)] = internal_id
    if isinstance(original_id, int):
        user_str_to_internal[original_id] = internal_id

item_str_to_internal = {}
for internal_id, original_id in item_id_mapping.items():
    item_str_to_internal[str(original_id)] = internal_id
    if isinstance(original_id, int):
        item_str_to_internal[original_id] = internal_id

# Try both string and int versions of user_id
user_id_str = str(user_id_input)
user_id_int = None
try:
    user_id_int = int(user_id_input)
except ValueError:
    pass

# Check if user exists in training data (try both string and int)
user_internal_id = None
if user_id_str in user_str_to_internal:
    user_internal_id = user_str_to_internal[user_id_str]
elif user_id_int is not None and user_id_int in user_str_to_internal:
    user_internal_id = user_str_to_internal[user_id_int]

if user_internal_id is None:
    available_users = list(user_str_to_internal.keys())[:10]
    print(f"❌ User ID '{user_id_input}' not found in training data.", file=sys.stderr)
    print(f"   Available user IDs (sample): {available_users}", file=sys.stderr)
    print(f"   Total users in mapping: {len(user_str_to_internal)}", file=sys.stderr)
    sys.exit(1)

# ---------- Build Item Features for All Items ----------
item_tuples = []
known_features = set(dataset._item_feature_mapping.keys())
item_internal_ids = []
valid_items = []

for item in food_items:
    item_id_str = str(item["id"])
    
    # Only process items that exist in training data
    if item_id_str not in item_str_to_internal:
        print(f"⚠️  Warning: Item ID {item_id_str} not in training data, skipping...", file=sys.stderr)
        continue
    
    category = item.get("category", "Unknown")
    ingredients = item.get("ingredients", [])
    
    # Remove rating feature since it's not used in training
    features = [f"category:{category}"] + [f"ingredient:{ing}" for ing in ingredients]
    
    # Filter out features that are not in dataset mapping
    valid_features = [f for f in features if f in known_features]
    
    if not valid_features:
        valid_features = ["category:Unknown"]
    
    item_tuples.append((item_id_str, valid_features))
    item_internal_ids.append(item_str_to_internal[item_id_str])
    valid_items.append(item)

if not item_internal_ids:
    print("❌ No valid items to predict for.", file=sys.stderr)
    sys.exit(1)

item_features = dataset.build_item_features(item_tuples)

# ---------- Predict ----------
# Use internal IDs for prediction
scores = model.predict(
    user_ids=[user_internal_id] * len(item_internal_ids),
    item_ids=item_internal_ids,
    item_features=item_features
)

# ---------- Output ----------
results = []
for item, score in zip(valid_items, scores):
    results.append({
        "user_id": user_id_str,
        "food_item_id": item["id"],
        "name": item.get("name"),
        "predicted_score": float(score)
    })

print(json.dumps(results, indent=2))
