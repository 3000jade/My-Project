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
    print(f"Processing dream gate layers from: {w}x{h}")

    # 1. LAYER SKY (Backdrop)
    sky_img = orig.copy()
    sky_alpha = Image.new("L", (w, h), 0)
    from PIL import ImageDraw
    draw_sky = ImageDraw.Draw(sky_alpha)
    sky_polygon = [
        (0, 0), (w, 0),
        (w, 240), (750, 220), (600, 150), (450, 130), (250, 160), (120, 220), (0, 240)
    ]
    draw_sky.polygon(sky_polygon, fill=255)
    sky_alpha = sky_alpha.filter(ImageFilter.GaussianBlur(14))
    sky_img.putalpha(sky_alpha)
    sky_img.save(os.path.join(OUTPUT_DIR, "layer-sky.png"), "PNG")
    print("Saved layer-sky.png")

    # 2. LAYER DREAM HOUSE (The focal villa and clean driveway)
    if os.path.exists(CLEAN_PLATE_PATH):
        clean_plate = Image.open(CLEAN_PLATE_PATH).convert("RGBA")
        clean_plate.save(os.path.join(OUTPUT_DIR, "layer-house.png"), "PNG")
        print("Saved layer-house.png from clean plate")
    else:
        orig.save(os.path.join(OUTPUT_DIR, "layer-house.png"), "PNG")

    # 3. LAYER GATE LEFT (Center palm cluster, fence, and left pillar with glowing lantern)
    gate_left_img = orig.copy()
    gate_l_alpha = Image.new("L", (w, h), 0)
    draw_gl = ImageDraw.Draw(gate_l_alpha)
    # Left gate pillar and fence: X: 300 to 600, Y: 330 to 520
    draw_gl.polygon([
        (300, 340), (420, 310), (480, 340), (600, 360),
        (610, 500), (400, 520), (280, 500)
    ], fill=255)
    gate_l_alpha = gate_l_alpha.filter(ImageFilter.GaussianBlur(8))
    gate_left_img.putalpha(gate_l_alpha)
    gate_left_img.save(os.path.join(OUTPUT_DIR, "layer-gate-left.png"), "PNG")
    print("Saved layer-gate-left.png")

    # 4. LAYER GATE RIGHT (Sliding horizontal slat wooden gate, right pillar with lantern, and car headlights)
    gate_right_img = orig.copy()
    gate_r_alpha = Image.new("L", (w, h), 0)
    draw_gr = ImageDraw.Draw(gate_r_alpha)
    # Sliding slat gate and right pillar: X: 590 to 980, Y: 350 to 520
    draw_gr.polygon([
        (590, 360), (760, 360), (840, 350), (980, 380),
        (980, 520), (840, 520), (590, 500)
    ], fill=255)
    gate_r_alpha = gate_r_alpha.filter(ImageFilter.GaussianBlur(8))
    gate_right_img.putalpha(gate_r_alpha)
    gate_right_img.save(os.path.join(OUTPUT_DIR, "layer-gate-right.png"), "PNG")
    print("Saved layer-gate-right.png")

    # 5. LAYER THRESHOLD LEFT (Dahlia Street post, Anthurium flowers, and top-left overhanging fruit branch)
    thresh_l_img = orig.copy()
    thresh_l_alpha = Image.new("L", (w, h), 0)
    draw_tl = ImageDraw.Draw(thresh_l_alpha)
    # Upper-left tree branch
    draw_tl.polygon([(0, 0), (280, 0), (240, 240), (140, 270), (0, 270)], fill=255)
    # Lower-left Dahlia street sign & red anthuriums
    draw_tl.polygon([(0, 360), (260, 360), (320, 440), (300, 558), (0, 558)], fill=255)
    thresh_l_alpha = thresh_l_alpha.filter(ImageFilter.GaussianBlur(6))
    thresh_l_img.putalpha(thresh_l_alpha)
    thresh_l_img.save(os.path.join(OUTPUT_DIR, "layer-threshold-left.png"), "PNG")
    print("Saved layer-threshold-left.png")

    # 6. LAYER THRESHOLD RIGHT (Lower right flowering shrubs & right palm fronds)
    thresh_r_img = orig.copy()
    thresh_r_alpha = Image.new("L", (w, h), 0)
    draw_tr = ImageDraw.Draw(thresh_r_alpha)
    # Lower right flowering shrubs
    draw_tr.polygon([(740, 430), (w, 410), (w, h), (740, h), (720, 490)], fill=255)
    # Top right palm fronds
    draw_tr.polygon([(650, 0), (w, 0), (w, 180), (790, 180), (670, 70)], fill=255)
    thresh_r_alpha = thresh_r_alpha.filter(ImageFilter.GaussianBlur(6))
    thresh_r_img.putalpha(thresh_r_alpha)
    thresh_r_img.save(os.path.join(OUTPUT_DIR, "layer-threshold-right.png"), "PNG")
    print("Saved layer-threshold-right.png")

    print("Dream gate layers generated successfully!")

if __name__ == "__main__":
    main()
