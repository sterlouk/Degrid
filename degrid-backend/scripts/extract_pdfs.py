#!/usr/bin/env python3
"""
Extract text and images from all PDFs in the workspace into docs/pdf-assets/<pdf-safe-name>/
Requires: PyMuPDF (pip install pymupdf)
"""
import fitz
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'docs' / 'pdf-assets'
OUT.mkdir(parents=True, exist_ok=True)

# find pdfs in root (non-recursive may miss some, so walk)
pdfs = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    for fn in filenames:
        if fn.lower().endswith('.pdf'):
            pdfs.append(Path(dirpath) / fn)

if not pdfs:
    print('No PDF files found under', ROOT)
    raise SystemExit(0)

safe_name = lambda p: re.sub(r'[^0-9A-Za-z._-]+', '_', p.stem)

for pdf in pdfs:
    print('Processing', pdf)
    try:
        doc = fitz.open(str(pdf))
    except Exception as e:
        print('  ERROR opening', pdf, e)
        continue
    outdir = OUT / safe_name(pdf)
    outdir.mkdir(parents=True, exist_ok=True)
    # write meta
    meta_file = outdir / 'metadata.txt'
    with open(meta_file, 'w', encoding='utf-8') as mf:
        mf.write(f'Path: {pdf}\nPages: {doc.page_count}\n')
    # extract page text
    for i, page in enumerate(doc, start=1):
        txt = page.get_text()
        tfile = outdir / f'page-{i}.txt'
        with open(tfile, 'w', encoding='utf-8') as f:
            f.write(txt or '')
        # extract images on page
        images = page.get_images(full=True)
        if images:
            for img_index, img in enumerate(images, start=1):
                xref = img[0]
                base_image = doc.extract_image(xref)
                img_bytes = base_image['image']
                ext = base_image.get('ext', 'png')
                img_name = outdir / f'page-{i}-img-{img_index}.{ext}'
                with open(img_name, 'wb') as imf:
                    imf.write(img_bytes)
    print('  done ->', outdir)

print('\nAll done. Output under', OUT)
