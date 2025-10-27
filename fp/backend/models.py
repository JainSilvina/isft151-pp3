from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="cliente")

    def __repr__(self):
        return f"<User {self.username}>"

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    user = db.relationship("User", backref=db.backref("supplier", uselist=False))

    def __repr__(self):
        return f"<Supplier {self.name}>"

class Material(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    units_m2 = db.Column(db.Float, nullable=False)
    mortar_m3 = db.Column(db.Float, nullable=False)
    cement_kg = db.Column(db.Float, nullable=False)
    sand_m3 = db.Column(db.Float, nullable=False)
    lime_kg = db.Column(db.Float, nullable=False)
    espesor_cm = db.Column(db.Float, nullable=False, default=18.0) 

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "units_m2": self.units_m2,
            "mortar_m3": self.mortar_m3,
            "cement_kg": self.cement_kg,
            "sand_m3": self.sand_m3,
            "lime_kg": self.lime_kg,
            "espesor_cm": self.espesor_cm
        }

    def __repr__(self):
        return f"<Material {self.name}>"

class PreMix(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    uso = db.Column(db.String(120))
    rendimiento_m2_per_bolsa = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "uso": self.uso,
            "rendimiento_m2_per_bolsa": self.rendimiento_m2_per_bolsa
        }

    def __repr__(self):
        return f"<PreMix {self.name}>"


class MaterialPrice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    material_id = db.Column(db.Integer, db.ForeignKey("material.id"), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey("supplier.id"), nullable=False)
    price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)

    material = db.relationship("Material", backref=db.backref("prices", lazy=True))
    supplier = db.relationship("Supplier", backref=db.backref("material_prices", lazy=True))

    def __repr__(self):
        return f"<MaterialPrice {self.material.name} - {self.supplier.name}>"


class PreMixPrice(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    pre_mix_id = db.Column(db.Integer, db.ForeignKey("pre_mix.id"), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey("supplier.id"), nullable=False)
    price = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=False)

    pre_mix = db.relationship("PreMix", backref=db.backref("prices", lazy=True))
    supplier = db.relationship("Supplier", backref=db.backref("premix_prices", lazy=True))

    def __repr__(self):
        return f"<PreMixPrice {self.pre_mix.name} - {self.supplier.name}>"