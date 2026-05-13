import os
from PIL import Image

def process_icons(source_path, public_dir):
    if not os.path.exists(source_path):
        print(f"Error: Source file {source_path} not found.")
        return

    img = Image.open(source_path)
    
    # Ensure icons directory exists
    icons_dir = os.path.join(public_dir, 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    # Standard PWA icons
    sizes = [192, 512]
    for size in sizes:
        icon = img.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(os.path.join(icons_dir, f'icon-{size}x{size}.png'))
        print(f"Generated {size}x{size} icon.")

    # Favicon (multiple sizes in one ico file is better but single 32x32 works)
    favicon = img.resize((32, 32), Image.Resampling.LANCZOS)
    favicon.save(os.path.join(public_dir, 'favicon.ico'))
    print("Generated favicon.ico")

    # Apple Touch Icon
    apple_icon = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join(public_dir, 'apple-icon.png'))
    print("Generated apple-icon.png")

    # Also save a standard logo.png for other uses
    logo = img.resize((512, 512), Image.Resampling.LANCZOS)
    logo.save(os.path.join(public_dir, 'logo.png'))
    print("Generated logo.png")

if __name__ == "__main__":
    source = r"c:\Users\giova\Documents\Anigravity\GREST\Grest\LogoAlice.png"
    public = r"c:\Users\giova\Documents\Anigravity\GREST\frontend\public"
    process_icons(source, public)
