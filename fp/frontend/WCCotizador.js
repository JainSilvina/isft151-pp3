import { WCMateriales } from "./WCMateriales.js";

export class WCCotizador extends HTMLElement {
  constructor() {
    super();
    this.classList.add("w3-container", "w3-margin-top");

    const title = document.createElement("h2");
    title.textContent = "Cotizador de Ladrillos y Mortero";
    this.appendChild(title);

    this.form = document.createElement("form");
    this.form.classList.add("w3-card", "w3-padding");

    const pMat = document.createElement("p");
    const lblMat = document.createElement("label");
    lblMat.textContent = "Tipo de ladrillo:";
    this.materialSelect = document.createElement("select");
    this.materialSelect.classList.add("w3-select");
    pMat.append(lblMat, this.materialSelect);
    this.form.append(pMat);

    const pEsp = document.createElement("p");
    const lblEsp = document.createElement("label");
    lblEsp.textContent = "Espesor de pared (cm):";
    this.espesorInput = document.createElement("input");
    this.espesorInput.type = "number";
    this.espesorInput.value = 25;
    this.espesorInput.classList.add("w3-input");
    pEsp.append(lblEsp, this.espesorInput);
    this.form.append(pEsp);

    const pJunta = document.createElement("p");
    const lblJunta = document.createElement("label");
    lblJunta.textContent = "Espesor de junta (cm):";
    this.juntaInput = document.createElement("input");
    this.juntaInput.type = "number";
    this.juntaInput.value = 1.5;
    this.juntaInput.step = "0.1";
    this.juntaInput.classList.add("w3-input");
    pJunta.append(lblJunta, this.juntaInput);
    this.form.append(pJunta);

    const pArea = document.createElement("p");
    const lblArea = document.createElement("label");
    lblArea.textContent = "Área de pared (m²):";
    this.areaInput = document.createElement("input");
    this.areaInput.type = "number";
    this.areaInput.step = "0.1";
    this.areaInput.classList.add("w3-input");
    pArea.append(lblArea, this.areaInput);
    this.form.append(pArea);

    const pPre = document.createElement("p");
    const lblPre = document.createElement("label");
    lblPre.textContent = "Usar mortero premezclado:";
    this.preMixSelect = document.createElement("select");
    this.preMixSelect.classList.add("w3-select");
    const optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "-- No usar --";
    this.preMixSelect.append(optNone);
    pPre.append(lblPre, this.preMixSelect);
    this.form.append(pPre);

    const pBtns = document.createElement("p");
    const btnCalc = document.createElement("button");
    btnCalc.type = "button";
    btnCalc.textContent = "Calcular";
    btnCalc.classList.add("w3-button", "w3-teal");
    btnCalc.onclick = this.calcular.bind(this);
    pBtns.append(btnCalc);

    const btnSelect = document.createElement("button");
    btnSelect.type = "button";
    btnSelect.textContent = "Seleccionar materiales";
    btnSelect.classList.add("w3-button", "w3-blue", "w3-margin-left");
    btnSelect.onclick = () => {
      const sup = new WCMateriales();
      try {
        sup.currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
      } catch {}
      document.body.innerHTML = "";
      document.body.appendChild(sup);
    };
    pBtns.append(btnSelect);
    this.form.append(pBtns);

    this.summaryDiv = document.createElement("div");
    this.summaryDiv.classList.add("w3-panel", "w3-light-grey", "w3-padding", "w3-margin-top");
    this.summaryDiv.textContent = "Aquí se mostrará el resultado de la cotización.";

    this.append(this.form, this.summaryDiv);
  }

  connectedCallback() {
    this.cargarMateriales();
    this.cargarPreMixes();
  }

  async cargarMateriales() {
    const r = await fetch("http://127.0.0.1:5000/api/materials");
    const data = await r.json();
    this.materialSelect.innerHTML = "";
    data.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.name} (${m.espesor_cm || "?"} cm)`;
      this.materialSelect.appendChild(opt);
    });
  }

  async cargarPreMixes() {
    const r = await fetch("http://127.0.0.1:5000/api/pre_mixes");
    const data = await r.json();
    this.preMixSelect.innerHTML = "";
    const noneOpt = document.createElement("option");
    noneOpt.value = "";
    noneOpt.textContent = "-- No usar --";
    this.preMixSelect.append(noneOpt);
    data.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.uso || ''})`;
      this.preMixSelect.append(opt);
    });
  }

  async calcular() {
    const area = parseFloat(this.areaInput.value || 0);
    const espesor = parseFloat(this.espesorInput.value || 0);
    const junta = parseFloat(this.juntaInput.value || 1.5);
    const material_id = this.materialSelect.value;
    const pre_mix_id = this.preMixSelect.value;
    const use_pre_mix = pre_mix_id !== "";

    try {
      const r = await fetch("http://127.0.0.1:5000/api/cotizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area, espesor, junta, material_id, use_pre_mix, pre_mix_id: pre_mix_id || null })
      });
      if (!r.ok) throw new Error("Error al calcular cotización");
      const data = await r.json();
      sessionStorage.setItem("lastCotizacion", JSON.stringify(data));

      this.summaryDiv.innerHTML = `
        <strong>Resultado de la cotización</strong>
        <div>Área: ${data.area} m²</div>
        <div>Espesor del muro: ${data.espesor_cm} cm</div>
        <div>Junta: ${data.junta_cm} cm (factor ${data.factor_junta})</div>
        <div>Material: ${data.material?.name || 'N/A'}</div>
        <div>Unidades necesarias: ${data.required_units}</div>
        <div>Mortero total (m³): ${data.total_mortar_m3}</div>
        <div>Cemento (kg): ${data.cement_kg}</div>
        <div>Arena (m³): ${data.sand_m3}</div>
        <div>Cal (kg): ${data.lime_kg}</div>
        <div>Pre-mix: ${data.pre_mix?.name || 'No'} ${data.premix_bags ? `- Bolsas: ${data.premix_bags}` : ''}</div>
        <div class="w3-margin-top"><em>Ahora puede hacer clic en "Seleccionar materiales" para elegir precios de proveedores.</em></div>
      `;
      alert("Cotización calculada y guardada.");
    } catch (err) {
      console.error(err);
      alert("Error al calcular la cotización.");
    }
  }
}
customElements.define("wc-cotizador", WCCotizador);