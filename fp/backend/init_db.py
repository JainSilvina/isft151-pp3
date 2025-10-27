from app import app
from models import db, User, Supplier, Material, PreMix, MaterialPrice, PreMixPrice

with app.app_context():
    db.drop_all()
    db.create_all()

    admin = User(username="mati", password="admin", role="administrador")
    cliente = User(username="cliente", password="cliente", role="cliente")
    prov1 = User(username="imepho", password="1234", role="proveedor")
    prov2 = User(username="easy", password="1234", role="proveedor")

    db.session.add_all([admin, cliente, prov1, prov2])
    db.session.commit()

    supplier1 = Supplier(name="Imepho", user_id=prov1.id)
    supplier2 = Supplier(name="Easy", user_id=prov2.id)
    db.session.add_all([supplier1, supplier2])
    db.session.commit()

    mat1 = Material(name="Ladrillo hueco 18x18x33", units_m2=16, mortar_m3=0.002, cement_kg=0.8, sand_m3=0.002, lime_kg=0.1)
    mat2 = Material(name="Ladrillo común", units_m2=52, mortar_m3=0.002, cement_kg=0.7, sand_m3=0.002, lime_kg=0.1)
    mat3 = Material(name="Ladrillo visto", units_m2=48, mortar_m3=0.002, cement_kg=0.7, sand_m3=0.002, lime_kg=0.1)
    mat4 = Material(name="Bloque de hormigón", units_m2=12.5, mortar_m3=0.003, cement_kg=1.0, sand_m3=0.003, lime_kg=0.2)
    db.session.add_all([mat1, mat2, mat3, mat4])
    db.session.commit()

    premix1 = PreMix(name="Revoque grueso tradicional", uso="Base de pared", rendimiento_m2_per_bolsa=4)
    premix2 = PreMix(name="Revoque fino", uso="Terminación", rendimiento_m2_per_bolsa=6)
    premix3 = PreMix(name="Mortero de asiento", uso="Pegado de ladrillos", rendimiento_m2_per_bolsa=8)
    db.session.add_all([premix1, premix2, premix3])
    db.session.commit()

    precios_materiales = [
        MaterialPrice(material_id=mat1.id, supplier_id=supplier1.id, price=250, unit="unidad"),
        MaterialPrice(material_id=mat1.id, supplier_id=supplier2.id, price=245, unit="unidad"),

        MaterialPrice(material_id=mat2.id, supplier_id=supplier1.id, price=150, unit="unidad"),
        MaterialPrice(material_id=mat2.id, supplier_id=supplier2.id, price=155, unit="unidad"),

        MaterialPrice(material_id=mat3.id, supplier_id=supplier1.id, price=280, unit="unidad"),
        MaterialPrice(material_id=mat3.id, supplier_id=supplier2.id, price=275, unit="unidad"),

        MaterialPrice(material_id=mat4.id, supplier_id=supplier1.id, price=500, unit="unidad"),
        MaterialPrice(material_id=mat4.id, supplier_id=supplier2.id, price=490, unit="unidad"),
    ]
    db.session.add_all(precios_materiales)

    precios_premix = [
        PreMixPrice(pre_mix_id=premix1.id, supplier_id=supplier1.id, price=3500, unit="bolsa"),
        PreMixPrice(pre_mix_id=premix1.id, supplier_id=supplier2.id, price=3400, unit="bolsa"),

        PreMixPrice(pre_mix_id=premix2.id, supplier_id=supplier1.id, price=3700, unit="bolsa"),
        PreMixPrice(pre_mix_id=premix2.id, supplier_id=supplier2.id, price=3600, unit="bolsa"),

        PreMixPrice(pre_mix_id=premix3.id, supplier_id=supplier1.id, price=3900, unit="bolsa"),
        PreMixPrice(pre_mix_id=premix3.id, supplier_id=supplier2.id, price=3850, unit="bolsa"),
    ]
    db.session.add_all(precios_premix)

    db.session.commit()

    print("✅ Base de datos inicializada con materiales, proveedores y precios.")