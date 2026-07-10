#!/usr/bin/env python3
"""
SafetyOS Icon Generator
Creates a simple factory/industrial icon for the app
"""

import os
from PIL import Image, ImageDraw

def create_icon():
    """Create a simple industrial/factory icon"""
    os.makedirs('assets', exist_ok=True)
    
    # Create 256x256 image with dark background
    img = Image.new('RGBA', (256, 256), (8, 8, 16, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw factory building shape
    # Main structure
    draw.rectangle([60, 100, 196, 220], fill=(0, 255, 136, 255), outline=(0, 255, 136, 200), width=2)
    
    # Factory roof peaks
    draw.polygon([(80, 100), (110, 40), (140, 100)], fill=(68, 136, 255, 255))
    draw.polygon([(140, 100), (170, 40), (200, 100)], fill=(68, 136, 255, 200))
    
    # Chimney stacks (industrial elements)
    draw.rectangle([75, 60, 95, 100], fill=(100, 100, 120, 255))
    draw.rectangle([155, 60, 175, 100], fill=(100, 100, 120, 255))
    
    # Smoke puffs
    draw.ellipse([70, 45, 90, 65], fill=(150, 150, 160, 180))
    draw.ellipse([150, 45, 170, 65], fill=(150, 150, 160, 180))
    
    # Windows in building (showing activity)
    window_fill = (0, 200, 255, 255)
    for row in range(3):
        for col in range(4):
            x = 80 + col * 30
            y = 130 + row * 25
            draw.rectangle([x, y, x + 16, y + 16], fill=window_fill, outline=(0, 255, 136, 100))
    
    # Safety elements - green accents
    draw.rectangle([60, 210, 196, 220], fill=(0, 255, 136, 255))
    
    # Save as PNG
    img.save('assets/icon.png')
    print("[+] Created assets/icon.png (256x256)")
    
    # Create smaller versions for shortcuts
    for size in [64, 48, 32, 16]:
        small = img.resize((size, size), Image.Resampling.LANCZOS)
        small.save(f'assets/icon-{size}.png')
        print(f"[+] Created assets/icon-{size}.png")
    
    print("\n[INFO] To convert PNG to ICO for Windows:")
    print("       Option 1: https://convertio.co/png-ico/")
    print("       Option 2: Use ImageMagick: convert assets/icon.png assets/icon.ico")
    print("       Option 3: Use Python: pip install pillow && python3 -c \"from PIL import Image; Image.open('assets/icon.png').save('assets/icon.ico')\"")

if __name__ == '__main__':
    create_icon()
