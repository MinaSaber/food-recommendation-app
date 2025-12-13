import pandas as pd
import numpy as np
import pickle
import os
import sys
from datetime import datetime

try:
    from lightfm import LightFM
    from lightfm.data import Dataset
except ImportError as e:
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
    error_msg = (
        f"❌ Error: lightfm is not installed\n"
        f"   Current Python version: {python_version}\n"
        f"   Solutions:\n"
        f"   1. Install rectools-lightfm (recommended): pip install rectools-lightfm\n"
        f"   2. Or install lightfm: pip install lightfm (may require python{python_version}-dev)\n"
        f"   3. Use an alternative recommendation library"
    )
    print(error_msg, file=sys.stderr)
    sys.exit(1)

# --- Logging Helper ---
def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}", file=sys.stdout)

def log_error(message):
    log(message, "ERROR")
    print(message, file=sys.stderr)

# --- Load Data ---
def load_data():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Training files are in the parent directory (project root)
    data_dir = os.path.join(script_dir, "..")
    
    # Required data files
    required_files = {
        "users": "training_users.json",
        "foods": "training_food_items.json",
        "restaurants": "training_restaurants.json",
        "events": "training_events.json"
    }
    
    # Check file existence
    log("Checking for required data files...")
    for name, filename in required_files.items():
        filepath = os.path.join(data_dir, filename)
        if not os.path.exists(filepath):
            log_error(f"❌ Required file not found: {filepath}")
            sys.exit(1)
        log(f"✓ Found {filename}")
    
    # Load data files
    log("Loading data files...")
    try:
        users = pd.read_json(os.path.join(data_dir, required_files["users"]))
        foods = pd.read_json(os.path.join(data_dir, required_files["foods"]))
        restaurants = pd.read_json(os.path.join(data_dir, required_files["restaurants"]))
        events = pd.read_json(os.path.join(data_dir, required_files["events"]))
        
        log(f"✓ Loaded {len(users)} users")
        log(f"✓ Loaded {len(foods)} food items")
        log(f"✓ Loaded {len(restaurants)} restaurants")
        log(f"✓ Loaded {len(events)} events")
        
    except Exception as e:
        log_error(f"❌ Error loading data files: {str(e)}")
        sys.exit(1)
    
    # Validate data is not empty
    if users.empty:
        log_error("❌ Users data is empty. Cannot train model.")
        sys.exit(1)
    
    if foods.empty:
        log_error("❌ Food items data is empty. Cannot train model.")
        sys.exit(1)
    
    if events.empty:
        log_error("❌ Events data is empty. Cannot train model.")
        sys.exit(1)
    
    # Process events
    events["value"] = pd.to_numeric(events["value"], errors="coerce").fillna(0)
    
    return users, foods, restaurants, events


log("=" * 60)
log("Starting model training process")
log("=" * 60)

users_df, food_df, restaurants_df, events_df = load_data()

# --- Build Dataset ---
log("Building dataset and extracting features...")
dataset = Dataset()

all_item_features = set()
all_user_features = set()

for _, row in food_df.iterrows():
    # Add category
    all_item_features.add(f"category:{row['category']}")
    # Add ingredients
    for ing in row["ingredients"]:
        all_item_features.add(f"ingredient:{ing}")

log(f"✓ Extracted {len(all_item_features)} unique item features")

# Extract user features
for _, row in users_df.iterrows():
    # Add dietary preferences
    prefs = row.get("dietary_preferences")
    if prefs is not None and not (isinstance(prefs, float) and pd.isna(prefs)):
        if isinstance(prefs, list) and len(prefs) > 0:
            for pref in prefs:
                all_user_features.add(f"dietary:{pref}")
        elif isinstance(prefs, str) and prefs:
            all_user_features.add(f"dietary:{prefs}")
    
    # Add budget preference
    budget = row.get("budget_preference")
    if budget is not None and not (isinstance(budget, float) and pd.isna(budget)):
        all_user_features.add(f"budget:{budget}")
    
    # Add gender
    gender = row.get("gender")
    if gender is not None and not (isinstance(gender, float) and pd.isna(gender)):
        all_user_features.add(f"gender:{gender}")
    
    # Add age bucket (group ages into ranges)
    age_val = row.get("age")
    if age_val is not None and not (isinstance(age_val, float) and pd.isna(age_val)):
        try:
            age = int(age_val)
            if age < 25:
                all_user_features.add("age:18-24")
            elif age < 35:
                all_user_features.add("age:25-34")
            elif age < 45:
                all_user_features.add("age:35-44")
            elif age < 55:
                all_user_features.add("age:45-54")
            else:
                all_user_features.add("age:55+")
        except (ValueError, TypeError):
            pass

log(f"✓ Extracted {len(all_user_features)} unique user features")

unique_users = users_df["id"].astype(str).unique()
unique_items = food_df["id"].astype(str).unique()

log(f"✓ Found {len(unique_users)} unique users")
log(f"✓ Found {len(unique_items)} unique items")

dataset.fit(
    users=unique_users,
    items=unique_items,
    item_features=list(all_item_features),
    user_features=list(all_user_features)  # Add user features
)
log("✓ Dataset fitted successfully")

