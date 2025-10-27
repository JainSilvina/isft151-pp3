import { WCCotizador } from "./WCCotizador.js";
import { WCUserForm } from "./WCUserForm.js";
import { WCMateriales } from "./WCMateriales.js";

export class WCLogin extends HTMLElement {
  constructor() {
    super();
    this.classList.add("w3-container", "w3-margin-top");

    const card = document.createElement("div");
    card.classList.add("w3-card", "w3-padding", "w3-light-grey");

    const title = document.createElement("h2");
    title.textContent = "Inicio de Sesión";
    card.appendChild(title);

    const userLabel = document.createElement("label");
    userLabel.textContent = "Usuario:";
    this.usernameInput = document.createElement("input");
    this.usernameInput.type = "text";
    this.usernameInput.classList.add("w3-input", "w3-margin-bottom");
    card.append(userLabel, this.usernameInput);

    const passLabel = document.createElement("label");
    passLabel.textContent = "Contraseña:";
    this.passwordInput = document.createElement("input");
    this.passwordInput.type = "password";
    this.passwordInput.classList.add("w3-input", "w3-margin-bottom");
    card.append(passLabel, this.passwordInput);

    const loginBtn = document.createElement("button");
    loginBtn.textContent = "Ingresar";
    loginBtn.classList.add("w3-button", "w3-green", "w3-margin-top");
    loginBtn.onclick = this.loginUser.bind(this);
    card.appendChild(loginBtn);

    this.appendChild(card);
  }

  async loginUser() {
    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value.trim();

    if (!username || !password) {
      alert("Por favor complete todos los campos.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Error al iniciar sesión");
        return;
      }

      sessionStorage.setItem("currentUser", JSON.stringify(data));
      alert("Inicio de sesión exitoso.");

      if (data.role === "administrador") {
        const adminPanel = new WCUserForm();
        document.body.innerHTML = "";
        document.body.appendChild(adminPanel);
      } else if (data.role === "cliente") {
        const cot = new WCCotizador();
        cot.currentUser = data;
        document.body.innerHTML = "";
        document.body.appendChild(cot);
      } else if (data.role === "proveedor") {
        const sup = new WCMateriales();
        sup.currentUser = data;
        document.body.innerHTML = "";
        document.body.appendChild(sup);
      }
    } catch (err) {
      console.error("Error en el login:", err);
      alert("Error al conectar con el servidor.");
    }
  }
}

customElements.define("wc-login", WCLogin);