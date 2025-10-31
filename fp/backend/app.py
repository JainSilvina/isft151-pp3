from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, User, Material, PreMix, MaterialPrice, PreMixPrice, Supplier
from config import Config
import math

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/api/items", methods=["POST"])
def create_item():
    """Ruta para crear un nuevo Material o PreMix (como lo solicita el proveedor).
    Se usan valores por defecto para los campos técnicos."""
    data = request.get_json()
    item_type = data.get("type") 
    name = data.get("name")
    
    if not item_type or not name:
        return jsonify({"message": "Datos incompletos para crear el ítem (type, name)."}), 400

    try:
        if item_type == "material" and Material.query.filter_by(name=name).first():
            return jsonify({"message": f"El Material '{name}' ya existe."}), 409
        if item_type == "pre_mix" and PreMix.query.filter_by(name=name).first():
            return jsonify({"message": f"La Pre Mezcla '{name}' ya existe."}), 409

        if item_type == "material":
            new_item = Material(
                name=name, 
                units_m2=0, mortar_m3=0, cement_kg=0, sand_m3=0, lime_kg=0, espesor_cm=18.0
            )
            
        elif item_type == "pre_mix":
            new_item = PreMix(
                name=name, 
                uso="indefinido", rendimiento_m2_per_bolsa=0 
            )
            
        else:
            return jsonify({"message": "Tipo de ítem inválido."}), 400

        db.session.add(new_item)
        db.session.commit()
        return jsonify({
            "message": f"{item_type.capitalize()} creado correctamente.",
            "id": new_item.id,
            "name": new_item.name,
            "type": item_type
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error al crear el {item_type}: {str(e)}"}), 500

@app.route("/api/all_items", methods=["GET"])
def get_all_items():
    """Ruta para obtener todos los materiales y premezclas (para el formulario de alta de proveedor)."""
    materials = Material.query.all()
    premixes = PreMix.query.all()

    all_items = []
    
    for mat in materials:
        all_items.append({
            "type": "material",
            "id": mat.id,
            "name": mat.name,
        })
        
    for premix in premixes:
        all_items.append({
            "type": "pre_mix",
            "id": premix.id,
            "name": premix.name,
        })
        
    return jsonify(all_items), 200

@app.route("/api/prices", methods=["POST"])
def create_price():
    """Ruta para Alta (Creación) de un nuevo precio por parte de un proveedor."""
    data = request.get_json()
    
    user_id = data.get("user_id") 
    price = data.get("price")
    unit = data.get("unit")
    material_id = data.get("material_id")
    pre_mix_id = data.get("pre_mix_id")
    
    if not user_id or price is None or not unit or not (material_id or pre_mix_id):
        return jsonify({"message": "Datos incompletos para crear el precio (user_id, price, unit, y un ID de material/premix son requeridos)."}), 400

    try:
        supplier = Supplier.query.filter_by(user_id=user_id).first()
        if not supplier:
            return jsonify({"message": "Usuario no es un proveedor registrado."}), 403
        
        if material_id:
            if MaterialPrice.query.filter_by(material_id=material_id, supplier_id=supplier.id).first():
                return jsonify({"message": "Ya existe un precio para este material. Use la función de edición."}), 409
      
            new_price = MaterialPrice(
                material_id=material_id, 
                supplier_id=supplier.id, 
                price=float(price), 
                unit=unit
            )
        elif pre_mix_id:
            if PreMixPrice.query.filter_by(pre_mix_id=pre_mix_id, supplier_id=supplier.id).first():
                return jsonify({"message": "Ya existe un precio para esta premezcla. Use la función de edición."}), 409

            new_price = PreMixPrice(
                pre_mix_id=pre_mix_id, 
                supplier_id=supplier.id, 
                price=float(price), 
                unit=unit
            )
        else:
            return jsonify({"message": "Debe especificar material_id o pre_mix_id."}), 400
        
        db.session.add(new_price)
        db.session.commit()
        return jsonify({"message": "Precio creado correctamente", "price_id": new_price.id}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error interno: {str(e)}"}), 500

@app.route("/api/supplier/prices/<int:user_id>", methods=["GET"])
def get_supplier_prices(user_id):
    """(NUEVA) Ruta para obtener todos los precios de un proveedor específico (para ABM)."""
    supplier = Supplier.query.filter_by(user_id=user_id).first()
    if not supplier:
        return jsonify({"message": "Proveedor no encontrado o no registrado."}), 404

    material_prices = db.session.query(MaterialPrice, Material.name).join(Material).filter(MaterialPrice.supplier_id == supplier.id).all()
    premix_prices = db.session.query(PreMixPrice, PreMix.name).join(PreMix).filter(PreMixPrice.supplier_id == supplier.id).all()

    results = []
    for mp, material_name in material_prices:
        results.append({
            "id": mp.id, "type": "material", "item_id": mp.material_id,
            "item_name": material_name, "price": mp.price, "unit": mp.unit,
        })
    for pp, premix_name in premix_prices:
        results.append({
            "id": pp.id, "type": "pre_mix", "item_id": pp.pre_mix_id,
            "item_name": premix_name, "price": pp.price, "unit": pp.unit,
        })

    return jsonify(results), 200

@app.route("/api/prices/<int:price_id>", methods=["PUT"])
def update_price_by_id(price_id):
    """(NUEVA) Ruta para modificar un precio de material/premezcla (Proveedor)."""
    data = request.get_json()
    user_id = data.get("user_id")
    new_price = data.get("price")
    new_unit = data.get("unit")
    item_type = data.get("type") 

    if not user_id or new_price is None or not new_unit or not item_type:
        return jsonify({"message": "Datos incompletos para actualizar el precio (user_id, price, unit, type)."}, 400)

    supplier = Supplier.query.filter_by(user_id=user_id).first()
    if not supplier:
        return jsonify({"message": "Usuario no es un proveedor registrado."}, 403)
        
    try:
        new_price_float = float(new_price)
    except ValueError:
        return jsonify({"message": "El precio debe ser un valor numérico."}, 400)

    price_entry = None
    if item_type == 'material':
        price_entry = MaterialPrice.query.get(price_id)
    elif item_type == 'pre_mix':
        price_entry = PreMixPrice.query.get(price_id)
    else:
        return jsonify({"message": "Tipo de ítem inválido."}, 400)

    if not price_entry:
        return jsonify({"message": "Precio no encontrado."}, 404)
        
    if price_entry.supplier_id != supplier.id:
        return jsonify({"message": "No tiene permiso para editar este precio."}, 403)

    price_entry.price = new_price_float
    price_entry.unit = new_unit
    db.session.commit()
    return jsonify({"message": "Precio actualizado correctamente"}), 200

@app.route("/api/prices/<int:price_id>", methods=["DELETE"])
def delete_price_by_id(price_id):
    """(NUEVA) Ruta para eliminar un precio de material/premezcla (Proveedor)."""
    
    material_price = MaterialPrice.query.get(price_id)
    if material_price:
        db.session.delete(material_price)
        db.session.commit()
        return jsonify({"message": "Precio de material eliminado correctamente"}), 200

    premix_price = PreMixPrice.query.get(price_id)
    if premix_price:
        db.session.delete(premix_price)
        db.session.commit()
        return jsonify({"message": "Precio de premezcla eliminado correctamente"}), 200

    return jsonify({"message": "Precio no encontrado"}), 404

@app.route("/api/materials")
def get_materials():
    """Obtiene la lista completa de materiales (ladrillos/bloques)."""
    materials = Material.query.all()
    return jsonify([m.to_dict() for m in materials]), 200

@app.route("/api/pre_mixes")
def get_pre_mixes():
    """Obtiene la lista completa de premezclas."""
    pre_mixes = PreMix.query.all()
    return jsonify([pm.to_dict() for pm in pre_mixes]), 200

@app.route("/api/prices/needed", methods=["POST"])
def get_needed_prices():
    """
    (ORIGINAL RESTAURADA) Ruta que busca precios para los materiales requeridos por el cotizador (CLIENTE).
    """
    data = request.get_json()
    required_items = data.get("required_items", [])
 
    item_identifiers = set() 
    for item in required_items:
        if item.get("type") == "base":
            name = item.get("name")
            if name == "Piedra": name = "Piedra/Grava" 
            item_identifiers.add(("base", name))
        elif item.get("type") == "material":
            item_identifiers.add(("material", item.get("id")))
        elif item.get("type") == "premix":
            item_identifiers.add(("premix", item.get("id")))

    prices_summary = []
    
    for item_type, identifier in item_identifiers:
        current_item_prices = []
        item_name = ""

        if item_type == "base":
            material = Material.query.filter(Material.name.like(f"%{identifier}%")).first()
            if material:
                item_name = material.name
                for price_obj in material.prices:
                    current_item_prices.append({
                        "price_id": price_obj.id,
                        "supplier": price_obj.supplier.name,
                        "price": price_obj.price,
                        "unit": price_obj.unit,
                        "supplier_id": price_obj.supplier_id
                    })
        elif item_type == "material":
            material = Material.query.get(identifier)
            if material:
                item_name = material.name
                for price_obj in material.prices:
                    current_item_prices.append({
                        "price_id": price_obj.id,
                        "supplier": price_obj.supplier.name,
                        "price": price_obj.price,
                        "unit": price_obj.unit,
                        "supplier_id": price_obj.supplier_id
                    })
        elif item_type == "premix":
            premix = PreMix.query.get(identifier)
            if premix:
                item_name = premix.name
                for price_obj in premix.prices:
                    current_item_prices.append({
                        "price_id": price_obj.id,
                        "supplier": price_obj.supplier.name,
                        "price": price_obj.price,
                        "unit": price_obj.unit,
                        "supplier_id": price_obj.supplier_id
                    })
        
        if current_item_prices:
            prices_summary.append({
                "item_name": item_name,
                "item_type": item_type,
                "item_id": identifier if item_type == 'material' or item_type == 'premix' else item_name,
                "prices": current_item_prices
            })

    return jsonify({"prices_summary": prices_summary}), 200

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username, password=password).first()

    if user:
        return jsonify({"id": user.id, "username": user.username, "role": user.role}), 200
    else:
        return jsonify({"message": "Credenciales inválidas"}), 401

@app.route("/api/register", methods=["POST"])
def register():
    """Ruta para registrar nuevos usuarios con rol 'cliente' por defecto."""
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Faltan usuario o contraseña"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "El usuario ya existe"}), 400

    # RESTAURADO: Volvemos a guardar la contraseña en texto plano
    new_user = User(username=username, password=password, role="cliente")
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Usuario cliente registrado correctamente"}), 201

@app.route("/api/cotizar", methods=["POST"])
def cotizar_ladrillos():
    """(ORIGINAL RESTAURADA) Ruta para cotizar materiales para muros (ladrillos/bloques)."""
    data = request.get_json()

    
    try:
        area = float(data.get("area", 0))
        espesor_cm = float(data.get("espesor", 0)) 
        junta_mm = float(data.get("junta", 10)) 
        material_id = data.get("material_id")
        use_pre_mix = data.get("use_pre_mix", False)
        pre_mix_id = data.get("pre_mix_id")
    except (TypeError, ValueError):
        return jsonify({"message": "Datos de entrada inválidos"}), 400

    if area <= 0 or espesor_cm <= 0 or not material_id:
        return jsonify({"message": "Área, espesor y material son requeridos y deben ser mayores a cero"}), 400

   
    material = Material.query.get(material_id)
    if not material:
        return jsonify({"message": "Material no encontrado"}), 404
        
    espesor_base = material.espesor_cm 
    factor_espesor = espesor_cm / espesor_base 

    required_units = math.ceil(area * material.units_m2 * factor_espesor)

    total_mortar_m3 = required_units * material.mortar_m3
  
    revoque_extra = 0.0
    if espesor_cm > espesor_base:
        espesor_revoque_m = (espesor_cm - espesor_base) / 100.0
        revoque_extra = area * espesor_revoque_m
    
    total_mortar_m3 += revoque_extra
    
    cement_kg = 0.0
    sand_m3 = 0.0
    lime_kg = 0.0
    premix_bags = None
    premix_name = None
    premix = None 

    if not use_pre_mix:
        cement_kg = round(required_units * material.cement_kg, 2)
        sand_m3 = round(required_units * material.sand_m3, 3)
        lime_kg = round(required_units * material.lime_kg, 2)
        
    else: 
        if not pre_mix_id:
            return jsonify({"message": "Debe seleccionar una Premezcla"}), 400
        
        premix = PreMix.query.get(pre_mix_id)
        if not premix:
            return jsonify({"message": "Premezcla no encontrada"}), 404
            
        premix_name = premix.name
        
        MORTERO_M3_PER_BAG = 0.015 
        premix_bags = math.ceil(total_mortar_m3 / MORTERO_M3_PER_BAG)


    result = {
        "tipo": "Ladrillos/Bloques",
        "material": material.to_dict(),
        "area": round(area, 2),
        "espesor_cm": round(espesor_cm, 2),
        "espesor_base": round(espesor_base, 2),
        "factor_espesor": round(factor_espesor, 2),
        "junta_mm": round(junta_mm, 2),
        "required_units": required_units,
        "total_mortar_m3": round(total_mortar_m3, 3),
        "revoque_extra_m3": round(revoque_extra, 3),
        "use_pre_mix": use_pre_mix,
        "pre_mix": premix.to_dict() if use_pre_mix and premix else None,
        "premix_bags": premix_bags,
        "cement_kg": cement_kg,
        "sand_m3": sand_m3,
        "lime_kg": lime_kg,
        "cement_bags": int(math.ceil(cement_kg / 50)) if not use_pre_mix else None, 
    }

    return jsonify(result), 200

@app.route("/api/cotizar/revoque", methods=["POST"])
def cotizar_revoque():
    """Ruta para cotizar materiales para revoque grueso a la cal."""
    data = request.get_json()

    try:
        area = float(data.get("area", 0))
        espesor_cm = float(data.get("espesor", 2.0)) 
    except (TypeError, ValueError):
        return jsonify({"message": "Datos de área o espesor inválidos"}), 400

    if area <= 0 or espesor_cm <= 0:
        return jsonify({"message": "El área y el espesor deben ser mayores a cero"}), 400

    CEMENTO_BASE_KG = 6.4 
    CAL_BASE_KG = 2.4     
    ARENA_BASE_M3 = 0.015 
    
    factor_espesor = espesor_cm / 2.0

   
    cement_kg = round(area * CEMENTO_BASE_KG * factor_espesor, 2)
    lime_kg = round(area * CAL_BASE_KG * factor_espesor, 2)
    sand_m3 = round(area * ARENA_BASE_M3 * factor_espesor, 3)
    cement_bags = int(math.ceil(cement_kg / 50)) 
    
    result = {
        "tipo": "Revoque",
        "dosificacion": "Grueso a la Cal (proporcional al área/espesor)",
        "area": round(area, 2),
        "espesor_cm": round(espesor_cm, 2),
        "cement_kg": cement_kg,
        "cement_bags": cement_bags,
        "lime_kg": lime_kg,
        "sand_m3": sand_m3,
        "factor_espesor": round(factor_espesor, 2)
    }

    return jsonify(result), 200

@app.route("/api/cotizar/hormigon", methods=["POST"])
def cotizar_hormigon():
    """Ruta para cotizar materiales para hormigón H-21 (Residencial)."""
    data = request.get_json()

    volumen_m3_input = float(data.get("volumen_m3", 0))
    volumen_m3 = 0.0
    largo = float(data.get("largo", 0))
    ancho = float(data.get("ancho", 0))
    espesor_cm = float(data.get("espesor_cm", 0))

    if largo > 0 and ancho > 0 and espesor_cm > 0:
        espesor_m = espesor_cm / 100.0
        volumen_m3 = round(largo * ancho * espesor_m, 3)
    elif volumen_m3_input > 0:
        volumen_m3 = volumen_m3_input
    else:
        return jsonify({"message": "Debe ingresar el Volumen (m³) o Largo (m), Ancho (m) y Espesor (cm)."}), 400

    if volumen_m3 <= 0:
        return jsonify({"message": "El volumen calculado o ingresado debe ser mayor a cero"}), 400

    CEMENTO_BASE_KG = 350.0 
    ARENA_BASE_M3 = 0.5   
    PIEDRA_BASE_M3 = 0.8  
    
    cement_kg = round(volumen_m3 * CEMENTO_BASE_KG, 2)
    sand_m3 = round(volumen_m3 * ARENA_BASE_M3, 3)
    gravel_m3 = round(volumen_m3 * PIEDRA_BASE_M3, 3) 
    cement_bags = int(math.ceil(cement_kg / 50))
    
    result = {
        "tipo": "Hormigón",
        "dosificacion": "H-21 (350:0.5:0.8)",
        "volumen_m3": volumen_m3,
        "cement_kg": cement_kg,
        "cement_bags": cement_bags,
        "sand_m3": sand_m3,
        "gravel_m3": gravel_m3,
        "largo": round(largo, 2) if largo > 0 else None,
        "ancho": round(ancho, 2) if ancho > 0 else None,
        "espesor_cm": round(espesor_cm, 2) if espesor_cm > 0 else None,
    }

    return jsonify(result), 200


@app.route("/api/users", methods=["GET"])
def get_users():
    """Ruta para obtener todos los usuarios (Admin)."""
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "role": u.role} for u in users]), 200

