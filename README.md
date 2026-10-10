# Bird Distress + Threat Detection — Model Handoff (FINAL)

## What this does
Detects bird presence (species + Distress/Normal) AND threat presence (gunshot/chainsaw/
engine/footsteps/siren) from any audio clip — both can fire simultaneously. Auto-logs
detections with timestamp + zone; flags migratory species (Amur Falcon, Bar-headed Goose)
detected outside season; provides Shannon-diversity biodiversity reporting.

## Species covered (9)
- Alexandrine Parakeet (Psittacula eupatria)
- Amur Falcon (Falco amurensis)
- Asian Koel (Eudynamys scolopaceus)
- Bar headed Goose (Anser indicus)
- Common Myna (Acridotheres tristis)
- Indian Peafowl (Pavo cristatus)
- Rose ringed Parakeet (Psittacula krameri)
- Scaly breasted Munia (Lonchura punctulata)
- Spotted Owlet (Athene brama)

## How to use
```python
import sys
sys.path.append('path/to/_final_export')
from inference import predict, get_full_report

result = predict('audio_file.wav', zone_id='Zone_1')
report = get_full_report()  # cumulative biodiversity + migration report
```

## Honest accuracy (cross-validated on unseen data)
- Bird vs Threat presence: ~98.9%
- Threat subtype: ~96.9%
- Species ID (9-way, ensemble): ~79.8%
- Distress vs Normal (pooled): ~70.3%

## Known limitations (disclose proactively)
- Distress-vs-Normal capped by scarce real distress recordings for some species
- Peafowl/Owlet are hardest for Distress/Normal — their normal calls are acoustically
  loud/sharp, genuinely close to distress calls
- "Uncertain" species output = low confidence, route to human review
- Authorization (ranger vs poacher) is a backend decision, not solvable by audio alone

## Requirements
librosa, joblib, tensorflow, tensorflow_hub, numpy, scikit-learn, scipy
Needs internet on first run (downloads YAMNet + Perch, cached after)
