class LoginComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="card">
        <h2>Iniciar Sesión</h2>
        <form id="loginForm">
          <label for="username">Usuario:</label>
          <input type="text" id="username" required />
          <label for="password">Contraseña:</label>
          <input type="password" id="password" required />
          <button type="submit">Ingresar</button>
        </form>
      </div>
    `;

    this.querySelector("#loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const username = this.querySelector("#username").value;
      const password = this.querySelector("#password").value;

      if (username === "admin" && password === "1234") {
        this.dispatchEvent(new CustomEvent("login-success", { bubbles: true }));
      } else {
        alert("Usuario o contraseña incorrectos. Usa admin / 1234");
      }
    });
  }
}
customElements.define("login-component", LoginComponent);
