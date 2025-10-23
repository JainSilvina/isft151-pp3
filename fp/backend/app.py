from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from models import db, User, Material, PreMix

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# --- Endpoints de autenticación y gestión de usuarios ---

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data or not data.get("name") or not data.get("password"):
        return jsonify({"message": "Datos incompletos"}), 400

    role = data.get("role", "cliente")
    if role not in ("administrador", "cliente", "proveedor"):
        role = "cliente"

    if User.query.filter_by(username=data["name"]).first():
        return jsonify({"message": "Usuario ya existe"}), 400

    user = User(username=data["name"], password=data["password"], role=role)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Usuario registrado con éxito"}), 200


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get("name"), password=data.get("password")).first()
    if user:
        return jsonify({"message": f"Bienvenido {user.username}", "username": user.username, "role": user.role}), 200
    return jsonify({"message": "Credenciales incorrectas"}), 401


@app.route("/api/users", methods=["GET", "DELETE"])
def users_collection():
    if request.method == "GET":
        users = User.query.all()
        return jsonify([u.to_dict() for u in users]), 200

    if request.method == "DELETE":
        db.session.query(User).delete()
        db.session.commit()
        return jsonify({"message": "Usuario eliminado"}), 200


# Obtener un usuario por username (opcional)
@app.route("/api/users/<string:username>", methods=["GET", "DELETE", "PUT"])
def user_item(username):
    user = User.query.filter_by(username=username).first()
    if request.method == "GET":
        if not user:
            return jsonify({"message": "Usuario no encontrado"}), 404
        return jsonify(user.to_dict()), 200

    if request.method == "DELETE":
        if not user:
            return jsonify({"message": "Usuario no encontrado"}), 404
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": f"Usuario {username} eliminado"}), 200

    if request.method == "PUT":
        data = request.get_json()
        if not user:
            return jsonify({"message": "Usuario no encontrado"}), 404

        new_name = data.get("username")
        new_password = data.get("password")
        new_role = data.get("role")

        if new_name:
            # comprobar que no exista otro usuario con ese username
            if new_name != user.username and User.query.filter_by(username=new_name).first():
                return jsonify({"message": "El nuevo username ya existe"}), 400
            user.username = new_name

        if new_password:
            user.password = new_password

        if new_role and new_role in ("administrador", "cliente", "proveedor"):
            user.role = new_role

        db.session.commit()
        return jsonify({"message": "Usuario actualizado", "user": user.to_dict()}), 200


@app.route("/api/materials", methods=["GET"])
def get_materials():
    materials = Material.query.all()
    return jsonify([m.to_dict() for m in materials])


@app.route("/api/pre_mixes", methods=["GET"])
def get_pre_mixes():
    pre_mixes = PreMix.query.all()
    return jsonify([p.to_dict() for p in pre_mixes])


@app.route("/api/cotizar", methods=["POST"])
def cotizar():
    data = request.get_json()
    area = data.get("area")
    espesor = data.get("espesor")
    material_id = data.get("material_id")
    use_pre_mix = data.get("use_pre_mix", False)
    pre_mix_id = data.get("pre_mix_id")

    if not area or not espesor or not material_id:
        return jsonify({"message": "Faltan parámetros"}), 400

    material = Material.query.get(material_id)
    if not material:
        return jsonify({"message": "Material no encontrado"}), 404

    # Cálculo base
    bricks_needed = round(material.units_m2 * area, 2)
    mortar_m3 = round(material.mortar_m3 * area, 3)

    result = {
        "material": material.name,
        "area_m2": area,
        "espesor_cm": espesor,
        "ladrillos_necesarios": bricks_needed,
        "mortar_m3": mortar_m3,
        "detalle": "Cálculo base con mortero tradicional"
    }

    if use_pre_mix and pre_mix_id:
        pre_mix = PreMix.query.get(pre_mix_id)
        if pre_mix:
            bolsas = round(area / pre_mix.rendimiento_m2_per_bolsa, 2)
            costo = round(bolsas * pre_mix.precio_ref, 2)
            result.update({
                "pre_mix": pre_mix.name,
                "uso": pre_mix.uso,
                "bolsas_necesarias": bolsas,
                "costo_estimado": costo,
                "detalle": f"Cálculo con premezcla: {pre_mix.name}"
            })

    return jsonify(result), 200


if __name__ == "__main__":
    app.run(debug=True)
