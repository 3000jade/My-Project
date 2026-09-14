import os
import numpy as np
from PIL import Image, ImageFilter

SOURCE_IMG_PATH = r"C:/Users/Win11x64/.gemini/antigravity/brain/6441366b-4b13-4099-a1c8-37b199304142/.user_uploaded/media_1789368735622.jpg"
OUTPUT_DIR = os.path.join("frontend", "src", "assets", "parallax")

def create_feathered_mask(shape, polygon_coords=None, bbox=None, feather_radius=12):
    """Creates a smooth alpha mask with feathered edges."""
    h, w = shape
    mask = Image.new("L", (w, h), 0)
    # If bbox provided: (left, top, right, bottom)
    if bbox:
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.rectangle(bbox, fill=255)
    elif polygon_coords:
        from PIL import ImageDraw
        draw = ImageDraw.Draw(mask)
        draw.polygon(polygon_coords, fill=255)
    
    if feather_radius > 0:
        mask = mask.filter(ImageFilter.GaussianBlur(feather_radius))
    return mask

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    orig = Image.open(SOURCE_IMG_PATH).convert("RGBA")
    w, h = orig.size
    print(f"Loaded source image: {w}x{h}")

    # 1. LAYER SKY (Backdrop)
    # Sky occupies upper area, softly fades around the villa roofline (Y: ~140 - 240)
    sky_img = orig.copy()
    sky_alpha = Image.new("L", (w, h), 0)
    from PIL import ImageDraw
    draw = ImageDraw.Draw(sky_alpha)
    # Upper sky full opacity, gradual fade into horizon
    sky_polygon = [
        (0, 0), (w, 0),
        (w, 240),
        (750, 220), (600, 150), (450, 130), (250, 160), (120, 220),
        (0, 240)
    ]
    draw.polygon(sky_polygon, fill=255)
    sky_alpha = sky_alpha.filter(ImageFilter.GaussianBlur(16))
    sky_img.putalpha(sky_alpha)
    sky_img.save(os.path.join(OUTPUT_DIR, "layer-sky.png"), "PNG")
    print("Saved layer-sky.png")

    # 2. LAYER VILLAS (Midground Architecture)
    # The duplex villas from Y: ~100 to Y: ~440, spanning from X: 80 to X: 940
    villas_img = orig.copy()
    villas_alpha = Image.new("L", (w, h), 0)
    draw_villas = ImageDraw.Draw(villas_alpha)
    villas_polygon = [
        (70, 190), (260, 180), (320, 140), (450, 130), (550, 140), (760, 170), (950, 230),
        (950, 450), (750, 460), (550, 480), (350, 480), (180, 470), (70, 460)
    ]
    draw_villas.polygon(villas_polygon, fill=255)
    villas_alpha = villas_alpha.filter(ImageFilter.GaussianBlur(14))
    villas_img.putalpha(villas_alpha)
    villas_img.save(os.path.join(OUTPUT_DIR, "layer-villas.png"), "PNG")
    print("Saved layer-villas.png")

    # 3. LAYER GROUND (Cobblestone Driveway & Car Headlights)
    # Lower ground plane from Y: ~370 to bottom
    ground_img = orig.copy()
    ground_alpha = Image.new("L", (w, h), 0)
    draw_ground = ImageDraw.Draw(ground_alpha)
    ground_polygon = [
        (0, 390), (250, 380), (500, 410), (750, 400), (w, 380),
        (w, h), (0, h)
    ]
    draw_ground.polygon(ground_polygon, fill=255)
    ground_alpha = ground_alpha.filter(ImageFilter.GaussianBlur(18))
    ground_img.putalpha(ground_alpha)
    ground_img.save(os.path.join(OUTPUT_DIR, "layer-ground.png"), "PNG")
    print("Saved layer-ground.png")

    # 4. LAYER FOREGROUND LEFT (Dahlia Sign, Upper Branch, Anthurium Flowers)
    # Upper-left overhanging canopy and lower-left garden + Dahlia Street post
    fg_left_img = orig.copy()
    fg_left_alpha = Image.new("L", (w, h), 0)
    draw_fg_left = ImageDraw.Draw(fg_left_alpha)
    # Upper-left tree canopy
    draw_fg_left.polygon([(0, 0), (280, 0), (240, 240), (140, 260), (0, 260)], fill=255)
    # Lower-left Dahlia street sign & flowers
    draw_fg_left.polygon([(0, 360), (280, 360), (320, 440), (310, 558), (0, 558)], fill=255)
    fg_left_alpha = fg_left_alpha.filter(ImageFilter.GaussianBlur(10))
    fg_left_img.putalpha(fg_left_alpha)
    fg_left_img.save(os.path.join(OUTPUT_DIR, "layer-foreground-left.png"), "PNG")
    print("Saved layer-foreground-left.png")

    # 5. LAYER FOREGROUND RIGHT (Low Tropical Shrubs, Palm Fronds, Phase 3 Post)
    # Right side foreground foliage
    fg_right_img = orig.copy()
    fg_right_alpha = Image.new("L", (w, h), 0)
    draw_fg_right = ImageDraw.Draw(fg_right_alpha)
    draw_fg_right.polygon([
        (720, 420), (w, 400), (w, h), (720, h), (700, 480)
    ], fill=255)
    # Top-right palm silhouette
    draw_fg_right.polygon([(640, 0), (w, 0), (w, 160), (780, 160), (660, 60)], fill=255)
    fg_right_alpha = fg_right_alpha.filter(ImageFilter.GaussianBlur(10))
    fg_right_img.putalpha(fg_right_alpha)
    fg_right_img.save(os.path.join(OUTPUT_DIR, "layer-foreground-right.png"), "PNG")
    print("Saved layer-foreground-right.png")

    print("Extraction completed successfully!")

if __name__ == "__main__":
    main()
