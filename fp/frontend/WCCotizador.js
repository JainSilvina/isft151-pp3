import { WCMateriales } from "./WCMateriales.js";
import { WCLogin } from "./WCLogin.js";

export class WCCotizador extends HTMLElement {
  constructor() {
    super();
    this.classList.add("w3-container", "w3-margin-top");
    this.currentUser = null;
    this.materials = [];
    this.preMixes = [];
    this.currentFormType = 'ladrillos'; 
    
    this.areaInput = null;
    this.espesorInput = null;
    this.juntaInput = null;
    this.volumenInput = null;
    
   
    this.largoInput = null;
    this.anchoInput = null;
    this.espesorHormigonInput = null;
  }

  connectedCallback() {
    try {
      this.currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
    } catch {}

    const header = document.createElement("header");
    header.classList.add("w3-container", "w3-blue");
    header.innerHTML = `<h1>Cotizador de Materiales</h1>
      <div>Usuario: ${this.currentUser?.username || "Invitado"} (${this.currentUser?.role || "N/D"})</div>`;
    this.appendChild(header);

    this.renderNavigationButtons();

    const pCot = document.createElement("p");
    const lblCot = document.createElement("label");
    lblCot.textContent = "Seleccionar Tipo de Cotizador:";
    this.cotizadorSelect = document.createElement("select");
    this.cotizadorSelect.classList.add("w3-select", "w3-margin-bottom");
    
    const cotizadores = [
        { value: "ladrillos", text: "Ladrillos/Bloques" },
        { value: "revoque", text: "Revoque" },
        { value: "hormigon", text: "Hormigón" }
    ];

    cotizadores.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.value;
        opt.textContent = c.text;
        this.cotizadorSelect.appendChild(opt);
    });

    this.cotizadorSelect.onchange = () => {
        this.currentFormType = this.cotizadorSelect.value;
        this.renderForm();
    };
    
    pCot.append(lblCot, this.cotizadorSelect);
    this.appendChild(pCot);

    this.formDiv = document.createElement("div");
    this.appendChild(this.formDiv);

    this.resultDiv = document.createElement("div");
    this.resultDiv.classList.add("w3-panel", "w3-border", "w3-light-grey", "w3-margin-top");
    this.resultDiv.innerHTML = "<h4>Resultados de la Cotización</h4>";
    this.appendChild(this.resultDiv);

    this.loadData().then(() => {
        this.renderForm();
    });
  }
  
  renderNavigationButtons() {
    const btns = document.createElement("div");
    btns.classList.add("w3-margin");

    const btnProveedores = document.createElement("button");
    btnProveedores.textContent = "Ver Precios de Proveedores";
    btnProveedores.classList.add("w3-button", "w3-green");
    btnProveedores.onclick = () => {
      document.body.innerHTML = "";
      document.body.appendChild(new WCMateriales());
    };
    btns.appendChild(btnProveedores);
    
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
  }

  async loadData() {
    try {
        const [resMat, resPremix] = await Promise.all([
            fetch("http://127.0.0.1:5000/api/materials"),
            fetch("http://127.0.0.1:5000/api/pre_mixes")
        ]);

        if (!resMat.ok || !resPremix.ok) {
            throw new Error("Error al cargar materiales o premezclas.");
        }

        this.materials = await resMat.json();
        this.preMixes = await resPremix.json();

    } catch (err) {
        console.error("Error cargando datos:", err);
        this.resultDiv.innerHTML = `<div class="w3-panel w3-red">${err.message || 'Error de conexión con la API.'}</div>`;
    }
  }

  renderForm() {
    this.formDiv.innerHTML = "";

    const form = document.createElement("form");
    form.classList.add("w3-container", "w3-card-4", "w3-light-grey", "w3-margin-bottom");
    
    if (this.currentFormType === 'ladrillos') {
        form.onsubmit = (e) => this.onCotizar(e, 'ladrillos');
        form.innerHTML = `<h3>Cotizador de Muros (Ladrillos/Bloques)</h3>`;

        this.areaInput = this.createInput('Área Total (m²)', 'number', 10.0);
        this.espesorInput = this.createInput('Espesor del muro (cm)', 'number', 18.0);
        this.juntaInput = this.createInput('Junta (mm)', 'number', 10.0);
        
        const pMat = document.createElement('p');
        pMat.innerHTML = `<label>Material de Muro:</label>`;
        this.materialSelect = document.createElement("select");
        this.materialSelect.classList.add("w3-select");
        this.materials.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.id;
            opt.textContent = m.name;
            this.materialSelect.appendChild(opt);
        });
        pMat.appendChild(this.materialSelect);
        
        this.usePremixCheckbox = document.createElement('input');
        this.usePremixCheckbox.type = 'checkbox';
        this.usePremixCheckbox.onchange = () => this.togglePremixSelection();
        
        const pCheck = document.createElement('p');
        pCheck.innerHTML = `<label>Usar Premezcla para Mortero:</label>`;
        pCheck.prepend(this.usePremixCheckbox);
        
        this.premixSelectDiv = document.createElement('div');
        this.premixSelectDiv.style.display = 'none';
        
        const pPremix = document.createElement('p');
        pPremix.innerHTML = `<label>Seleccionar Premezcla:</label>`;
        this.premixSelect = document.createElement("select");
        this.premixSelect.classList.add("w3-select");
        this.preMixes.forEach(pm => {
            const opt = document.createElement("option");
            opt.value = pm.id;
            opt.textContent = pm.name;
            this.premixSelect.appendChild(opt);
        });
        pPremix.appendChild(this.premixSelect);
        this.premixSelectDiv.appendChild(pPremix);

        form.append(
            this.areaInput.parentNode, 
            this.espesorInput.parentNode, 
            this.juntaInput.parentNode, 
            pMat, 
            pCheck, 
            this.premixSelectDiv
        );
        this.togglePremixSelection();
        
    } else if (this.currentFormType === 'revoque') {
        form.onsubmit = (e) => this.onCotizar(e, 'revoque');
        form.innerHTML = `<h3>Cotizador de Revoque Grueso a la Cal</h3>`;
        
        this.areaInput = this.createInput('Área Total a revocar (m²)', 'number', 10.0);
        this.espesorInput = this.createInput('Espesor de Revoque (cm)', 'number', 2.0);
        
        form.append(this.areaInput.parentNode, this.espesorInput.parentNode);
        
    } else if (this.currentFormType === 'hormigon') {
        form.onsubmit = (e) => this.onCotizar(e, 'hormigon');
        form.innerHTML = `<h3>Cotizador de Hormigón (H-21)</h3>
            <p class="w3-small w3-text-grey">Ingrese las dimensiones (Losa) o el Volumen Total.</p>`;
        
        this.largoInput = this.createInput('Largo de la losa (m)', 'number', 4.0);
        this.anchoInput = this.createInput('Ancho de la losa (m)', 'number', 10.0);
        this.espesorHormigonInput = this.createInput('Espesor de la losa (cm)', 'number', 10.0);
        
        const pO = document.createElement('p');
        pO.innerHTML = `<h4 class="w3-center w3-border-bottom w3-padding">O</h4>`;
        
        this.volumenInput = this.createInput('Volumen Total (m³)', 'number', 0.0);
        
        form.append(
            this.largoInput.parentNode,
            this.anchoInput.parentNode,
            this.espesorHormigonInput.parentNode,
            pO,
            this.volumenInput.parentNode
        );
    }
    
    const btnCotizar = document.createElement("button");
    btnCotizar.textContent = "Cotizar Materiales";
    btnCotizar.type = "submit";
    btnCotizar.classList.add("w3-button", "w3-blue", "w3-margin-top", "w3-margin-bottom");
    form.appendChild(btnCotizar);

    this.formDiv.appendChild(form);
  }

  createInput(labelText, type, defaultValue) {
    const p = document.createElement("p");
    const input = document.createElement("input");
    input.type = type;
    input.classList.add("w3-input");
    input.required = true;
    input.min = type === 'number' ? '0' : undefined;
    if (defaultValue !== undefined) {
        input.value = defaultValue;
    }
    const lbl = document.createElement("label");
    lbl.textContent = labelText;
    p.append(input, lbl);
    return input; 
  }

  togglePremixSelection() {
    if (this.usePremixCheckbox.checked) {
        this.premixSelectDiv.style.display = 'block';
        this.premixSelect.required = true;
    } else {
        this.premixSelectDiv.style.display = 'none';
        this.premixSelect.required = false;
    }
  }

  async onCotizar(e, formType) {
    e.preventDefault();
    this.resultDiv.innerHTML = `<div class="w3-padding w3-light-grey">Calculando...</div>`;

    let data = {};
    let url = "";

    try {
        if (formType === 'ladrillos') {
            url = "http://127.0.0.1:5000/api/cotizar";
            data = {
                area: parseFloat(this.areaInput.value),
                espesor: parseFloat(this.espesorInput.value),
                junta: parseFloat(this.juntaInput.value),
                material_id: parseInt(this.materialSelect.value),
                use_pre_mix: this.usePremixCheckbox.checked,
                pre_mix_id: this.usePremixCheckbox.checked ? parseInt(this.premixSelect.value) : null
            };
            
        } else if (formType === 'revoque') {
            url = "http://127.0.0.1:5000/api/cotizar/revoque";
            data = {
                area: parseFloat(this.areaInput.value),
                espesor: parseFloat(this.espesorInput.value)
            };

        } else if (formType === 'hormigon') {
            url = "http://127.0.0.1:5000/api/cotizar/hormigon";
            
            const largo = parseFloat(this.largoInput.value);
            const ancho = parseFloat(this.anchoInput.value);
            const espesor_cm = parseFloat(this.espesorHormigonInput.value);
            const volumen_m3_directo = parseFloat(this.volumenInput.value);

            if (largo > 0 && ancho > 0 && espesor_cm > 0) {
                
                data = { largo, ancho, espesor_cm };
                
            } else if (volumen_m3_directo > 0) {
                data = { volumen_m3: volumen_m3_directo };
            } else {
                throw new Error("Debe ingresar el Largo, Ancho y Espesor de la losa, o el Volumen total (m³).");
            }

        }
        
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const dataResult = await res.json();
        
        if (!res.ok) {
            this.resultDiv.innerHTML = `<div class="w3-panel w3-red">Error (${res.status}): ${dataResult.message || 'Error desconocido.'}</div>`;
            return;
        }

        sessionStorage.setItem("lastCotizacion", JSON.stringify(dataResult));
        
        this.renderResult(dataResult);
        
    } catch (err) {
        console.error("Error en onCotizar:", err);
        this.resultDiv.innerHTML = `<div class="w3-panel w3-red">${err.message || 'Error de conexión o datos.'}</div>`;
    }
  }

  renderResult(data) {
    let html = `<h4>Resultado de la Cotización: ${data.tipo}</h4>`;

    if (data.tipo === 'Hormigón') {
        html += `
            ${data.largo ? `<div>Dimensiones: ${data.largo} m x ${data.ancho} m x ${data.espesor_cm} cm</div>` : ''}
            <div>Volumen: <b>${data.volumen_m3} m³</b></div>
            <div>Dosificación: ${data.dosificacion}</div>
            <div class="w3-margin-top">
                <b>Cemento total (kg): ${data.cement_kg}</b><br>
                <b>Bolsas de Cemento (50kg): ${data.cement_bags}</b><br>
                <b>Arena (m³): ${data.sand_m3}</b><br>
                <b>Piedra/Grava (m³): ${data.gravel_m3}</b>
            </div>
        `;
    } else if (data.tipo === 'Revoque') {
        html += `
            <div>Área: ${data.area} m²</div>
            <div>Espesor: ${data.espesor_cm} cm</div>
            <div>Dosificación: ${data.dosificacion}</div>
            <div class="w3-margin-top">
                <b>Cemento (kg): ${data.cement_kg}</b><br>
                <b>Cal (kg): ${data.lime_kg}</b><br>
                <b>Arena (m³): ${data.sand_m3}</b>
            </div>
        `;
    } else if (data.tipo === 'Ladrillos/Bloques') {
        html += `
            <div>Material: ${data.material?.name || 'N/A'}</div>
            <div>Espesor de muro (base/cotizado): ${data.espesor_base} cm / ${data.espesor_cm} cm (Factor: ${data.factor_espesor})</div>
            <div>Unidades necesarias: <b>${data.required_units}</b></div>
            <div class="w3-margin-top">
                <b>Mortero total (m³): ${data.total_mortar_m3}</b>
                ${data.revoque_extra_m3 > 0 ? `(Incluye ${data.revoque_extra_m3} m³ extra por revoque)` : ''}
            </div>
            ${data.use_pre_mix ? `
                <div>Pre-mix: ${data.pre_mix?.name || 'N/A'} - Bolsas: <b>${data.premix_bags}</b></div>
            ` : `
                <div>Cemento (kg): ${data.cement_kg} (Bolsas: ${data.cement_bags})</div>
                <div>Arena (m³): ${data.sand_m3}</div>
                <div>Cal (kg): ${data.lime_kg}</div>
            `}
        `;
    } else {
         html += `<div class="w3-panel w3-yellow">Tipo de cotización no reconocida.</div>`;
    }

    this.resultDiv.innerHTML = html;
  }
}

customElements.define("wc-cotizador", WCCotizador);