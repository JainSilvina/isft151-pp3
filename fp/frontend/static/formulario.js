const { createElement } = require("react");

class FormularioComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }); 
    }

    connectedCallback() {
        
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                /* Adaptación de estilos para el Shadow DOM */
                .w3-card {
                    background: white;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .w3-input, .w3-select {
                    width: 100%;
                    padding: 10px;
                    margin-top: 5px;
                    margin-bottom: 15px;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    box-sizing: border-box;
                }
                .w3-button {
                    background-color: #007BFF; /* Usando el color de styles.css */
                    color: white;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 20px;
                }
                .w3-code {
                    white-space: pre;
                    overflow: auto;
                    background-color: #f1f1f1;
                    padding: 12px;
                    border: 1px solid #ccc;
                    margin-top: 10px;
                }
            </style>

            <h2>Cotizador</h2>
            <form id="calcForm" class="w3-card">
                <p>
                    <label>Tipo de ladrillo:</label>
                    <select id="material" class="w3-select"></select>
                </p>
                <p>
                    <label>Espesor de pared (cm):</label>
                    <input type="number" id="espesor" value="25" class="w3-input">
                </p>
                <p>
                    <label>Área de pared (m²):</label>
                    <input type="number" id="area" step="0.1" class="w3-input">
                </p>
                <p>
                    <label>Usar mortero premezclado?</label>
                    <select id="pre_mix" class="w3-select">
                        <option value="">-- No usar --</option>
                    </select>
                </p>
                <button type="button" class="w3-button" id="calcular-btn">Calcular</button>
            </form>
            <h3>Resultado:</h3>
            <pre id="resultado" class="w3-code"></pre>
        `;

        
        this.shadowRoot.getElementById("calcular-btn").addEventListener('click', () => this.calcular());


        this.cargarMateriales();
        this.cargarPreMixes();
    }

   /* cambiar esto y pasar a crear la base de datos
    async cargarMateriales() {
        
        const materialesData = [
            { id: 'ladrillo_hueco', name: 'Ladrillo Cerámico Hueco 12x24x6' },
            { id: 'ladrillo_comun', name: 'Ladrillo Común (Macizo) 12x25x5' },
            { id: 'bloque_hormigon', name: 'Bloque de Hormigón 20x40x20' },
        ];
       */
        //AGREGADO 20:49 HS  2/10/25
        const select = this.shadowRoot.getElementById("material");

        try {
            
            const res = await fetch("api/materials");
            const data = await res.json();
            data.forEach(m =>{
                const opt = document.createElement("option");
                opt.value= m.id;
                opt.textContent= m.name;
                Selection.appendChild(opt);

            });
        } catch (error) {
            console.error("error al cargar materiales(API /api/materials no responde):", error);
        }
        }

        //no necesito esta parte, no me sirve
       /* const defaultOpt = document.createElement("option");
        defaultOpt.value = "";
        defaultOpt.textContent = "-- Seleccione un Material --";
        select.appendChild(defaultOpt);*/

    // ya no lo necesito harcodeado
    /*async cargarPreMixes() {
       
        const preMixesData = [
            { id: 'mortero_a', name: 'Mortero Premezclado Tipo A', uso: 'Mampostería Portante' },
            { id: 'mortero_b', name: 'Mortero Premezclado Tipo B', uso: 'Revoque Fino' },
            { id: 'mortero_c', name: 'Mortero Premezclado Tipo C', uso: 'Mampostería No Portante' },
        ]; */
        // ----------------------------------------------------------------------

        const select = this.shadowRoot.getElementById("pre_mix");
        
        preMixesData.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = p.name + " (" + p.uso + ")";
            select.appendChild(opt);
        });
       
    }

    async calcular() {
        
        const area = parseFloat(this.shadowRoot.getElementById("area").value);
        const espesor = parseFloat(this.shadowRoot.getElementById("espesor").value);
        const material_id = this.shadowRoot.getElementById("material").value;
        const pre_mix_id = this.shadowRoot.getElementById("pre_mix").value;
        const resultadoDisplay = this.shadowRoot.getElementById("resultado");
        
        
        if (isNaN(area) || area <= 0 || isNaN(espesor) || espesor <= 0 || material_id === "") {
            resultadoDisplay.textContent = JSON.stringify({
                "Error": "Datos Incompletos/Inválidos", 
                "Detalle": "Hay que asegurar, que el Área, Espesor sean números positivos y que haya seleccionado un Tipo de Ladrillo."
            }, null, 2);
            return;
        }

        const use_pre_mix = pre_mix_id !== "";
        
        
        try {
            const res = await fetch("/api/cotizar", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({area, espesor, material_id, use_pre_mix, pre_mix_id: pre_mix_id || null})
            });
            
            const data = await res.json();
            resultadoDisplay.textContent = JSON.stringify(data, null, 2);
            
        } catch (error) {
            
            resultadoDisplay.textContent = JSON.stringify({
                "Estado": "Es una simulacion (Backend no esta disponible por ahora)",
                "Material": material_id,
                "Área_m2": area,
                "Mortero": use_pre_mix ? pre_mix_id : "No aplica",
                "Resultado_Ejemplo": "Se necesitan aproximadamente " + (area * 40).toFixed(0) + " unidades de " + material_id,
                "Nota": "Es una simulación. Después hay que implementar/api/cotizar en el backend, si todo marcha bien."
            }, null, 2);
        }
    }
}

customElements.define("formulario-component", FormularioComponent);