import asyncio
from concurrent.futures import ThreadPoolExecutor
import threading

executor = ThreadPoolExecutor(max_workers=1)
model_lock = threading.Lock()

model_loaded = False
model_error = None

def init_model():
    global model_loaded, model_error
    try:
        import sys
        import os
        # Add parent to path for relative imports if needed
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from inference import predict
        global _predict_func
        _predict_func = predict
        model_loaded = True
    except Exception as e:
        model_error = str(e)
        print(f"Failed to load inference model: {e}")

def run_predict(wav_path: str, zone_id: str):
    if not model_loaded:
        raise Exception(f"Model not loaded. Error: {model_error}")
    with model_lock:
        return _predict_func(wav_path, zone_id)

async def predict_async(wav_path: str, zone_id: str):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(executor, run_predict, wav_path, zone_id)
    
def get_report():
    if not model_loaded:
        return {"error": "Model not loaded"}
    try:
        import sys
        import os
        sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from inference import get_full_report
        return get_full_report()
    except Exception as e:
        return {"error": str(e)}
