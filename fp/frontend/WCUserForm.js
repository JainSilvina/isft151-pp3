export class WCUserForm extends HTMLElement {
  constructor() {
    super();
    this.classList.add("w3-container", "w3-margin-top");

    const title = document.createElement("h2");
    title.textContent = "Gestión de Usuarios (Administrador)";
    this.appendChild(title);

    const form = document.createElement("div");
    form.classList.add("w3-card", "w3-padding", "w3-light-grey");

    const lblUser = document.createElement("label");
    lblUser.textContent = "Usuario:";
    this.usernameInput = document.createElement("input");
    this.usernameInput.type = "text";
    this.usernameInput.classList.add("w3-input", "w3-margin-bottom");
    form.append(lblUser, this.usernameInput);

    const lblPass = document.createElement("label");
    lblPass.textContent = "Contraseña:";
    this.passwordInput = document.createElement("input");
    this.passwordInput.type = "password";
    this.passwordInput.classList.add("w3-input", "w3-margin-bottom");
    form.append(lblPass, this.passwordInput);

    const lblRole = document.createElement("label");
    lblRole.textContent = "Rol:";
    this.roleSelect = document.createElement("select");
    this.roleSelect.classList.add("w3-select", "w3-margin-bottom");
    ["administrador", "cliente", "proveedor"].forEach(r => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r.charAt(0).toUpperCase() + r.slice(1);
      this.roleSelect.appendChild(opt);
    });
    form.append(lblRole, this.roleSelect);

    const createBtn = document.createElement("button");
    createBtn.textContent = "Crear Usuario";
    createBtn.classList.add("w3-button", "w3-green", "w3-margin-top");
    createBtn.onclick = this.createUser.bind(this);
    form.append(createBtn);

    this.table = document.createElement("table");
    this.table.classList.add("w3-table", "w3-striped", "w3-margin-top");

    this.append(form, this.table);

    this.loadUsers();
  }

  async loadUsers() {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/users");
      const data = await res.json();

      this.table.innerHTML = `
        <tr class="w3-teal">
          <th>ID</th><th>Usuario</th><th>Rol</th><th>Acciones</th>
        </tr>
      `;

      data.forEach(u => {
        const row = this.table.insertRow();
        row.insertCell().textContent = u.id;
        row.insertCell().textContent = u.username;
        row.insertCell().textContent = u.role;

        const actions = row.insertCell();

        const editBtn = document.createElement("button");
        editBtn.textContent = "Editar";
        editBtn.classList.add("w3-button", "w3-blue", "w3-small", "w3-margin-right");
        editBtn.onclick = () => this.editUser(u);
        actions.appendChild(editBtn);

        const delBtn = document.createElement("button");
        delBtn.textContent = "Eliminar";
        delBtn.classList.add("w3-button", "w3-red", "w3-small");
        delBtn.onclick = () => this.deleteUser(u.id);
        actions.appendChild(delBtn);
      });
    } catch (err) {
      console.error(err);
      alert("Error cargando usuarios.");
    }
  }

  async createUser() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value.trim();
    const role = this.roleSelect.value;

    if (!username || !password) {
      alert("Debe completar usuario y contraseña.");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error creando usuario.");
        return;
      }

      alert("Usuario creado correctamente.");
      this.usernameInput.value = "";
      this.passwordInput.value = "";
      this.roleSelect.value = "cliente";
      this.loadUsers();
    } catch (err) {
      console.error("Error creando usuario:", err);
      alert("Error creando usuario.");
    }
  }

  async deleteUser(id) {
    if (!confirm("¿Seguro que desea eliminar este usuario?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Usuario eliminado.");
      this.loadUsers();
    } catch (err) {
      console.error(err);
      alert("Error eliminando usuario.");
    }
  }

  async editUser(u) {
    const newUser = prompt("Nuevo nombre de usuario:", u.username);
    if (newUser === null) return;

    const newPass = prompt("Nueva contraseña (dejar vacío para mantener):", "");
    const newRole = prompt("Nuevo rol (administrador, cliente, proveedor):", u.role);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUser,
          password: newPass || u.password,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Usuario actualizado correctamente.");
      this.loadUsers();
    } catch (err) {
      console.error(err);
      alert("Error actualizando usuario.");
    }
  }
}

customElements.define("wc-user-form", WCUserForm);