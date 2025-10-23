import os

class Config:
    # Obtiene la ruta base del proyecto
    basedir = os.path.abspath(os.path.dirname(__file__))

    # Configuración de SQLAlchemy 
    SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'instance', 'sqlite.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    SECRET_KEY = '2020'