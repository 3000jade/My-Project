import os
import numpy as np
from PIL import Image, ImageFilter

SOURCE_IMG_PATH = r"C:/Users/Win11x64/.gemini/antigravity/brain/6441366b-4b13-4099-a1c8-37b199304142/.user_uploaded/media_1789368735622.jpg"
CLEAN_PLATE_PATH = r"frontend/src/assets/parallax/layer-villas-clean.jpg"
OUTPUT_DIR = os.path.join("frontend", "src", "assets", "parallax")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    orig = Image.open(SOURCE_IMG_PATH).convert("RGBA")
    w, h = orig.size
    print(f"Refining layers from: {w}x{h}")

    # 1. FOREGROUND LEFT (Dahlia Street post, Anthuriums, Top-Left Overhang)
    fg_left_img = orig.copy()
    fg_left_alpha = Image.new("L", (w, h), 0)
    from PIL import ImageDraw
    draw_l = ImageDraw.Draw(fg_left_alpha)
    
    # Top-left overhanging fruit branch
    draw_l.polygon([(0, 0), (280, 0), (240, 240), (140, 270), (0, 270)], fill=255)
    # Lower-left Dahlia street sign & red anthuriums
    draw_l.polygon([(0, 360), (260, 360), (320, 440), (300, 558), (0, 558)], fill=255)
    fg_left_alpha = fg_left_alpha.filter(ImageFilter.GaussianBlur(6))
    fg_left_img.putalpha(fg_left_alpha)
    fg_left_img.save(os.path.join(OUTPUT_DIR, "layer-foreground-left.png"), "PNG")
    print("Saved refined layer-foreground-left.png")

    # 2. FOREGROUND RIGHT (Low tropical shrubs and right palm fronds)
    fg_right_img = orig.copy()
    fg_right_alpha = Image.new("L", (w, h), 0)
    draw_r = ImageDraw.Draw(fg_right_alpha)
    # Lower right flowering shrubs
    draw_r.polygon([(740, 430), (w, 410), (w, h), (740, h), (720, 490)], fill=255)
    # Top right palm fronds
    draw_r.polygon([(650, 0), (w, 0), (w, 180), (790, 180), (670, 70)], fill=255)
    fg_right_alpha = fg_right_alpha.filter(ImageFilter.GaussianBlur(6))
    fg_right_img.putalpha(fg_right_alpha)
    fg_right_img.save(os.path.join(OUTPUT_DIR, "layer-foreground-right.png"), "PNG")
    print("Saved refined layer-foreground-right.png")

    # 3. HEADLIGHT & AMBIENT VOLUMETRIC BLOOM LAYER
    bloom_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw_b = ImageDraw.Draw(bloom_img)
    # Car headlight cone
    draw_b.ellipse([(830, 400), (950, 460)], fill=(255, 230, 180, 220))
    draw_b.polygon([(870, 430), (700, 500), (920, 520)], fill=(255, 210, 140, 100))
    bloom_img = bloom_img.filter(ImageFilter.GaussianBlur(25))
    bloom_img.save(os.path.join(OUTPUT_DIR, "layer-headlight-bloom.png"), "PNG")
    print("Saved layer-headlight-bloom.png")

    print("Layer refinement completed successfully!")

if __name__ == "__main__":
    main()
