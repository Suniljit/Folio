# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ["backend/run_server.py"],
    pathex=["."],
    datas=[
        ("backend/alembic", "backend/alembic"),
        ("backend/alembic.ini", "backend"),
        ("frontend/dist", "frontend/dist"),
    ],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="folio-backend",
    debug=False,
    strip=False,
    upx=True,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    name="folio-backend",
)
