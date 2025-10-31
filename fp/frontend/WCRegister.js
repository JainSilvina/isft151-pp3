import { WCLogin } from './WCLogin.js';

export class WCRegister extends HTMLElement {
  constructor() {
    super();
    this.classList.add('w3-container', 'w3-half', 'w3-margin-top');

    const header = document.createElement('header');
    header.classList.add('w3-container', 'w3-orange');
    header.innerHTML = `<h1>Registro de Usuario (Cliente)</h1>`; 

    this.form = document.createElement('form');
    this.form.classList.add('w3-container', 'w3-card-4');

    const fields = [
      { label: 'Usuario', type: 'text' }, 
      { label: 'Contraseña', type: 'password' }, 
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

  async onRegister(e) {
    e?.preventDefault();

    const username = this.inputs.usuario.value.trim();
    const password = this.inputs.contraseña.value.trim();
    
    if (!username || !password) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), 
      });

      const text = await res.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch {
        result = { message: text || 'Respuesta inesperada del servidor' };
      }

      if (res.ok) {
        alert('Usuario cliente registrado correctamente');
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