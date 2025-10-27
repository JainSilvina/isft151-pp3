from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Material, PreMix, MaterialPrice, PreMixPrice, Supplier
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Datos incompletos"}), 400

    role = data.get("role", "cliente")
    if role not in ("administrador", "cliente", "proveedor"):
        role = "cliente"

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"message": "Usuario ya existe"}), 400

    user = User(username=data["username"], password=data["password"], role=role)
    db.session.add(user)
    db.session.commit()

    if role == "proveedor":
        supplier = Supplier(name=f"Proveedor {user.username}", user_id=user.id)
        db.session.add(supplier)
        db.session.commit()

    return jsonify({"message": "Usuario registrado correctamente"}), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Datos incompletos"}), 400

    user = User.query.filter_by(username=data["username"], password=data["password"]).first()
    if not user:
        return jsonify({"message": "Usuario o contraseña incorrectos"}), 401

    supplier_id = None
    if user.role == "proveedor":
        supplier = Supplier.query.filter_by(user_id=user.id).first()
        supplier_id = supplier.id if supplier else None

    return jsonify({
        "message": "Login exitoso",
        "username": user.username,
        "role": user.role,
        "supplier_id": supplier_id
    })

@app.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "role": u.role} for u in users])


@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Usuario no encontrado"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Usuario eliminado"})


@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Usuario no encontrado"}), 404
    user.username = data.get("username", user.username)
    user.password = data.get("password", user.password)
    user.role = data.get("role", user.role)
    db.session.commit()
    return jsonify({"message": "Usuario actualizado"})

@app.route("/api/materials", methods=["GET"])
def get_materials():
    mats = Material.query.all()
    return jsonify([m.to_dict() for m in mats])


@app.route("/api/pre_mixes", methods=["GET"])
def get_pre_mixes():
    mixes = PreMix.query.all()
    return jsonify([p.to_dict() for p in mixes])


@app.route("/api/materials/prices", methods=["GET"])
def get_material_prices():
    materials = Material.query.all()
    result = []
    for m in materials:
        prices = MaterialPrice.query.filter_by(material_id=m.id).all()
        result.append({
            "id": m.id,
            "name": m.name,
            "prices": [{
                "price_id": p.id,
                "price": p.price,
                "unit": p.unit,
                "supplier_name": p.supplier.name,
                "supplier_id": p.supplier_id
            } for p in prices]
        })
    return jsonify(result)


@app.route("/api/premixes/prices", methods=["GET"])
def get_premix_prices():
    mixes = PreMix.query.all()
    result = []
    for p in mixes:
        prices = PreMixPrice.query.filter_by(pre_mix_id=p.id).all()
        result.append({
            "id": p.id,
            "name": p.name,
            "prices": [{
                "price_id": pr.id,
                "price": pr.price,
                "unit": pr.unit,
                "supplier_name": pr.supplier.name,
                "supplier_id": pr.supplier_id
            } for pr in prices]
        })
    return jsonify(result)

@app.route("/api/prices/<int:price_id>", methods=["PUT"])
def update_price(price_id):
    data = request.get_json()
    price = MaterialPrice.query.get(price_id) or PreMixPrice.query.get(price_id)
    if not price:
        return jsonify({"message": "Precio no encontrado"}), 404

    price.price = float(data.get("price", price.price))
    price.unit = data.get("unit", price.unit)
    db.session.commit()
    return jsonify({"message": "Precio actualizado correctamente"})

@app.route("/api/cotizar", methods=["POST"])
def cotizar():
    data = request.get_json()

    try:
        area = float(data.get("area", 0))
        espesor = float(data.get("espesor", 0))
        junta = float(data.get("junta", 1.5)) 
        material_id = int(data.get("material_id"))
        pre_mix_id = data.get("pre_mix_id")
        use_pre_mix = bool(data.get("use_pre_mix", False))
    except (TypeError, ValueError):
        return jsonify({"message": "Datos inválidos"}), 400

    material = Material.query.get(material_id)
    if not material:
        return jsonify({"message": "Material no encontrado"}), 404

    pre_mix = None
    if use_pre_mix and pre_mix_id:
        pre_mix = PreMix.query.get(pre_mix_id)

    espesor_base = getattr(material, "espesor_cm", 18)
    factor_espesor = espesor / espesor_base if espesor_base else 1.0

    factor_junta = 1 + ((junta - 1.0) / 10.0)

    volumen_muro = area * (espesor / 100)

    revoque_extra = 0
    if espesor > espesor_base:
        revoque_extra = area * ((espesor - espesor_base) / 100) * 0.3

    required_units = round(area * material.units_m2 * factor_espesor, 2)
    total_mortar_m3 = round((area * material.mortar_m3 * factor_espesor * factor_junta) + revoque_extra, 3)
    cement_kg = round(area * material.cement_kg * factor_espesor * factor_junta, 2)
    sand_m3 = round(area * material.sand_m3 * factor_espesor * factor_junta, 3)
    lime_kg = round(area * material.lime_kg * factor_espesor * factor_junta, 2)

    premix_bags = None
    if pre_mix and pre_mix.rendimiento_m2_per_bolsa:
        premix_bags = round(area / pre_mix.rendimiento_m2_per_bolsa, 2)

    result = {
        "area": area,
        "espesor_cm": espesor,
        "junta_cm": junta,
        "factor_junta": round(factor_junta, 3),
        "material": material.to_dict(),
        "required_units": required_units,
        "total_mortar_m3": total_mortar_m3,
        "cement_kg": cement_kg,
        "sand_m3": sand_m3,
        "lime_kg": lime_kg,
        "pre_mix": pre_mix.to_dict() if pre_mix else None,
        "premix_bags": premix_bags,
        "espesor_base": espesor_base,
        "revoque_extra_m3": round(revoque_extra, 3),
        "factor_espesor": round(factor_espesor, 2)
    }

    return jsonify(result), 200