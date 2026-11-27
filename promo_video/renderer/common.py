import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# Theme Colors
COLOR_NAVY_DARK = (11, 15, 23)        # #0B0F17
COLOR_NAVY = (17, 24, 39)             # #111827
COLOR_INDIGO = (81, 69, 229)          # #5145E5
COLOR_INDIGO_LIGHT = (129, 140, 248)  # #818CF8
COLOR_CYAN = (6, 182, 212)            # #06B6D4
COLOR_LAVENDER = (238, 242, 255)      # #EEF2FF
COLOR_WHITE = (255, 255, 255)
COLOR_EMERALD = (16, 185, 129)
COLOR_AMBER = (245, 158, 11)
COLOR_ROSE = (244, 63, 94)

# Font Helper
FONT_REGULAR_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD_PATH = "C:/Windows/Fonts/segoeuib.ttf"
FONT_LIGHT_PATH = "C:/Windows/Fonts/segoeuil.ttf"

_font_cache = {}

def get_font(size, bold=False, light=False, regular=False, **kwargs):
    key = (size, bold, light)
    if key not in _font_cache:
        path = FONT_BOLD_PATH if bold else (FONT_LIGHT_PATH if light else FONT_REGULAR_PATH)
        try:
            _font_cache[key] = ImageFont.truetype(path, size)
        except Exception:
            _font_cache[key] = ImageFont.load_default()
    return _font_cache[key]

# Easing Functions
def ease_out_cubic(x):
    return 1.0 - math.pow(1.0 - max(0.0, min(1.0, x)), 3)

def ease_in_out_cubic(x):
    x = max(0.0, min(1.0, x))
    return 4 * x * x * x if x < 0.5 else 1.0 - math.pow(-2 * x + 2, 3) / 2

def ease_out_back(x):
    c1 = 1.70158
    c3 = c1 + 1
    x = max(0.0, min(1.0, x))
    return 1 + c3 * math.pow(x - 1, 3) + c1 * math.pow(x - 1, 2)

# Gradient Background Generator with Caching
_gradient_cache = {}

def create_radial_gradient(width=1920, height=1080, center=(960, 540), radius=1000, color_center=(30, 27, 75), color_edge=(11, 15, 23)):
    key = (width, height, center, radius, color_center, color_edge)
    if key in _gradient_cache:
        return _gradient_cache[key].copy()
        
    cx, cy = center
    Y, X = np.ogrid[:height, :width]
    dist_from_center = np.sqrt((X - cx)**2 + (Y - cy)**2)
    norm_dist = np.clip(dist_from_center / radius, 0.0, 1.0)
    
    r = (color_center[0] * (1.0 - norm_dist) + color_edge[0] * norm_dist).astype(np.uint8)
    g = (color_center[1] * (1.0 - norm_dist) + color_edge[1] * norm_dist).astype(np.uint8)
    b = (color_center[2] * (1.0 - norm_dist) + color_edge[2] * norm_dist).astype(np.uint8)
    
    rgb = np.stack([r, g, b], axis=-1)
    img = Image.fromarray(rgb, 'RGB')
    _gradient_cache[key] = img
    return img.copy()

# Glassmorphism Card Drawer
def draw_glass_card(draw, base_img, box, bg_color=(20, 27, 45, 190), border_color=(81, 69, 229, 140), radius=16, border_width=2):
    x0, y0, x1, y1 = box
    overlay = Image.new('RGBA', base_img.size, (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)
    
    # Outer soft glow
    if border_color[3] > 0:
        odraw.rounded_rectangle([x0-2, y0-2, x1+2, y1+2], radius=radius+2, fill=(border_color[0], border_color[1], border_color[2], 30))
        
    odraw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=bg_color, outline=border_color, width=border_width)
    base_img.alpha_composite(overlay)

# Ambient Floating Particles
class ParticleField:
    def __init__(self, count=60, width=1920, height=1080):
        np.random.seed(42)
        self.count = count
        self.width = width
        self.height = height
        self.x = np.random.uniform(0, width, count)
        self.y = np.random.uniform(0, height, count)
        self.speed_y = np.random.uniform(-0.6, -1.8, count)
        self.speed_x = np.random.uniform(-0.3, 0.3, count)
        self.size = np.random.uniform(2.0, 5.0, count)
        self.alpha = np.random.uniform(50, 160, count)
        
    def draw(self, base_img, frame):
        overlay = Image.new('RGBA', (self.width, self.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        for i in range(self.count):
            curr_y = (self.y[i] + self.speed_y[i] * frame) % self.height
            curr_x = (self.x[i] + self.speed_x[i] * frame) % self.width
            sz = self.size[i]
            a = int(self.alpha[i] * (0.6 + 0.4 * math.sin(frame * 0.05 + i)))
            color = (129, 140, 248, a) if i % 2 == 0 else (238, 242, 255, a)
            draw.ellipse([curr_x - sz, curr_y - sz, curr_x + sz, curr_y + sz], fill=color)
        base_img.alpha_composite(overlay)
