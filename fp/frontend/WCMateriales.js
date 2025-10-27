import { WCLogin } from "./WCLogin.js";

export class WCMateriales extends HTMLElement {
  constructor() {
    super();
    this.classList.add("w3-container", "w3-margin-top");
    this.currentUser = null;
    this.lastCotizacion = null;
    this.totalSeleccion = 0;
  }

  connectedCallback() {
    try {
      this.currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    } catch {}
    try {
      this.lastCotizacion = JSON.parse(sessionStorage.getItem("lastCotizacion") || "null");
    } catch {}

    const header = document.createElement("header");
    header.classList.add("w3-container", "w3-purple");
    header.innerHTML = `<h1>Proveedores - Selección de materiales</h1>
      <div>Usuario: ${this.currentUser?.username || "Invitado"} (${this.currentUser?.role || "N/D"})</div>`;
    this.appendChild(header);

    const btns = document.createElement("div");
    btns.classList.add("w3-margin");
    const btnReload = document.createElement("button");
    btnReload.textContent = "Recargar";
    btnReload.classList.add("w3-button", "w3-blue");
    btnReload.onclick = () => this.loadData();
    btns.appendChild(btnReload);

    const btnBack = document.createElement("button");
    btnBack.textContent = "Volver al cotizador";
    btnBack.classList.add("w3-button", "w3-light-grey", "w3-margin-left");
    btnBack.onclick = () => {
      import("./WCCotizador.js").then(mod => {
        const cot = new mod.WCCotizador();
        cot.currentUser = this.currentUser;
        document.body.innerHTML = "";
        document.body.appendChild(cot);
      });
    };
    btns.appendChild(btnBack);

    const btnLogout = document.createElement("button");
    btnLogout.textContent = "Logout";
    btnLogout.classList.add("w3-button", "w3-red", "w3-margin-left");
    btnLogout.onclick = () => {
      sessionStorage.removeItem("currentUser");
      sessionStorage.removeItem("lastCotizacion");
      document.body.innerHTML = "";
      document.body.appendChild(new WCLogin());
    };
    btns.appendChild(btnLogout);

    this.appendChild(btns);

    this.container = document.createElement("div");
    this.appendChild(this.container);

    this.loadData();
  }

  async loadData() {
    this.container.innerHTML = "Cargando precios...";
    try {
      const [matRes, premixRes] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/materials/prices"),
        fetch("http://127.0.0.1:5000/api/premixes/prices"),
      ]);
      if (!matRes.ok || !premixRes.ok) throw new Error("Error al cargar precios");

      const materials = await matRes.json();
      const premixes = await premixRes.json();

      this.container.innerHTML = "";

      if (this.currentUser?.role === "proveedor") {
        const myMaterials = materials.filter(m =>
          m.prices.some(p => p.supplier_id === this.currentUser.supplier_id)
        );
        const myPremixes = premixes.filter(p =>
          p.prices.some(pr => pr.supplier_id === this.currentUser.supplier_id)
        );

        if (myMaterials.length === 0 && myPremixes.length === 0) {
          this.container.innerHTML = `<div class="w3-panel w3-yellow">No hay materiales registrados para este proveedor.</div>`;
          return;
        }

        myMaterials.forEach(item => this.renderItemTable(item, "Material"));
        myPremixes.forEach(item => this.renderItemTable(item, "Pre-mix"));
        return;
      }

      let filteredMaterials = [];
      let filteredPremixes = [];

      if (this.lastCotizacion?.material) {
        filteredMaterials = materials.filter(m => m.id === this.lastCotizacion.material.id);
      }

      if (this.lastCotizacion?.pre_mix) {
        filteredPremixes = premixes.filter(p => p.id === this.lastCotizacion.pre_mix.id);
      }

      if (filteredMaterials.length === 0 && filteredPremixes.length === 0) {
        this.container.innerHTML =
          `<div class="w3-panel w3-yellow">No hay materiales/premezclas pertenecientes a la última cotización. Asegúrese de calcular una cotización antes de seleccionar materiales.</div>`;
        return;
      }

      filteredMaterials.forEach(item => this.renderItemTable(item, "Material"));
      filteredPremixes.forEach(item => this.renderItemTable(item, "Pre-mix"));

      if (this.lastCotizacion) {
        const totalDiv = document.createElement("div");
        totalDiv.id = "wc-total-selection";
        totalDiv.classList.add("w3-panel", "w3-light-green", "w3-padding");
        totalDiv.innerHTML = `<strong>TOTAL selección:</strong> <span id="wc-total-amount">$0.00</span>`;
        this.appendChild(totalDiv);
      }
    } catch (err) {
      console.error(err);
      this.container.innerHTML = `<div class="w3-panel w3-red">Error al cargar precios. Verifica backend.</div>`;
    }
  }

  renderItemTable(item, tipo) {
    const section = document.createElement("div");
    section.classList.add("w3-card", "w3-padding", "w3-margin-top");
    section.innerHTML = `<h3>${tipo}: ${item.name}</h3>`;

    const table = document.createElement("table");
    table.classList.add("w3-table", "w3-striped");

    const headRow = table.createTHead().insertRow();
    ["Proveedor", "Precio", "Unidad", "Acciones"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      headRow.appendChild(th);
    });

    const tbody = document.createElement("tbody");
    item.prices.forEach(p => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = p.supplier_name;
      tr.insertCell().textContent = `$${(p.price || 0).toFixed(2)}`;
      tr.insertCell().textContent = p.unit || "-";

      const td = tr.insertCell();
      const isOwner =
        this.currentUser &&
        this.currentUser.role === "proveedor" &&
        this.currentUser.supplier_id === p.supplier_id;

      if (isOwner) {
        const editBtn = document.createElement("button");
        editBtn.textContent = "✏️ Editar";
        editBtn.classList.add("w3-button", "w3-light-blue", "w3-tiny");
        editBtn.onclick = () => this.editPrice(p);
        td.appendChild(editBtn);
      } else if (this.currentUser?.role === "cliente") {
        const check = document.createElement("input");
        check.type = "checkbox";
        check.onchange = ev => this.onTogglePrice(ev, p, item);
        td.appendChild(check);
        td.append(" Seleccionar");
      } else {
        td.textContent = "-";
      }
    });

    table.appendChild(tbody);
    section.appendChild(table);
    this.container.appendChild(section);
  }

  onTogglePrice(ev, priceObj, item) {
    const checked = ev.target.checked;
    let add = 0;
    if (this.lastCotizacion) {
      if (this.lastCotizacion.material?.id === item.id) {
        add = (this.lastCotizacion.required_units || 0) * (priceObj.price || 0);
      } else if (this.lastCotizacion.pre_mix?.id === item.id) {
        add = (this.lastCotizacion.premix_bags || 0) * (priceObj.price || 0);
      }
    }
    if (checked) this.totalSeleccion += add;
    else this.totalSeleccion -= add;
    const span = this.querySelector("#wc-total-amount");
    if (span) span.textContent = `$${this.totalSeleccion.toFixed(2)}`;
  }

  async editPrice(p) {
    const newPrice = prompt("Nuevo precio:", p.price);
    if (newPrice === null) return;
    const newUnit = prompt("Nueva unidad (opcional):", p.unit || "");
    if (newUnit === null) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/prices/${p.price_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(newPrice), unit: newUnit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Precio actualizado correctamente.");
      this.loadData();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar el precio.");
    }
  }
}

customElements.define("wc-materiales", WCMateriales);