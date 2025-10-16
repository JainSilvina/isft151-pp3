import os

class Config:
    # Obtiene la ruta base del proyecto
    basedir = os.path.abspath(os.path.dirname(__file__))

    # Configuración de SQLAlchemy
    # Usamos SQLite para la simplicidad inicial.
    # La BD se creará en el subdirectorio 'instance'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'sqlite.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Clave secreta de Flask (importante para sesiones, etc.)
    SECRET_KEY = '2020'