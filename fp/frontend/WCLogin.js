import { WCCotizador } from "./WCCotizador.js";
import { WCRegister } from "./WCRegister.js";
import { WCUserForm } from "./WCUserForm.js";

function navigateTo(path, metadata = {}) {
  document.body.innerHTML = '';

  if (path === 'app/cotizador') {
    document.body.appendChild(new WCCotizador());
  } else if (path === 'register') {
    document.body.appendChild(new WCRegister());
  } else if (path === 'app/admin') {
    const adminView = new WCUserForm();
    adminView.currentUser = metadata.currentUser || null;
    document.body.appendChild(adminView);
  } else {
    document.body.appendChild(new WCLogin());
  }
}

export class WCLogin extends HTMLElement {
  constructor() {
    super();
    this.classList.add('w3-container', 'w3-half', 'w3-margin-top');

    this.form = document.createElement('form');
    this.form.classList.add('w3-container', 'w3-card-4');

    const header = document.createElement('header');
    header.classList.add('w3-container', 'w3-teal');
    header.innerHTML = `<h1>Login</h1>`;

    const fields = [
      { type: 'text', label: 'Name', required: true },
      { type: 'password', label: 'Password', required: true },
    ];
    this.inputs = [];

    fields.forEach(f => {
      const p = document.createElement('p');
      const input = document.createElement('input');
      input.type = f.type;
      input.required = f.required;
      input.classList.add('w3-input');
      input.style.width = '90%';
      const label = document.createElement('label');
      label.textContent = f.label;
      p.appendChild(input);
      p.appendChild(label);
      this.form.appendChild(p);
      this.inputs.push(input);
    });

    const pLogin = document.createElement('p');
    const btnLogin = document.createElement('button');
    btnLogin.type = 'submit';
    btnLogin.textContent = 'Log in';
    btnLogin.classList.add('w3-button', 'w3-section', 'w3-teal', 'w3-ripple');
    pLogin.appendChild(btnLogin);
    this.form.appendChild(pLogin);

    const pRegister = document.createElement('p');
    const btnRegister = document.createElement('button');
    btnRegister.type = 'button';
    btnRegister.textContent = 'Register';
    btnRegister.classList.add('w3-button', 'w3-section', 'w3-blue', 'w3-ripple');
    btnRegister.onclick = () => navigateTo('register');
    pRegister.appendChild(btnRegister);
    this.form.appendChild(pRegister);

    this.appendChild(header);
    this.appendChild(this.form);
  }

  connectedCallback() {
    this.form.onsubmit = this.onSubmit.bind(this);
  }

  async onSubmit(e) {
    e.preventDefault();
    const [name, password] = this.inputs.map(i => i.value.trim());

    try {
      const res = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name, password }),
      });

      const result = await res.json();

      if (res.ok) {
        alert(`${result.message}`);
        if (result.role === 'administrador') {
          navigateTo('app/admin', { currentUser: result });
        } else {
          navigateTo('app/cotizador');
        }
      } else {
        alert(result.message);
      }
    } catch {
      alert('Error de conexión con el servidor.');
    }
  }
}

customElements.define('wc-login', WCLogin);