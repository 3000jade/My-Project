import os
import sys
from PIL import Image

REQUIRED_LAYERS = [
    "layer-sky.png",
    "layer-villas.png",
    "layer-ground.png",
    "layer-foreground-left.png",
    "layer-foreground-right.png"
]

def test_layers():
    target_dir = os.path.join("frontend", "src", "assets", "parallax")
    missing = []
    for layer in REQUIRED_LAYERS:
        path = os.path.join(target_dir, layer)
        if not os.path.exists(path):
            missing.append(layer)
            continue
        with Image.open(path) as img:
            assert img.mode in ("RGBA", "RGB"), f"{layer} mode is {img.mode}, expected RGBA or RGB"
            assert img.size[0] >= 1024, f"{layer} width {img.size[0]} < 1024"
    if missing:
        print(f"FAILED: Missing layers: {missing}", file=sys.stderr)
        sys.exit(1)
    print("ALL LAYERS VERIFIED OK")

if __name__ == "__main__":
    test_layers()
