import { WCLogin } from './WCLogin.js';

export class WCRegister extends HTMLElement {
  constructor() {
    super();
    this.classList.add('w3-container', 'w3-half', 'w3-margin-top');

    const header = document.createElement('header');
    header.classList.add('w3-container', 'w3-orange');
    header.innerHTML = `<h1>Registro de Usuario</h1>`;

    this.form = document.createElement('form');
    this.form.classList.add('w3-container', 'w3-card-4');

    const fields = [
      { label: 'Name', type: 'text' },
      { label: 'Password', type: 'password' },
    ];

    this.inputs = {};
    for (const f of fields) {
      const p = document.createElement('p');
      const input = document.createElement('input');
      input.type = f.type;
      input.classList.add('w3-input');
      input.required = true;
      const lbl = document.createElement('label');
      lbl.textContent = f.label;
      p.appendChild(input);
      p.appendChild(lbl);
      this.form.appendChild(p);
      this.inputs[f.label.toLowerCase()] = input;
    }

    const pRole = document.createElement('p');
    const lblRole = document.createElement('label');
    lblRole.textContent = 'Rol';
    this.selectRole = document.createElement('select');
    this.selectRole.classList.add('w3-select');
    ['cliente', 'administrador', 'proveedor'].forEach(r => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r[0].toUpperCase() + r.slice(1);
      this.selectRole.appendChild(opt);
    });
    pRole.appendChild(lblRole);
    pRole.appendChild(this.selectRole);
    this.form.appendChild(pRole);

    const pBtns = document.createElement('p');
    const btnReg = document.createElement('button');
    btnReg.textContent = 'Registrar';
    btnReg.classList.add('w3-button', 'w3-blue', 'w3-section');
    btnReg.onclick = this.onRegister.bind(this);

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancelar';
    btnCancel.classList.add('w3-button', 'w3-light-grey', 'w3-section', 'w3-margin-left');
    btnCancel.onclick = () => {
      document.body.innerHTML = '';
      document.body.appendChild(new WCLogin());
    };

    pBtns.appendChild(btnReg);
    pBtns.appendChild(btnCancel);
    this.form.appendChild(pBtns);

    this.appendChild(header);
    this.appendChild(this.form);
  }

  // 🔵 Nuevo método corregido
  async onRegister(e) {
    e?.preventDefault();

    const name = this.inputs.name.value.trim();
    const password = this.inputs.password.value.trim();
    const role = this.selectRole.value;

    if (!name || !password) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, role }),
      });

      const text = await res.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text || 'Respuesta inesperada del servidor' };
      }

      if (res.ok) {
        alert('Usuario registrado correctamente');
        document.body.innerHTML = '';
        document.body.appendChild(new WCLogin());
      } else {
        alert(result.message || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión con el servidor.');
    }
  }
}

customElements.define('wc-register', WCRegister);