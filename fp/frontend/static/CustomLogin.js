
import { CustomCotizador } from "./CustomCotizador.js";

// Función para simular la navegación SPA
function navigateTo(path) {
    console.log(`Navegando a: ${path}`);
    document.body.innerHTML = ''; 
    
    if (path === 'app/cotizador') {
        let cotizador = new CustomCotizador();
        document.body.appendChild(cotizador);
    } else {
        let loginComp = new CustomLogin();
        document.body.appendChild(loginComp);
    }
}

export class CustomLogin extends HTMLElement {
  constructor() {
    super();
    this.classList.add('w3-container', 'w3-half', 'w3-margin-top');

 
    this.form = document.createElement('form');
    this.form.classList.add('w3-container', 'w3-card-4');

    this.header = document.createElement('header');
    this.header.classList.add('w3-container', 'w3-teal');
    let h1 = document.createElement('h1');
    h1.textContent = 'Login y Registro (Backend Python)';
    this.header.appendChild(h1);

   
    let fields = [
      { type: 'text', label: 'Name', required: true },
      { type: 'password', label: 'Password', required: true },
    ];
    this.inputs = [];

    fields.forEach(f => {
      let p = document.createElement('p');
      let input = document.createElement('input');
      input.type = f.type;
      input.required = !!f.required;
      input.classList.add('w3-input');
      input.style.width = '90%';
      let label = document.createElement('label');
      label.textContent = f.label;
      p.appendChild(input);
      p.appendChild(label);
      this.form.appendChild(p);
      this.inputs.push(input);
    });

    
    let pBtnLogin = document.createElement('p');
    let btnLogin = document.createElement('button');
    btnLogin.type = 'submit';
    btnLogin.textContent = 'Log in';
    btnLogin.classList.add('w3-button', 'w3-section', 'w3-teal', 'w3-ripple');
    pBtnLogin.appendChild(btnLogin);
    this.form.appendChild(pBtnLogin);

   
    let pBtnRegister = document.createElement('p');
    let btnRegister = document.createElement('button');
    btnRegister.type = 'button'; 
    btnRegister.textContent = 'Register';
    btnRegister.classList.add('w3-button', 'w3-section', 'w3-blue', 'w3-ripple');
    btnRegister.onclick = this.onRegister.bind(this); 
    pBtnRegister.appendChild(btnRegister);
    this.form.appendChild(pBtnRegister);

  
    let pBtnClear = document.createElement('p');
    let btnClear = document.createElement('button');
    btnClear.type = 'button';
    btnClear.textContent = 'Clear All Users (DEV)';
    btnClear.classList.add('w3-button', 'w3-section', 'w3-red', 'w3-ripple');
    btnClear.onclick = this.onClearUsers.bind(this); 
    pBtnClear.appendChild(btnClear);
    this.form.appendChild(pBtnClear);
    

    this.appendChild(this.header);
    this.appendChild(this.form);
  }

  connectedCallback() {
    this.form.onsubmit = this.onSubmit.bind(this); 
  }

  disconnectedCallback() {
    this.form.onsubmit = null;
  }

  // --- Métodos de Comunicación con el Backend ---
  
  onRegister = async () => {
    let name = this.inputs[0].value.trim();
    let password = this.inputs[1].value.trim();

    if (!name || !password) {
      alert("Por favor, completa los campos antes de registrar.");
      return;
    }

    try {
      let response = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }),
      });

      let result = await response.json();

      if (response.ok) {
        alert(`Registro exitoso: ${result.message} ✅`);
        this.inputs[0].value = "";
        this.inputs[1].value = "";
      } else {
        alert(`Error: ${result.message} ❌`);
      }
    } catch (error) {
      alert("Error de conexión con el servidor (API /api/register).");
    }
  };

  // Login
  onSubmit = async event => {
    event.preventDefault();
    let name = this.inputs[0].value.trim();
    let password = this.inputs[1].value.trim();

    try {
      let response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }),
      });

      let result = await response.json();

      if (response.ok) {
        alert(`${result.message} ✅ Dirigiendo al cotizador.`);
        navigateTo('app/cotizador'); 
      } else {
        alert(`${result.message} ❌`);
      }
    } catch (error) {
      alert("Error de conexión con el servidor (API /api/login).");
    }
  };

  onClearUsers = async () => {
    if (!confirm("⚠️ ¿Estás seguro de que quieres borrar TODOS los usuarios de la base de datos? Esta acción es irreversible.")) {
        return;
    }
    
    try {
        let response = await fetch('http://127.0.0.1:5000/api/users', {
            method: 'DELETE',
        });

        let result = await response.json();
        
        if (response.ok) {
            alert(`${result.message} ❌`);
        } else {
            alert(`Error al borrar: ${result.message} ❌`);
        }
    } catch (error) {
        alert("Error de conexión con el servidor para la operación de borrado.");
    }
  };
}

customElements.define('x-login', CustomLogin);