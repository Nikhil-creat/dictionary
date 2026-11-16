"""Generate raster icons and 1200x630 social share images from SVG. Needs rsvg-convert + ImageMagick (convert).
Run: python3 scripts/make-assets.py"""
import subprocess, pathlib, html
root = pathlib.Path(__file__).resolve().parent.parent
pub = root / "public"

def rsvg(svg_path, out, w, h):
    subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(h), str(svg_path), "-o", str(out)], check=True)

fav = pub / "favicon.svg"
rsvg(fav, pub / "icon-192.png", 192, 192)
rsvg(fav, pub / "icon-512.png", 512, 512)
rsvg(fav, pub / "apple-touch-icon.png", 180, 180)
rsvg(fav, root / "scripts" / ".fav32.png", 32, 32)
subprocess.run(["convert", str(root / "scripts" / ".fav32.png"), str(pub / "favicon.ico")], check=True)
(root / "scripts" / ".fav32.png").unlink()

CARDS = {
    "og-default": ("Dictionary", "Words, names & meanings in every language"),
    "og-lookup": ("Word & name lookup", "Definitions · IPA · etymology · flashcards"),
    "og-names": ("Name meanings", "Origin and meaning in 10 languages and scripts"),
    "og-features": ("Features", "Agentic AI · RAG · vision · LexiBot"),
    "og-architecture": ("Architecture", "Docker microservices · FastAPI · Qdrant"),
    "og-security": ("Security & limits", "Grounded answers · zero-retention media"),
    "og-about": ("About the builder", "Credentials · projects · contact"),
    "og-privacy": ("Privacy", "No accounts · no analytics · no ads"),
}
TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="DejaVu Sans, Verdana, sans-serif">
<defs><radialGradient id="bg" cx="0.7" cy="0.35" r="0.9"><stop offset="0" stop-color="#1d2c70"/><stop offset="0.5" stop-color="#0a1134"/><stop offset="1" stop-color="#03040b"/></radialGradient>
<radialGradient id="pl" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#7da6ff"/><stop offset="0.55" stop-color="#3a3fb8"/><stop offset="1" stop-color="#0c1040"/></radialGradient>
<linearGradient id="ln" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8b5cff"/><stop offset="1" stop-color="#5ef0ff"/></linearGradient>
<clipPath id="c"><circle cx="930" cy="330" r="190"/></clipPath></defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<g stroke="#8caaff" stroke-opacity="0.10">{grid}</g>
<circle cx="930" cy="330" r="214" fill="none" stroke="#5ef0ff" stroke-opacity="0.25" stroke-width="2"/>
<circle cx="930" cy="330" r="190" fill="url(#pl)"/>
<g clip-path="url(#c)" stroke="#9fd8ff" stroke-opacity="0.35" fill="none"><ellipse cx="930" cy="330" rx="190" ry="60"/><ellipse cx="930" cy="330" rx="190" ry="120"/><ellipse cx="930" cy="330" rx="60" ry="190"/><ellipse cx="930" cy="330" rx="120" ry="190"/><line x1="740" y1="330" x2="1120" y2="330"/></g>
<circle cx="870" cy="290" r="9" fill="#ffd28c"/><circle cx="1000" cy="360" r="7" fill="#ffd28c"/><circle cx="940" cy="420" r="6" fill="#ffd28c"/>
<rect x="70" y="120" width="120" height="6" rx="3" fill="url(#ln)"/>
<text x="70" y="100" font-size="22" letter-spacing="6" fill="#5ef0ff">DICTIONARY</text>
<text x="70" y="{ty}" font-size="{fs}" font-weight="700" fill="#ffffff">{title}</text>
<text x="70" y="{sy}" font-size="26" fill="#b9c9ff">{sub}</text>
<text x="70" y="570" font-size="22" fill="#7f93c9">Words · Names · 10 languages</text>
</svg>"""
grid = "".join(f'<line x1="{x}" y1="0" x2="{x}" y2="630"/>' for x in range(0, 1200, 60)) + "".join(f'<line x1="0" y1="{y}" x2="1200" y2="{y}"/>' for y in range(0, 630, 60))
for name, (title, sub) in CARDS.items():
    fs = 92 if len(title) <= 12 else 66 if len(title) <= 20 else 54
    svg = TEMPLATE.format(grid=grid, title=html.escape(title), sub=html.escape(sub), fs=fs, ty=330, sy=395)
    tmp = root / "scripts" / f".{name}.svg"
    tmp.write_text(svg, encoding="utf-8")
    rsvg(tmp, pub / f"{name}.png", 1200, 630)
    tmp.unlink()
print("assets written to public/")
