#!/usr/bin/env python3
"""Build a dependency-light, architecture-independent Debian package."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'artifacts/fable-map-studio_0.3.1_all.deb'
OUTPUT.parent.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='fable-deb-') as stage:
    stage = Path(stage)
    share = stage / 'usr/share/fable-map-studio'
    share.mkdir(parents=True)
    shutil.copytree(ROOT / 'app', share / 'app')
    shutil.copy2(ROOT / 'packaging/fable.py', share / 'fable.py')
    (share / 'tests').mkdir()
    shutil.copy2(ROOT / 'tests/native-interactions.js', share / 'tests/native-interactions.js')
    shutil.copy2(ROOT / 'tests/alpha-import.js', share / 'tests/alpha-import.js')
    shutil.copy2(ROOT / 'tests/atmosphere-render.js', share / 'tests/atmosphere-render.js')
    bindir = stage / 'usr/bin'
    bindir.mkdir(parents=True)
    launcher = bindir / 'fable-map-studio'
    launcher.write_text('#!/bin/sh\nexec /usr/bin/python3 /usr/share/fable-map-studio/fable.py "$@"\n')
    launcher.chmod(0o755)
    desktop = stage / 'usr/share/applications'
    desktop.mkdir(parents=True)
    (desktop / 'fable-map-studio.desktop').write_text(
        '[Desktop Entry]\nName=Fable Map Studio\nComment=Paint atmospheric tabletop maps\n'
        'Exec=fable-map-studio\nIcon=fable-map-studio\nTerminal=false\nType=Application\n'
        'Categories=Graphics;2DGraphics;Game;\nKeywords=DnD;Dungeons;Map;Tabletop;\nStartupWMClass=fable.py\n')
    icons = stage / 'usr/share/icons/hicolor/scalable/apps'
    icons.mkdir(parents=True)
    shutil.copy2(ROOT / 'app/assets/fable.svg', icons / 'fable-map-studio.svg')
    docs = stage / 'usr/share/doc/fable-map-studio'
    docs.mkdir(parents=True)
    shutil.copy2(ROOT / 'README.md', docs / 'README.md')
    shutil.copy2(ROOT / 'LICENSE', docs / 'copyright')
    control = stage / 'DEBIAN'
    control.mkdir()
    size = sum(p.stat().st_size for p in stage.rglob('*') if p.is_file()) // 1024
    (control / 'control').write_text(
        'Package: fable-map-studio\nVersion: 0.3.1\nSection: graphics\nPriority: optional\n'
        'Architecture: all\nMaintainer: Fable Project <fable@localhost>\n'
        'Depends: python3 (>= 3.10), python3-gi, gir1.2-gtk-3.0, gir1.2-webkit2-4.1\n'
        f'Installed-Size: {size}\n'
        'Description: Offline DnD map painter\n'
        ' Paint dungeon walls, rooms, terrain, props, and atmospheric lighting.\n'
        ' Includes snapping, undo, project files, and high resolution PNG export.\n')
    # Debian tools require conventional directory/file modes, regardless of umask.
    for path in stage.rglob('*'):
        path.chmod(0o755 if path.is_dir() or path == launcher else 0o644)
    subprocess.run(['dpkg-deb', '--root-owner-group', '--build', str(stage), str(OUTPUT)], check=True)
print(OUTPUT)
