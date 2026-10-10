import os
import shutil

root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")

# 1. Copy inference.py
src_inference = os.path.join(root_dir, "inference.py")
dst_inference = os.path.join(backend_dir, "inference.py")
if os.path.exists(src_inference):
    shutil.copy2(src_inference, dst_inference)
    print("✅ Copied inference.py to backend/")
else:
    print("❌ inference.py not found in root")

# 2. Copy models/ folder
src_models = os.path.join(root_dir, "models")
dst_models = os.path.join(backend_dir, "models")
if os.path.exists(src_models):
    if os.path.exists(dst_models):
        shutil.rmtree(dst_models)
    shutil.copytree(src_models, dst_models)
    print("✅ Copied models/ folder to backend/")
else:
    print("❌ models/ folder not found in root")

# 3. Create .env
env_example = os.path.join(backend_dir, ".env.example")
env_file = os.path.join(backend_dir, ".env")
if os.path.exists(env_example) and not os.path.exists(env_file):
    shutil.copy2(env_example, env_file)
    print("✅ Created .env file in backend/")
else:
    print("⚠️ .env file already exists or .env.example missing")

print("\n🚀 File setup complete! Now just open terminal in backend/ and run:")
print("1. pip install -r requirements.txt")
print("2. uvicorn app.main:app --reload --port 8000")
