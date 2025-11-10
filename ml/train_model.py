import pandas as pd
import numpy as np
import pickle
import os
import sys

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

# --- Load Data ---
def load_data():
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Training files are in the parent directory (project root)
    data_dir = os.path.join(script_dir, "..")
    
    users = pd.read_json(os.path.join(data_dir, "training_users.json"))
    foods = pd.read_json(os.path.join(data_dir, "training_food_items.json"))
    restaurants = pd.read_json(os.path.join(data_dir, "training_restaurants.json"))
    events = pd.read_json(os.path.join(data_dir, "training_events.json"))

    events["value"] = pd.to_numeric(events["value"], errors="coerce").fillna(0)
    return users, foods, restaurants, events


users_df, food_df, restaurants_df, events_df = load_data()

# --- Build Dataset ---
dataset = Dataset()
dataset.fit(
    users=users_df["id"].astype(str).unique(),
    items=food_df["id"].astype(str).unique()
)

# Filter events to only include item_ids that exist in food_df
valid_item_ids = set(food_df["id"].astype(str))
valid_events = events_df[events_df["item_id"].astype(str).isin(valid_item_ids)]

(interactions, weights) = dataset.build_interactions([
    (str(row.user_id), str(row.item_id), row.value)
    for _, row in valid_events.iterrows()
])

# Model path relative to script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(script_dir, "model.pkl")

# --- Train Model ---
# Remove existing model if it exists
if os.path.exists(MODEL_PATH):
    os.remove(MODEL_PATH)
    print("🗑️  Removed existing model.")

print("🚀 Training new model...")
model = LightFM(loss="warp", random_state=42)
model.fit(interactions, sample_weight=weights, epochs=20, num_threads=4)
with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)
print("✅ Model trained and saved to disk.")

print("🎯 Done — model is ready for use.")
