#!/usr/bin/env python3
"""
Script to create application icon using PIL
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("PIL not available - install with: pip install pillow")
    exit(1)

import os

def create_app_icon():
    """Create a simple app icon"""
    # Create a 256x256 image with a dark background
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw a gradient-like circle background
    for i in range(0, size//2, 2):
        color = (102 - i//4, 126 - i//4, 234 - i//4, 255)
        draw.ellipse([i, i, size-i, size-i], fill=color)
    
    # Add microphone emoji-like design
    # Microphone body
    mic_x = size // 2
    mic_y = size // 2 - 20
    mic_width = 30
    mic_height = 50
    
    draw.rounded_rectangle(
        [mic_x - mic_width//2, mic_y - mic_height//2, 
         mic_x + mic_width//2, mic_y + mic_height//2],
        radius=15,
        fill=(255, 255, 255, 255)
    )
    
    # Microphone stand
    draw.rectangle(
        [mic_x - 2, mic_y + mic_height//2, mic_x + 2, mic_y + mic_height//2 + 30],
        fill=(255, 255, 255, 255)
    )
    
    # Microphone base
    draw.ellipse(
        [mic_x - 25, mic_y + mic_height//2 + 25, 
         mic_x + 25, mic_y + mic_height//2 + 35],
        fill=(255, 255, 255, 255)
    )
    
    # Save in different formats
    os.makedirs('assets', exist_ok=True)
    
    # PNG for general use
    img.save('assets/icon.png', 'PNG')
    
    # ICO for Windows
    img.save('assets/icon.ico', 'ICO', sizes=[(256, 256), (128, 128), (64, 64), (32, 32), (16, 16)])
    
    # ICNS for macOS (if possible)
    try:
        img.save('assets/icon.icns', 'ICNS')
    except:
        print("Could not create .icns file (macOS icon)")
    
    print("✅ Application icons created in assets/ directory")
    print("   - icon.png (256x256)")
    print("   - icon.ico (Windows)")
    if os.path.exists('assets/icon.icns'):
        print("   - icon.icns (macOS)")

if __name__ == "__main__":
    create_app_icon()