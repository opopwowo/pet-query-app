# -*- coding: utf-8 -*-
"""Generate PWA icons (paw print) for the 寵物查詢 launcher."""
from PIL import Image, ImageDraw

TEAL = (15, 118, 110)        # 主色 (teal-700)
TEAL_DARK = (12, 92, 86)
WHITE = (255, 255, 255)


def draw_paw(draw, cx, cy, scale, color):
    """Draw a simple paw print centered around (cx, cy)."""
    # main pad (big ellipse)
    pad_w = 150 * scale
    pad_h = 130 * scale
    draw.ellipse(
        [cx - pad_w / 2, cy - pad_h / 2 + 35 * scale,
         cx + pad_w / 2, cy + pad_h / 2 + 35 * scale],
        fill=color,
    )
    # four toes
    toe_r = 42 * scale
    offsets = [
        (-78 * scale, -55 * scale),
        (-28 * scale, -95 * scale),
        (28 * scale, -95 * scale),
        (78 * scale, -55 * scale),
    ]
    for ox, oy in offsets:
        r = toe_r if abs(ox) < 50 * scale else toe_r * 0.92
        draw.ellipse([cx + ox - r, cy + oy - r, cx + ox + r, cy + oy + r], fill=color)


def make_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # background
    if maskable:
        draw.rectangle([0, 0, size, size], fill=TEAL)
        scale = size / 512 * 0.7
    else:
        # rounded square background
        radius = int(size * 0.22)
        draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=TEAL)
        scale = size / 512 * 0.85
    draw_paw(draw, size / 2, size / 2, scale, WHITE)
    return img


targets = [
    ("icons/icon-192.png", 192, False),
    ("icons/icon-512.png", 512, False),
    ("icons/maskable-512.png", 512, True),
    ("icons/apple-touch-icon.png", 180, False),
    ("favicon-32.png", 32, False),
]

import os
base = os.path.dirname(os.path.abspath(__file__))
for name, size, mask in targets:
    out = os.path.join(base, name)
    make_icon(size, mask).save(out)
    print("wrote", name)
print("done")
