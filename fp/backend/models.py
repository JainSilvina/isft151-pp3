from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

    def to_dict(self):
        return {"id": self.id, "username": self.username}


class Material(db.Model):
    __tablename__ = "materials"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    L_cm = db.Column(db.Float)
    H_cm = db.Column(db.Float)
    T_cm = db.Column(db.Float)
    units_m2 = db.Column(db.Float)
    mortar_m3 = db.Column(db.Float)
    cement_kg = db.Column(db.Float)
    sand_m3 = db.Column(db.Float)
    lime_kg = db.Column(db.Float)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "L_cm": self.L_cm,
            "H_cm": self.H_cm,
            "T_cm": self.T_cm,
            "units_m2": self.units_m2,
            "mortar_m3": self.mortar_m3,
            "cement_kg": self.cement_kg,
            "sand_m3": self.sand_m3,
            "lime_kg": self.lime_kg,
        }


class PreMix(db.Model):
    __tablename__ = "pre_mixes"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    uso = db.Column(db.String(120))
    rendimiento_text = db.Column(db.String(250))
    rendimiento_m2_per_bolsa = db.Column(db.Float)
    peso_bolsa_kg = db.Column(db.Float)
    precio_ref = db.Column(db.Float)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "uso": self.uso,
            "rendimiento_text": self.rendimiento_text,
            "rendimiento_m2_per_bolsa": self.rendimiento_m2_per_bolsa,
            "peso_bolsa_kg": self.peso_bolsa_kg,
            "precio_ref": self.precio_ref,
        }