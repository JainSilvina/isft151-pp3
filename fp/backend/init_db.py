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

    mat1 = Material(name="Ladrillo hueco 18x18x33", units_m2=16, mortar_m3=0.012, cement_kg=1.0, sand_m3=0.012, lime_kg=0.5, espesor_cm=18)

    mat2 = Material(name="Ladrillo común", units_m2=52, mortar_m3=0.022, cement_kg=1.5, sand_m3=0.022, lime_kg=0.7, espesor_cm=15)

    mat3 = Material(name="Ladrillo visto", units_m2=48, mortar_m3=0.018, cement_kg=1.3, sand_m3=0.018, lime_kg=0.6, espesor_cm=12)

    mat4 = Material(name="Bloque hormigón 20x20x40", units_m2=12.5, mortar_m3=0.008, cement_kg=0.6, sand_m3=0.008, lime_kg=0.3, espesor_cm=20)

    mat5_cemento = Material(name="Cemento x 50kg", units_m2=0, mortar_m3=0, cement_kg=0, sand_m3=0, lime_kg=0, espesor_cm=0) 
    mat6_cal = Material(name="Cal", units_m2=0, mortar_m3=0, cement_kg=0, sand_m3=0, lime_kg=0, espesor_cm=0) 
    mat7_arena = Material(name="Arena", units_m2=0, mortar_m3=0, cement_kg=0, sand_m3=0, lime_kg=0, espesor_cm=0) 
    mat8_piedra = Material(name="Piedra/Grava", units_m2=0, mortar_m3=0, cement_kg=0, sand_m3=0, lime_kg=0, espesor_cm=0) 

    db.session.add_all([mat1, mat2, mat3, mat4, mat5_cemento, mat6_cal, mat7_arena, mat8_piedra])
    db.session.commit()

    premix1 = PreMix(name="Mortero Listo (Fino)", uso="Fino/Revoque", rendimiento_m2_per_bolsa=1.5) 
    premix2 = PreMix(name="Mortero Listo (Grueso)", uso="Grueso/Mampostería", rendimiento_m2_per_bolsa=1.0) 
    db.session.add_all([premix1, premix2])
    db.session.commit()


    precios_materiales = [
        MaterialPrice(material_id=mat5_cemento.id, supplier_id=supplier1.id, price=7500, unit="bolsa 50kg"),
        MaterialPrice(material_id=mat5_cemento.id, supplier_id=supplier2.id, price=7450, unit="bolsa 50kg"),
    
        MaterialPrice(material_id=mat6_cal.id, supplier_id=supplier1.id, price=1500, unit="bolsa 25kg"),
        MaterialPrice(material_id=mat6_cal.id, supplier_id=supplier2.id, price=1450, unit="bolsa 25kg"),
        
        MaterialPrice(material_id=mat7_arena.id, supplier_id=supplier1.id, price=10000, unit="m³"),
        MaterialPrice(material_id=mat7_arena.id, supplier_id=supplier2.id, price=10500, unit="m³"),

        MaterialPrice(material_id=mat8_piedra.id, supplier_id=supplier1.id, price=12000, unit="m³"),
        MaterialPrice(material_id=mat8_piedra.id, supplier_id=supplier2.id, price=12500, unit="m³"),

    
        MaterialPrice(material_id=mat1.id, supplier_id=supplier1.id, price=150, unit="unidad"),
        MaterialPrice(material_id=mat2.id, supplier_id=supplier1.id, price=50, unit="unidad"),
        MaterialPrice(material_id=mat3.id, supplier_id=supplier2.id, price=80, unit="unidad"),
        MaterialPrice(material_id=mat4.id, supplier_id=supplier2.id, price=200, unit="unidad"),
    ]
    db.session.add_all(precios_materiales)


    precios_premix = [
        PreMixPrice(pre_mix_id=premix1.id, supplier_id=supplier1.id, price=2500, unit="bolsa 25kg"),
        PreMixPrice(pre_mix_id=premix2.id, supplier_id=supplier2.id, price=2800, unit="bolsa 25kg"),
    ]
    db.session.add_all(precios_premix)


    db.session.commit()
    print("Base de datos inicializada correctamente!")