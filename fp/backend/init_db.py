import sqlite3
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "instance", "sqlite.db")
os.makedirs(os.path.join(BASE_DIR, "instance"), exist_ok=True)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
)
""")

cur.execute("INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)", ("admin", "1234", "administrador"))

cur.execute("""
CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    L_cm REAL,
    H_cm REAL,
    T_cm REAL,
    units_m2 REAL,
    mortar_m3 REAL,
    cement_kg REAL,
    sand_m3 REAL,
    lime_kg REAL
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS pre_mixes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    uso TEXT,
    rendimiento_text TEXT,
    rendimiento_m2_per_bolsa REAL,
    peso_bolsa_kg REAL,
    precio_ref REAL
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS user_materials (
    user_id INTEGER,
    material_id INTEGER,
    PRIMARY KEY (user_id, material_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (material_id) REFERENCES materials(id)
)
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS user_pre_mixes (
    user_id INTEGER,
    pre_mix_id INTEGER,
    PRIMARY KEY (user_id, pre_mix_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pre_mix_id) REFERENCES pre_mixes(id)
)
""")

materials = [
    ("Ladrillo visto 24x12x6", 24, 12, 6, 30.8, 0.020, 13, 0.055, 4),
    ("Ladrillo medio 9 cm", 24, 13, 9, 28.6, 0.018, 12, 0.050, 4),
    ("Ladrillo 12 cm", 24, 12, 12, 25.6, 0.018, 12, 0.050, 4),
    ("Ladrillo común 30x15x7", 30, 15, 7, 20.2, 0.018, 12, 0.050, 6),
    ("Bloque hormigón 39x19x14", 39, 19, 14, 12.5, 0.030, 10, 0.070, 0),
    ("Ladrillo hueco 33x18x14", 33, 18, 14, 15.5, 0.025, 11, 0.060, 0),
]
cur.executemany("""
INSERT OR IGNORE INTO materials (name, L_cm, H_cm, T_cm, units_m2, mortar_m3, cement_kg, sand_m3, lime_kg)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""", materials)

pre_mixes = [
    ("Procem Tradicional", "mampostería / revoque", "Rendimiento aprox. 1 m2 por bolsa 25-30kg según espesor", 1.0, 30, 1500.0),
    ("Klaukol Maximo", "adhesivo / pega cerámica", "Rendimiento variable, 4-6 m2 por bolsa 20kg segun uso", 5.0, 20, 2200.0),
]
cur.executemany("""
INSERT OR IGNORE INTO pre_mixes (name, uso, rendimiento_text, rendimiento_m2_per_bolsa, peso_bolsa_kg, precio_ref)
VALUES (?, ?, ?, ?, ?, ?)
""", pre_mixes)

for i in range(1, 7):
    cur.execute("INSERT OR IGNORE INTO user_materials (user_id, material_id) VALUES (?, ?)", (1, i))
for i in range(1, 3):
    cur.execute("INSERT OR IGNORE INTO user_pre_mixes (user_id, pre_mix_id) VALUES (?, ?)", (1, i))

conn.commit()
conn.close()
print("✅ init_db listo.")