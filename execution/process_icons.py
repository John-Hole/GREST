import os
from PIL import Image, ImageOps

def process_icons(source_path, public_dir):
    if not os.path.exists(source_path):
        print(f"Error: Source file {source_path} not found.")
        return

    img = Image.open(source_path).convert("RGBA")
    
    # Simple background removal: if the pixel is white (or very close to white), make it transparent
    # This is a bit risky but often what's needed for logos with white backgrounds
    data = img.getdata()
    new_data = []
    for item in data:
        # If the pixel is white (255, 255, 255) or very close, make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    # Trim empty borders (optional but good for logos)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Ensure icons directory exists
    icons_dir = os.path.join(public_dir, 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    # Standard PWA icons
    sizes = [192, 512]
    for size in sizes:
        # Use a square canvas with padding if it's not square
        width, height = img.size
        max_dim = max(width, height)
        square_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))
        square_img.paste(img, ((max_dim - width) // 2, (max_dim - height) // 2))
        
        icon = square_img.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(os.path.join(icons_dir, f'icon-{size}x{size}.png'))
        print(f"Generated {size}x{size} icon.")

    # Favicon (ICO and PNG)
    # Browsers cache favicon.ico heavily. Using icon.png + link tag is often better.
    width, height = img.size
    max_dim = max(width, height)
    square_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))
    square_img.paste(img, ((max_dim - width) // 2, (max_dim - height) // 2))

    favicon_32 = square_img.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_32.save(os.path.join(public_dir, 'favicon.ico'))
    favicon_32.save(os.path.join(public_dir, 'icon.png')) # Also save as icon.png
    print("Generated favicon.ico and icon.png")

    # Apple Touch Icon
    apple_icon = square_img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join(public_dir, 'apple-icon.png'))
    print("Generated apple-icon.png")

    # Standard logo.png
    logo = square_img.resize((512, 512), Image.Resampling.LANCZOS)
    logo.save(os.path.join(public_dir, 'logo.png'))
    print("Generated logo.png")

if __name__ == "__main__":
    source = r"c:\Users\giova\Documents\Anigravity\GREST\Grest\LogoAlice.png"
    public = r"c:\Users\giova\Documents\Anigravity\GREST\frontend\public"
    app_dir = r"c:\Users\giova\Documents\Anigravity\GREST\frontend\app"
    
    # Run processing
    if not os.path.exists(source):
        print(f"Error: Source file {source} not found.")
        exit(1)

    img = Image.open(source).convert("RGBA")
    
    # Simple background removal
    data = img.getdata()
    new_data = []
    for item in data:
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Ensure directories exist
    icons_dir = os.path.join(public, 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    # Standard PWA icons (stay in public)
    sizes = [192, 512]
    for size in sizes:
        width, height = img.size
        max_dim = max(width, height)
        square_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))
        square_img.paste(img, ((max_dim - width) // 2, (max_dim - height) // 2))
        icon = square_img.resize((size, size), Image.Resampling.LANCZOS)
        icon.save(os.path.join(icons_dir, f'icon-{size}x{size}.png'))
        print(f"Generated {size}x{size} icon in public/icons")

    # App-specific icons (Next.js conventions)
    width, height = img.size
    max_dim = max(width, height)
    square_img = Image.new('RGBA', (max_dim, max_dim), (255, 255, 255, 0))
    square_img.paste(img, ((max_dim - width) // 2, (max_dim - height) // 2))

    # Favicon and icon.png in /app
    favicon_32 = square_img.resize((32, 32), Image.Resampling.LANCZOS)
    favicon_32.save(os.path.join(app_dir, 'favicon.ico'))
    favicon_32.save(os.path.join(app_dir, 'icon.png'))
    print("Generated favicon.ico and icon.png in app/")

    # Apple Touch Icon in /app
    apple_icon = square_img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_icon.save(os.path.join(app_dir, 'apple-icon.png'))
    print("Generated apple-icon.png in app/")

    # Standard logo.png in /public for Navbar
    logo = square_img.resize((512, 512), Image.Resampling.LANCZOS)
    logo.save(os.path.join(public, 'logo.png'))
    print("Generated logo.png in public/")

