import { WCLogin } from './WCLogin.js';

export class WCUserForm extends HTMLElement {
  constructor() {
    super();
    this.classList.add('w3-container', 'w3-margin-top');

    const header = document.createElement('header');
    header.classList.add('w3-container', 'w3-green');
    header.innerHTML = `<h1>Gestión de Usuarios</h1>`;
    this.appendChild(header);

    this.userListDiv = document.createElement('div');
    this.appendChild(this.userListDiv);

    const btnLoad = document.createElement('button');
    btnLoad.textContent = 'Gestionar Usuarios';
    btnLoad.classList.add('w3-button', 'w3-blue', 'w3-section');
    btnLoad.onclick = () => this.loadUsers();

    const btnLogout = document.createElement('button');
    btnLogout.textContent = 'Logout';
    btnLogout.classList.add('w3-button', 'w3-red', 'w3-section', 'w3-margin-left');
    btnLogout.onclick = () => {
      document.body.innerHTML = '';
      document.body.appendChild(new WCLogin());
    };

    this.appendChild(btnLoad);
    this.appendChild(btnLogout);
  }

  async loadUsers() {
    const res = await fetch('http://127.0.0.1:5000/api/users');
    const users = await res.json();
    this.renderUsers(users);
  }

  renderUsers(users) {
    this.userListDiv.innerHTML = '';
    const table = document.createElement('table');
    table.classList.add('w3-table', 'w3-striped', 'w3-card-4');
    table.innerHTML = `<tr><th>ID</th><th>Usuario</th><th>Rol</th><th>Acciones</th></tr>`;

    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.id}</td><td>${u.username}</td><td>${u.role}</td>`;
      const td = document.createElement('td');
      const btnEdit = document.createElement('button');
      btnEdit.textContent = '✏️ Edit';
      btnEdit.classList.add('w3-button', 'w3-light-blue', 'w3-tiny');
      btnEdit.onclick = () => this.editUser(u);

      const btnDel = document.createElement('button');
      btnDel.textContent = '❌ Del';
      btnDel.classList.add('w3-button', 'w3-red', 'w3-tiny', 'w3-margin-left');
      btnDel.onclick = () => this.deleteUser(u.username);

      td.appendChild(btnEdit);
      td.appendChild(btnDel);
      tr.appendChild(td);
      table.appendChild(tr);
    });
    this.userListDiv.appendChild(table);
  }

  async editUser(user) {
    const username = prompt('Nuevo username:', user.username);
    const password = prompt('Nueva password:');
    const role = prompt('Nuevo rol (cliente / administrador / proveedor):', user.role);

    const payload = {};
    if (username) payload.username = username;
    if (password) payload.password = password;
    if (role) payload.role = role;

    const res = await fetch(`http://127.0.0.1:5000/api/users/${user.username}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    alert(data.message);
    this.loadUsers();
  }

  async deleteUser(username) {
    if (!confirm(`¿Eliminar ${username}?`)) return;
    const res = await fetch(`http://127.0.0.1:5000/api/users/${username}`, {method: 'DELETE'});
    const data = await res.json();
    alert(data.message);
    this.loadUsers();
  }
}

customElements.define('wc-userform', WCUserForm);