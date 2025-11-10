import subprocess
import sys
import os
import atexit


# --- INICIO DE MODIFICACIONES DE RUTA ---
# 1. ORIGINAL: PROJECT_ROOT apuntaba a 'release' (donde está run.py)
# PROJECT_ROOT = os.path.abspath(os.path.dirname(sys.argv[0]))

# 1. CORREGIDO: Subimos un nivel (..) para que PROJECT_ROOT apunte a 'fp'
# De esta manera, podemos acceder a las carpetas hermanas 'backend', 'frontend' y 'srs'.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(sys.argv[0]), '..'))

BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')

# 2. CORREGIDO: Buscamos requirements.txt en la carpeta 'srs' (hermana de 'backend' y 'release')
SRS_DIR = os.path.join(PROJECT_ROOT, 'srs')
REQUIREMENTS_FILE = os.path.join(SRS_DIR, 'requirements.txt')
# --- FIN DE MODIFICACIONES DE RUTA ---

VENV_DIR = os.path.join(BACKEND_DIR, 'venv')

DB_FILE_PATH = os.path.join(BACKEND_DIR, 'instance', 'sqlite.db')
INIT_DB_SCRIPT = 'init_db.py'
APP_SCRIPT = 'app.py'  

FRONTEND_PORT = '8000'

if sys.platform == "win32":
    VENV_PYTHON = os.path.join(VENV_DIR, 'Scripts', 'python.exe')
    VENV_PIP = os.path.join(VENV_DIR, 'Scripts', 'pip.exe')
else:
    VENV_PYTHON = os.path.join(VENV_DIR, 'bin', 'python')
    VENV_PIP = os.path.join(VENV_DIR, 'bin', 'pip')

processes = []
system_python = sys.executable

def run_command(command, cwd=None, check=True):
    """Función de ayuda para ejecutar comandos y mostrar errores."""
    print(f"\n[RUN]: {' '.join(command)}")
    try:
        # Se añade captura de salida para diagnóstico de errores de instalación
        result = subprocess.run(command, cwd=cwd, check=check, capture_output=True, text=True)
        print(result.stdout)
    except subprocess.CalledProcessError as e:
        print(f"--- ERROR al ejecutar el comando: {e}")
        print("--- Salida del Error ---")
        if e.stdout:
            print(e.stdout) # No necesita .decode() si text=True
        if e.stderr:
            print(e.stderr) # No necesita .decode() si text=True
        print("-------------------------")
        sys.exit(1)
    except FileNotFoundError:
        print(f"--- ERROR: No se encontró el comando: {command[0]}")
        print("Asegúrate de que Python (y venv) están instalados y en el PATH.")
        sys.exit(1)


def cleanup():
    """Se asegura de terminar los procesos hijos al salir del script."""
    print("\nDeteniendo los servidores...")
    for p in processes:
        if p.poll() is None:
            p.terminate()
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
    print("Servidores detenidos. ¡Adiós!")

atexit.register(cleanup)

try:
    if not os.path.exists(VENV_PYTHON):
        print(f"Creando entorno virtual en '{VENV_DIR}'...")
        run_command([system_python, '-m', 'venv', VENV_DIR])
    else:
        print("Entorno virtual encontrado.")

    print("Instalando/actualizando dependencias de 'requirements.txt'...")
    # El archivo ahora se busca en la ruta corregida: fp/srs/requirements.txt
    run_command([VENV_PIP, 'install', '-r', REQUIREMENTS_FILE])
    print("Dependencias instaladas.")
    
    print("Verificando la base de datos...")
    if not os.path.exists(DB_FILE_PATH):
        print(f"Base de datos no encontrada. Ejecutando '{INIT_DB_SCRIPT}'...")
        
        instance_dir = os.path.dirname(DB_FILE_PATH)
        if not os.path.exists(instance_dir):
            print(f"Creando directorio '{instance_dir}'...")
            os.makedirs(instance_dir)
            
        run_command([VENV_PYTHON, INIT_DB_SCRIPT], cwd=BACKEND_DIR)
        print("Base de datos creada.")
    else:
        print("Base de datos encontrada.")

    print(f"\nIniciando el backend (Flask)...")
    print(f"API disponible en: http://127.0.0.1:5000")
    
    backend_process = subprocess.Popen(
        [VENV_PYTHON, APP_SCRIPT], 
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    processes.append(backend_process)

    print(f"Iniciando el servidor frontend...")
    print(f"Frontend disponible en: http://127.0.0.1:{FRONTEND_PORT}")

    frontend_cmd = [system_python, '-m', 'http.server', FRONTEND_PORT]
    
    frontend_process = subprocess.Popen(
        frontend_cmd,
        cwd=FRONTEND_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT
    )
    processes.append(frontend_process)
    
    print("\n--- ¡Aplicación en marcha! ---")
    print(f"Abre tu navegador en: http://127.0.0.1:{FRONTEND_PORT}")
    print("\nPresiona Ctrl+C en esta terminal para detener ambos servidores.")

    for line in backend_process.stdout:
        print(f"[Backend]: {line.strip()}")
    
    backend_process.wait()
    stderr_output = backend_process.stderr.read()
    if stderr_output:
        print(f"[Error Backend]: {stderr_output.strip()}")

except KeyboardInterrupt:
    print("\nInterrupción detectada (Ctrl+C). Saliendo...")
    
except Exception as e:
    print(f"\nHa ocurrido un error inesperado: {e}")

finally:
    pass
