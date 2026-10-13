"""Package the Mindweaver artwork as a multi-resolution Windows icon.

The master PNG is kept intact. This only creates the mechanical ICO and a
small-size QA sheet for visual inspection.
"""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "assets" / "icon"
SOURCE = ICON_DIR / "mindweaver-icon-master.png"
ICO = ICON_DIR / "mindweaver.ico"
PREVIEW = ICON_DIR / "mindweaver-icon-qa.png"
SIZES = (16, 24, 32, 48, 64, 128, 256)


def main() -> None:
    artwork = Image.open(SOURCE).convert("RGBA")
    base = artwork.resize((256, 256), Image.Resampling.LANCZOS)
    base.save(ICO, format="ICO", sizes=[(size, size) for size in SIZES])

    preview = Image.new("RGB", (720, 270), "#060a0d")
    draw = ImageDraw.Draw(preview)
    for index, size in enumerate((16, 24, 32, 48, 64)):
        sample = base.resize((size, size), Image.Resampling.LANCZOS)
        enlarged = sample.resize((112, 112), Image.Resampling.NEAREST)
        x = 20 + index * 138
        preview.paste(enlarged, (x, 40), enlarged)
        draw.text((x + 35, 165), f"{size} px", fill="#d9ffe9")
        preview.paste(sample, (x + (112 - size) // 2, 200), sample)
    preview.save(PREVIEW)

    with Image.open(ICO) as icon:
        print(f"ICO: {ICO}")
        print(f"Embedded sizes: {sorted(icon.info.get('sizes', []))}")
    print(f"QA preview: {PREVIEW}")


if __name__ == "__main__":
    main()