@app.route("/api/users", methods=["POST"])
def create_user():
    """Ruta para crear un nuevo usuario (Admin)."""
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "cliente") 

    if not username or not password:
        return jsonify({"message": "Faltan usuario o contraseña"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"message": "El usuario ya existe"}), 400

    new_user = User(username=username, password=password, role=role) 
    db.session.add(new_user)
    db.session.commit()
    
    if role == "proveedor":
        new_supplier = Supplier(name=username, user_id=new_user.id)
        db.session.add(new_supplier)
        db.session.commit()

    return jsonify({"message": "Usuario creado correctamente", "id": new_user.id}), 201

@app.route("/api/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    """Ruta para actualizar un usuario (Admin)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Usuario no encontrado"}), 404

    data = request.get_json()
    new_username = data.get("username")
    new_password = data.get("password")
    new_role = data.get("role")

    if new_username:
        if User.query.filter(User.username == new_username, User.id != user_id).first():
            return jsonify({"message": "El nombre de usuario ya está en uso"}), 400
        user.username = new_username
        
        if user.role == "proveedor":
            supplier = Supplier.query.filter_by(user_id=user_id).first()
            if supplier:
                supplier.name = new_username

    if new_password:
        user.password = new_password

    if new_role and user.role != new_role:
        if new_role == "proveedor":
            supplier = Supplier.query.filter_by(user_id=user_id).first()
            if not supplier:
                new_supplier = Supplier(name=user.username, user_id=user.id)
                db.session.add(new_supplier)
        elif user.role == "proveedor" and new_role != "proveedor":
            supplier = Supplier.query.filter_by(user_id=user_id).first()
            if supplier:
                MaterialPrice.query.filter_by(supplier_id=supplier.id).delete()
                PreMixPrice.query.filter_by(supplier_id=supplier.id).delete()
                db.session.delete(supplier)
                
        user.role = new_role

    db.session.commit()
    return jsonify({"message": "Usuario actualizado correctamente"}), 200

@app.route("/api/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Ruta para eliminar un usuario (Admin)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "Usuario no encontrado"}), 404

    if user.role == "proveedor":
        supplier = Supplier.query.filter_by(user_id=user_id).first()
        if supplier:
            MaterialPrice.query.filter_by(supplier_id=supplier.id).delete()
            PreMixPrice.query.filter_by(supplier_id=supplier.id).delete()
            db.session.delete(supplier)

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Usuario eliminado correctamente"}), 200

if __name__ == "__main__":
    app.run(debug=True)