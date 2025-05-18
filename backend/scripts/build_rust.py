#!/usr/bin/env python
"""
Build Rust components and install them in the current Python environment.
"""
import subprocess
import sys
import os
from pathlib import Path

def main():
    """
    Build Rust components using maturin and install them.
    """
    print("Building Rust components...")
    
    # Get the project root directory
    root_dir = Path(__file__).parent.parent
    
    # Run maturin build
    try:
        subprocess.run(
            ["maturin", "build", "--release"],
            cwd=root_dir,
            check=True
        )
        print("✅ Rust build successful")
    except subprocess.CalledProcessError as e:
        print(f"❌ Rust build failed: {e}")
        sys.exit(1)
    
    # Install the built wheel
    try:
        wheels_dir = root_dir / "target" / "wheels"
        wheel_files = list(wheels_dir.glob("*.whl"))
        
        if not wheel_files:
            print("❌ No wheel file found after build")
            sys.exit(1)
        
        # Install the latest wheel
        latest_wheel = max(wheel_files, key=os.path.getctime)
        subprocess.run(
            ["pip", "install", "--force-reinstall", str(latest_wheel)],
            check=True
        )
        print(f"✅ Installed wheel: {latest_wheel.name}")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install wheel: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()