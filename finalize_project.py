import os
import shutil

# Get current paths
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")

# Target path in Downloads
downloads_dir = os.path.dirname(root_dir) # Because root is inside Downloads
target_dir = os.path.join(downloads_dir, "Forest_Alert_Backend")

if os.path.exists(target_dir):
    print("Folder already exists in Downloads. Cleaning it up...")
    shutil.rmtree(target_dir)

print(f"Moving your integrated project to: {target_dir}")
shutil.copytree(backend_dir, target_dir)

print("\n✅ Done! Aapka final integrated folder ban gaya hai.")
print(f"📁 Folder Location: {target_dir}")
