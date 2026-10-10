import requests
import sys
import os

BASE_URL = "http://localhost:8000/api"
session = requests.Session()

def smoke_test(wav_path):
    print("1. Health Check")
    r = session.get(f"{BASE_URL}/health")
    print(r.json())
    
    print("\n2. Register Officer")
    r = session.post(f"{BASE_URL}/auth/register", json={
        "email": "test@forest.gov.in",
        "full_name": "Test Officer",
        "designation": "Ranger",
        "forest_division": "North",
        "forest_range": "Range 1"
    })
    print(r.status_code, r.text)
    if r.status_code == 409:
        print("Officer already registered. Logging in instead.")
        r = session.post(f"{BASE_URL}/auth/login", json={"email": "test@forest.gov.in"})
    
    dev_otp = r.json().get("dev_otp")
    if not dev_otp:
        print("Error: No dev_otp found. Ensure DEV_MODE=true and SMTP is not configured.")
        return
        
    print(f"\n3. Verify OTP: {dev_otp}")
    r = session.post(f"{BASE_URL}/auth/verify-email", json={
        "email": "test@forest.gov.in",
        "code": dev_otp
    })
    # If already verified, verify-email will fail, but login/verify will work
    if r.status_code != 200:
        r = session.post(f"{BASE_URL}/auth/login/verify", json={
            "email": "test@forest.gov.in",
            "code": dev_otp
        })
    print(r.status_code, r.text)
    
    print("\n4. Get Me")
    r = session.get(f"{BASE_URL}/me")
    print(r.status_code, r.text)
    
    if wav_path and os.path.exists(wav_path):
        print(f"\n5. Analyze Audio: {wav_path}")
        with open(wav_path, "rb") as f:
            r = session.post(
                f"{BASE_URL}/analyze", 
                files={"audio": ("test.wav", f, "audio/wav")},
                data={"zone_id": "Zone_1", "lat": 28.0, "lon": 77.0, "accuracy": 10}
            )
        print(r.status_code, r.text)
    else:
        print("\n5. Analyze Audio: Skipped (no wav path provided)")
        
    print("\n6. Get Events")
    r = session.get(f"{BASE_URL}/events")
    print(r.status_code, r.text)
    
if __name__ == "__main__":
    wav_file = sys.argv[1] if len(sys.argv) > 1 else None
    smoke_test(wav_file)