log("Building item features matrix...")
item_features = dataset.build_item_features([
    (
        str(row["id"]),
        [f"category:{row['category']}"]
        + [f"ingredient:{ing}" for ing in row["ingredients"]]
    )
    for _, row in food_df.iterrows()
])
log("✓ Item features matrix built")

# Build user features matrix
log("Building user features matrix...")
user_features_list = []
for _, row in users_df.iterrows():
    features = []
    
    # Add dietary preferences
    prefs = row.get("dietary_preferences")
    if prefs is not None and not (isinstance(prefs, float) and pd.isna(prefs)):
        if isinstance(prefs, list) and len(prefs) > 0:
            features.extend([f"dietary:{pref}" for pref in prefs])
        elif isinstance(prefs, str) and prefs:
            features.append(f"dietary:{prefs}")
    
    # Add budget preference
    budget = row.get("budget_preference")
    if budget is not None and not (isinstance(budget, float) and pd.isna(budget)):
        features.append(f"budget:{budget}")
    
    # Add gender
    gender = row.get("gender")
    if gender is not None and not (isinstance(gender, float) and pd.isna(gender)):
        features.append(f"gender:{gender}")
    
    # Add age bucket
    age_val = row.get("age")
    if age_val is not None and not (isinstance(age_val, float) and pd.isna(age_val)):
        try:
            age = int(age_val)
            if age < 25:
                features.append("age:18-24")
            elif age < 35:
                features.append("age:25-34")
            elif age < 45:
                features.append("age:35-44")
            elif age < 55:
                features.append("age:45-54")
            else:
                features.append("age:55+")
        except (ValueError, TypeError):
            pass
    
    user_features_list.append((str(row["id"]), features))

user_features = dataset.build_user_features(user_features_list)
log("✓ User features matrix built")

# Filter events to only include item_ids that exist in food_df
log("Processing interactions...")
valid_item_ids = set(food_df["id"].astype(str))
valid_events = events_df[events_df["item_id"].astype(str).isin(valid_item_ids)]

if valid_events.empty:
    log_error("❌ No valid events found after filtering. Cannot train model.")
    sys.exit(1)

log(f"✓ Found {len(valid_events)} valid events (out of {len(events_df)} total)")

# Aggregate multiple interactions for the same user-item pair
# Sum all interaction values - this captures the full engagement level
log("Aggregating multiple interactions per user-item pair...")
aggregated_events = valid_events.groupby(['user_id', 'item_id'])['value'].sum().reset_index()

if aggregated_events.empty:
    log_error("❌ No interactions after aggregation. Cannot train model.")
    sys.exit(1)

log(f"✓ Aggregated to {len(aggregated_events)} unique user-item interactions")

# Ensure user_id and item_id are integers (not floats) before converting to strings
aggregated_events['user_id'] = aggregated_events['user_id'].astype(int)
aggregated_events['item_id'] = aggregated_events['item_id'].astype(int)

log("Building interaction matrix...")
(interactions, weights) = dataset.build_interactions([
    (str(int(row.user_id)), str(int(row.item_id)), float(row.value))
    for _, row in aggregated_events.iterrows()
])

interaction_count = interactions.nnz  # Number of non-zero interactions
log(f"✓ Built interaction matrix with {interaction_count} interactions")
log(f"  Matrix shape: {interactions.shape[0]} users × {interactions.shape[1]} items")

# Model path relative to script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(script_dir, "model.pkl")

# --- Train Model ---
# Remove existing model if it exists
if os.path.exists(MODEL_PATH):
    os.remove(MODEL_PATH)
    log("🗑️  Removed existing model.")

log("=" * 60)
log("Starting model training...")
log("=" * 60)
log("Model configuration:")
log("  - Loss function: WARP")
log("  - Learning rate: 0.05")
log("  - Components: 30")
log("  - Epochs: 30")
log("  - Threads: 4")
log("  - Max sampled: 10")
log("Note: WARP loss can produce negative scores - this is normal, scores are relative")

start_time = datetime.now()

# Using more epochs and adjusting learning rate for better convergence
# WARP loss can produce negative scores - this is normal, scores are relative
model = LightFM(loss="warp", random_state=42, learning_rate=0.05, no_components=30, max_sampled=10)

try:
    model.fit(
        interactions, 
        item_features=item_features,
        user_features=user_features,  # Add user features
        sample_weight=weights, 
        epochs=30, 
        num_threads=4
    )
except Exception as e:
    log_error(f"❌ Error during model training: {str(e)}")
    sys.exit(1)

training_time = (datetime.now() - start_time).total_seconds()
log(f"✓ Model training completed in {training_time:.2f} seconds")

# Save model
log("Saving model to disk...")
try:
    with open(MODEL_PATH, "wb") as f:
        pickle.dump((model, dataset), f)
    
    # Verify model was saved
    if not os.path.exists(MODEL_PATH):
        log_error("❌ Model file was not created. Save operation may have failed.")
        sys.exit(1)
    
    file_size = os.path.getsize(MODEL_PATH) / (1024 * 1024)  # Size in MB
    log(f"✓ Model saved successfully to {MODEL_PATH}")
    log(f"  Model file size: {file_size:.2f} MB")
    
except Exception as e:
    log_error(f"❌ Error saving model: {str(e)}")
    sys.exit(1)

log("=" * 60)
log("✅ Model training completed successfully!")
log("🎯 Model is ready for use.")
log("=" * 60)
