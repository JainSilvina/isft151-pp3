// frontend/CustomCotizador.js

export class CustomCotizador extends HTMLElement {
  constructor() {
    super();
    this.classList.add("w3-container", "w3-margin-top");

    this.form = document.createElement("form");
    this.form.classList.add("w3-card", "w3-padding");

    // --- Campos del formulario ---
    let pMat = document.createElement("p");
    let lblMat = document.createElement("label");
    lblMat.textContent = "Tipo de ladrillo:";
    this.materialSelect = document.createElement("select");
    this.materialSelect.classList.add("w3-select");
    pMat.appendChild(lblMat);
    pMat.appendChild(this.materialSelect);
    this.form.appendChild(pMat);


    let pEsp = document.createElement("p");
    let lblEsp = document.createElement("label");
    lblEsp.textContent = "Espesor de pared (cm):";
    this.espesorInput = document.createElement("input");
    this.espesorInput.type = "number";
    this.espesorInput.value = 25;
    this.espesorInput.classList.add("w3-input");
    pEsp.appendChild(lblEsp);
    pEsp.appendChild(this.espesorInput);
    this.form.appendChild(pEsp);

  
    let pArea = document.createElement("p");
    let lblArea = document.createElement("label");
    lblArea.textContent = "Área de pared (m²):";
    this.areaInput = document.createElement("input");
    this.areaInput.type = "number";
    this.areaInput.step = "0.1";
    this.areaInput.classList.add("w3-input");
    pArea.appendChild(lblArea);
    pArea.appendChild(this.areaInput);
    this.form.appendChild(pArea);

    // PreMix
    let pPre = document.createElement("p");
    let lblPre = document.createElement("label");
    lblPre.textContent = "Usar mortero premezclado?";
    this.preMixSelect = document.createElement("select");
    this.preMixSelect.classList.add("w3-select");
    let optNone = document.createElement("option");
    optNone.value = "";
    optNone.textContent = "-- No usar --";
    this.preMixSelect.appendChild(optNone);
    pPre.appendChild(lblPre);
    pPre.appendChild(this.preMixSelect);
    this.form.appendChild(pPre);

  
    let btnCalc = document.createElement("button");
    btnCalc.type = "button";
    btnCalc.textContent = "Calcular";
    btnCalc.classList.add("w3-button", "w3-teal", "w3-margin-top");
    btnCalc.onclick = this.calcular.bind(this);
    this.form.appendChild(btnCalc);

    // Resultado
    this.resultado = document.createElement("pre");
    this.resultado.classList.add("w3-code", "w3-margin-top");

    // Título y montaje
    let h2 = document.createElement("h2");
    h2.textContent = "Cotizador de Ladrillos y Mortero";
    this.appendChild(h2);
    this.appendChild(this.form);
    this.appendChild(this.resultado);
  }

  connectedCallback() {
    this.cargarMateriales();
    this.cargarPreMixes();
  }

  // --- Métodos para cargar datos desde backend ---
  async cargarMateriales() {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/materials");
      if (!res.ok) throw new Error("Error al cargar materiales");
      const data = await res.json();
      data.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.name;
        this.materialSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      alert("❌ No se pudieron cargar los materiales");
    }
  }

  async cargarPreMixes() {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/pre_mixes");
      if (!res.ok) throw new Error("Error al cargar pre-mixes");
      const data = await res.json();
      data.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p.id;
        opt.textContent = `${p.name} (${p.uso})`;
        this.preMixSelect.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
      alert("❌ No se pudieron cargar los pre-mixes");
    }
  }

  async calcular() {
    const area = parseFloat(this.areaInput.value);
    const espesor = parseFloat(this.espesorInput.value);
    const material_id = this.materialSelect.value;
    const pre_mix_id = this.preMixSelect.value;
    const use_pre_mix = pre_mix_id !== "";

    try {
      const res = await fetch("http://127.0.0.1:5000/api/cotizar", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ area, espesor, material_id, use_pre_mix, pre_mix_id: pre_mix_id || null })
      });

      if (!res.ok) throw new Error("Error en el cálculo");

      const data = await res.json();
      this.resultado.textContent = JSON.stringify(data, null, 2);
    } catch (err) {
      console.error(err);
      alert("❌ No se pudo realizar la cotización");
    }
  }
}

customElements.define("x-cotizador", CustomCotizador);