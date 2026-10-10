"""
Bird Distress + Threat Detection — Inference Module (v5, FINAL)
9 species, multi-detection, real-time migration logging, biodiversity reporting.
"""
import os, json, datetime
import numpy as np
import librosa
import joblib
import tensorflow as tf
import tensorflow_hub as hub

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
LOG_PATH = os.path.join(os.path.dirname(__file__), "detection_log.jsonl")

print("Loading pretrained embedding models (this takes ~30s)...")
yamnet_model = hub.load("https://tfhub.dev/google/yamnet/1")
perch_model = hub.load("https://www.kaggle.com/models/google/bird-vocalization-classifier/frameworks/TensorFlow2/variations/bird-vocalization-classifier/versions/4")

print("Loading trained classifiers...")
model_bird_presence = joblib.load(os.path.join(MODELS_DIR, "model_bird_presence.pkl"))
scaler_bird_presence = joblib.load(os.path.join(MODELS_DIR, "scaler_bird_presence.pkl"))
model_threat_presence = joblib.load(os.path.join(MODELS_DIR, "model_threat_presence.pkl"))
scaler_threat_presence = joblib.load(os.path.join(MODELS_DIR, "scaler_threat_presence.pkl"))
model_threattype = joblib.load(os.path.join(MODELS_DIR, "model_threattype.pkl"))
scaler_threattype = joblib.load(os.path.join(MODELS_DIR, "scaler_threattype.pkl"))
le_threattype = joblib.load(os.path.join(MODELS_DIR, "le_threattype.pkl"))
model_species = joblib.load(os.path.join(MODELS_DIR, "model_species.pkl"))
scaler_species = joblib.load(os.path.join(MODELS_DIR, "scaler_species.pkl"))
le_species = joblib.load(os.path.join(MODELS_DIR, "le_species.pkl"))
model_calltype = joblib.load(os.path.join(MODELS_DIR, "model_calltype.pkl"))
scaler_calltype = joblib.load(os.path.join(MODELS_DIR, "scaler_calltype.pkl"))
le_calltype = joblib.load(os.path.join(MODELS_DIR, "le_calltype.pkl"))

print("Ready. Covers 9 species:", list(le_species.classes_))

DETECTION_THRESHOLD = 0.35
SPECIES_CONF_THRESHOLD = 0.45

MIGRATION_CALENDAR = {
    "Amur_Falcon": {"season_months": [10, 11, 12], "note": "Peak Oct-Nov via Nagaland/Manipur; light return passage Apr-May"},
    "Bar_headed_Goose": {"season_months": [11, 12, 1, 2, 3], "note": "Arrives Nov-Dec, present through winter to ~March"},
}

def clean_and_trim(y, sr, top_db=20, max_segments=3):
    intervals = librosa.effects.split(y, top_db=top_db)
    if len(intervals) == 0:
        return y
    def peak_amp(interval):
        s, e = interval
        return np.max(np.abs(y[s:e]))
    top = sorted(intervals, key=peak_amp, reverse=True)[:max_segments]
    top = sorted(top, key=lambda x: x[0])
    trimmed = np.concatenate([y[s:e] for s, e in top])
    return trimmed if len(trimmed) > 400 else y

def log_detection(species, call_type, zone_id="Zone_1"):
    timestamp = datetime.datetime.now()
    entry = {"species": species, "call_type": call_type, "zone": zone_id,
              "timestamp": timestamp.isoformat(), "month": timestamp.month}
    if species in MIGRATION_CALENDAR:
        expected = MIGRATION_CALENDAR[species]["season_months"]
        entry["is_migratory_species"] = True
        entry["within_expected_season"] = timestamp.month in expected
        if not entry["within_expected_season"]:
            entry["anomaly_flag"] = species + " detected outside typical migration window"
    else:
        entry["is_migratory_species"] = False
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")

