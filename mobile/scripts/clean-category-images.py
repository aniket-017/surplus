"""Replace the baked-in transparency checkerboard in category JPGs with solid white.

Usage (needs Pillow, numpy, scipy):
    python scripts/clean-category-images.py [src_dir] [out_dir]

Defaults to cleaning assets/categories/*.jpg in place.
"""

import glob
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

OUTPUT_WIDTH = 640
JPEG_QUALITY = 85
MAX_SATURATION = 12
DARK_TONE_MARGIN = 14
MIN_ENCLOSED_AREA = 400


def estimate_dark_tone(lum, sat):
    border = np.concatenate([lum[:6].ravel(), lum[-6:].ravel(), lum[:, :6].ravel(), lum[:, -6:].ravel()])
    border_sat = np.concatenate([sat[:6].ravel(), sat[-6:].ravel(), sat[:, :6].ravel(), sat[:, -6:].ravel()])
    greys = border[(border_sat <= 6) & (border < 245) & (border > 170)]
    return float(np.median(greys)) if greys.size else 204.0


def background_mask(rgb):
    lum = rgb.mean(axis=2)
    sat = rgb.max(axis=2) - rgb.min(axis=2)
    dark = estimate_dark_tone(lum, sat)

    candidate = (sat <= MAX_SATURATION) & (lum >= dark - DARK_TONE_MARGIN)
    labels, count = ndimage.label(candidate)

    edge_labels = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    keep = np.zeros(count + 1, dtype=bool)
    keep[edge_labels] = True

    # Enclosed gaps (e.g. inside stacked pipes) still show the checker texture: both tones present.
    areas = ndimage.sum(candidate, labels, index=np.arange(count + 1))
    dark_share = ndimage.mean(lum < dark + 15, labels, index=np.arange(count + 1))
    light_share = ndimage.mean(lum > 240, labels, index=np.arange(count + 1))
    keep |= (areas >= MIN_ENCLOSED_AREA) & (dark_share >= 0.2) & (light_share >= 0.2)
    keep[0] = False

    mask = keep[labels]

    fringe = ndimage.binary_dilation(mask, iterations=1) & (lum >= 170) & (sat <= 20)
    return mask | fringe


def clean(path, out_path):
    image = Image.open(path).convert('RGB')
    rgb = np.asarray(image).astype(np.int16)
    mask = background_mask(rgb)

    cleaned = np.asarray(image).copy()
    cleaned[mask] = 255

    result = Image.fromarray(cleaned)
    if result.width > OUTPUT_WIDTH:
        height = round(result.height * OUTPUT_WIDTH / result.width)
        result = result.resize((OUTPUT_WIDTH, height), Image.LANCZOS)

    result.save(out_path, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)
    print(f'{os.path.basename(path)}: {mask.mean() * 100:.1f}% background')


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src_dir = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'assets', 'categories')
    out_dir = sys.argv[2] if len(sys.argv) > 2 else src_dir
    os.makedirs(out_dir, exist_ok=True)

    for path in sorted(glob.glob(os.path.join(src_dir, '*.jpg'))):
        clean(path, os.path.join(out_dir, os.path.basename(path)))


if __name__ == '__main__':
    main()
