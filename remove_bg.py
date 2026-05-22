import os
from PIL import Image

def make_white_transparent(image_path, output_path, threshold=240):
    if not os.path.exists(image_path):
        print(f"Error: {image_path} does not exist.")
        return
        
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # item is (r, g, b, a)
        # If r, g, b are all above the threshold, make the pixel transparent.
        if item[0] >= threshold and item[1] >= threshold and item[2] >= threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Successfully saved transparent image to {output_path}")

if __name__ == "__main__":
    make_white_transparent("logo-insti-entero2 mk3.jpg", "logo-insti-entero2 mk3.png")