def predict(file_path, zone_id="Zone_1"):
    wav16, sr16 = librosa.load(file_path, sr=16000, mono=True)
    wav16_trim = clean_and_trim(wav16, sr16)
    _, embeddings16, _ = yamnet_model(wav16_trim.astype(np.float32))
    emb_yamnet = np.mean(embeddings16.numpy(), axis=0).reshape(1, -1)

    bird_prob = model_bird_presence.predict_proba(scaler_bird_presence.transform(emb_yamnet))[0][1]
    threat_prob = model_threat_presence.predict_proba(scaler_threat_presence.transform(emb_yamnet))[0][1]

    detections = []
    if bird_prob >= DETECTION_THRESHOLD:
        wav32, sr32 = librosa.load(file_path, sr=32000, mono=True)
        wav32_trim = clean_and_trim(wav32, sr32)
        target_len = 32000 * 5
        wav32_trim = np.pad(wav32_trim, (0, max(0, target_len - len(wav32_trim))))[:target_len]
        _, emb_perch_raw = perch_model.infer_tf(wav32_trim.astype(np.float32)[np.newaxis, :])
        emb_perch = emb_perch_raw.numpy().reshape(1, -1)
        sp_proba = model_species.predict_proba(scaler_species.transform(emb_perch))[0]
        ct_proba = model_calltype.predict_proba(scaler_calltype.transform(emb_perch))[0]
        species = str(le_species.classes_[np.argmax(sp_proba)]) if np.max(sp_proba) >= SPECIES_CONF_THRESHOLD else "Uncertain"
        call_type = str(le_calltype.classes_[np.argmax(ct_proba)])
        detections.append({"type": "Bird", "presence_confidence": round(float(bird_prob), 3),
            "species": species, "species_confidence": round(float(np.max(sp_proba)), 3),
            "call_type": call_type, "call_type_confidence": round(float(np.max(ct_proba)), 3)})
        if species != "Uncertain":
            log_detection(species, call_type, zone_id)

    if threat_prob >= DETECTION_THRESHOLD:
        tt_proba = model_threattype.predict_proba(scaler_threattype.transform(emb_yamnet))[0]
        detections.append({"type": "Threat", "presence_confidence": round(float(threat_prob), 3),
            "threat_type": str(le_threattype.classes_[np.argmax(tt_proba)]),
            "threat_confidence": round(float(np.max(tt_proba)), 3)})

    overall_alert = any(d["type"] == "Threat" or d.get("call_type") == "Distress" for d in detections)
    return {"detections": detections, "ALERT": overall_alert}

def get_full_report():
    """Complete biodiversity + migration report from the detection log"""
    if not os.path.exists(LOG_PATH):
        return {"message": "No detections logged yet"}
    entries = []
    with open(LOG_PATH, "r") as f:
        for line in f:
            entries.append(json.loads(line))
    if not entries:
        return {"message": "No detections logged yet"}

    from collections import defaultdict
    species_counts = defaultdict(int)
    calltype_counts = defaultdict(lambda: defaultdict(int))
    anomalies = []
    for e in entries:
        species_counts[e["species"]] += 1
        calltype_counts[e["species"]][e.get("call_type", "Unknown")] += 1
        if e.get("anomaly_flag"):
            anomalies.append(e)

    total = sum(species_counts.values())
    proportions = [c/total for c in species_counts.values()]
    diversity_index = -sum(p * np.log(p) for p in proportions if p > 0)

    return {
        "species_detected": dict(species_counts),
        "distress_vs_normal_per_species": {k: dict(v) for k, v in calltype_counts.items()},
        "shannon_diversity_index": round(float(diversity_index), 3),
        "diversity_note": "Higher value = more diverse zone. Max possible for 9 species = ln(9) = 2.197",
        "migration_season_anomalies": anomalies,
        "total_detections": len(entries)
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        print(predict(sys.argv[1]))
    else:
        print("Usage: python inference.py <path_to_audio_file>")
