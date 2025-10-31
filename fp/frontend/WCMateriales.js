import { WCLogin } from "./WCLogin.js";
import { WCCotizador } from "./WCCotizador.js"; 

export class WCMateriales extends HTMLElement {
	constructor() {
		super();
		this.classList.add("w3-container", "w3-margin-top");
		this.currentUser = null;
		this.lastCotizacion = null;
		this.totalSeleccion = 0;
        this.pricesSummary = []; 
        
        this.allMaterials = []; 
        this.allPremixes = [];   
        
        this.supplierPrices = []; 
        this.itemTypeSelect = null;
        this.itemSelect = null;
        this.itemNameInput = null;
        this.priceInput = null;
        this.unitSelect = null;
	}

	connectedCallback() {
		try {
			this.currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "null");
		} catch {}
		try {
			this.lastCotizacion = JSON.parse(sessionStorage.getItem("lastCotizacion") || "null");
		} catch {}

		const header = document.createElement("header");
        const headerTitle = this.currentUser?.role === 'proveedor' ? 
            "Gestión de Precios (Proveedor)" : 
            "Selección de Materiales (Cliente)";
            
		header.classList.add("w3-container", "w3-purple");
		header.innerHTML = `<h1>${headerTitle}</h1>
		 	<div>Usuario: ${this.currentUser?.username || "Invitado"} (${this.currentUser?.role || "N/D"})</div>`;
		this.appendChild(header);

        this.renderNavigationButtons();

        this.contentDiv = document.createElement("div");
        this.contentDiv.classList.add("w3-margin-top");
        this.appendChild(this.contentDiv);

        this.totalDiv = document.createElement("div"); 
        this.totalDiv.classList.add("w3-panel", "w3-border", "w3-light-grey", "w3-margin-top");
        this.totalDiv.innerHTML = "<h4>Total Seleccionado: $0.00</h4>";
        this.appendChild(this.totalDiv);

        this.renderContent();
	}

    renderContent() {
        this.contentDiv.innerHTML = '';
        const isSupplier = this.currentUser && this.currentUser.role === 'proveedor';
        
        if (isSupplier) {
            this.totalDiv.style.display = 'none'; 
            this.renderABMForm(); 
            this.loadAllItems(); 
            this.loadSupplierPrices(); 
        } else {
            this.totalDiv.style.display = 'block'; 
            this.loadData(); 
        }
    }

    renderNavigationButtons() {
        const btns = document.createElement("div");
        btns.classList.add("w3-margin");

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

        if (this.currentUser?.role !== "proveedor") {
            const btnCotizador = document.createElement("button");
            btnCotizador.textContent = "Volver al Cotizador";
            btnCotizador.classList.add("w3-button", "w3-blue");
            btnCotizador.onclick = () => {
              document.body.innerHTML = "";
              document.body.appendChild(new WCCotizador());
            };
            btns.prepend(btnCotizador);
        }

        this.appendChild(btns);
    }

    prepareRequiredItems() {
        if (!this.lastCotizacion) return [];

        const cotizacion = this.lastCotizacion;
        const items = [];
        
        if (cotizacion.tipo === 'Ladrillos/Bloques' && cotizacion.material?.id) {
            items.push({ 
                id: cotizacion.material.id, 
                type: 'material', 
                quantity: cotizacion.required_units,
                unit: 'unidad'
            });
            
            if (!cotizacion.use_pre_mix) {
                if (cotizacion.cement_kg > 0) {
                    const quantityToQuote = cotizacion.cement_bags || Math.ceil(cotizacion.cement_kg / 50);
                    items.push({ name: 'Cemento x 50kg', type: 'base', quantity: quantityToQuote, unit: 'bolsa' });
                }
                if (cotizacion.sand_m3 > 0) {
                    items.push({ name: 'Arena', type: 'base', quantity: cotizacion.sand_m3, unit: 'm³' });
                }
                if (cotizacion.lime_kg > 0) {
                    items.push({ name: 'Cal', type: 'base', quantity: cotizacion.lime_kg, unit: 'kg' });
                }
            } else if (cotizacion.use_pre_mix && cotizacion.pre_mix?.id) {
                items.push({ 
                    id: cotizacion.pre_mix.id, 
                    type: 'premix', 
                    quantity: cotizacion.premix_bags,
                    unit: 'bolsa'
                });
            }
        } 
        else if (cotizacion.tipo === 'Revoque') {
            if (cotizacion.cement_kg > 0) {
                const quantityToQuote = cotizacion.cement_bags || Math.ceil(cotizacion.cement_kg / 50);
                items.push({ name: 'Cemento x 50kg', type: 'base', quantity: quantityToQuote, unit: 'bolsa' });
            }
            if (cotizacion.lime_kg > 0) {
                items.push({ name: 'Cal', type: 'base', quantity: cotizacion.lime_kg, unit: 'kg' });
            }
            if (cotizacion.sand_m3 > 0) {
                items.push({ name: 'Arena', type: 'base', quantity: cotizacion.sand_m3, unit: 'm³' });
            }
        }
        else if (cotizacion.tipo === 'Hormigón') {
            if (cotizacion.cement_bags > 0) {
                items.push({ name: 'Cemento x 50kg', type: 'base', quantity: cotizacion.cement_bags, unit: 'bolsa' });
            }
            if (cotizacion.sand_m3 > 0) {
                items.push({ name: 'Arena', type: 'base', quantity: cotizacion.sand_m3, unit: 'm³' });
            }
            if (cotizacion.gravel_m3 > 0) {
                items.push({ name: 'Piedra/Grava', type: 'base', quantity: cotizacion.gravel_m3, unit: 'm³' }); 
            }
        }
        return items;
    }

    async loadData() {
        this.contentDiv.innerHTML = `<div class="w3-padding w3-light-grey">Cargando precios de proveedores...</div>`;

        try {
            const requiredItems = this.prepareRequiredItems();
            
            if (requiredItems.length === 0) {
                this.contentDiv.innerHTML = '<div class="w3-panel w3-yellow">No se encontraron materiales en la última cotización. Por favor, realice una cotización primero.</div>';
                return;
            }

            const res = await fetch("http://127.0.0.1:5000/api/prices/needed", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ required_items: requiredItems })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            this.pricesSummary = data.prices_summary;
            
            this.renderPrices(requiredItems);

        } catch (err) {
            console.error("Error en loadData:", err);
            this.contentDiv.innerHTML = `<div class="w3-panel w3-red">${err.message || 'Error de conexión o datos. Verifique la API.'}</div>`;
        }
    }

    renderPrices(requiredItems) {
        this.contentDiv.innerHTML = ""; 
        this.totalSeleccion = 0; 

        const table = document.createElement("table");
        table.classList.add("w3-table-all", "w3-centered", "w3-hoverable");
        
        const header = table.createTHead();
        const row = header.insertRow();
        ['Material', 'Cantidad Necesaria', 'Proveedor', 'Precio Unitario', 'Subtotal', 'Seleccionar'].forEach(text => {
            const th = document.createElement("th");
            th.textContent = text;
            row.appendChild(th);
        });
        
        const body = table.createTBody();

        this.pricesSummary.forEach(itemPriceData => {
            const item_name = itemPriceData.item_name;
            
            const requiredItem = requiredItems.find(item => {
                if (item.type !== itemPriceData.item_type) {
                    return false;
                }
                
                if (item.type === 'base') {
                    return item.name === itemPriceData.item_id;
                } else {
                    return item.id == itemPriceData.item_id; 
                }
            });

            if (!requiredItem) {
                console.warn("No se encontró el item requerido para:", itemPriceData);
                return; 
            }

            const neededQuantity = requiredItem.quantity;
            const neededUnit = requiredItem.unit;

            itemPriceData.prices.forEach(priceObj => {
                const tr = body.insertRow();
                
                const tdMaterial = tr.insertCell();
                tdMaterial.innerHTML = `<b>${item_name}</b><br><small>(${neededQuantity.toFixed(neededQuantity > 10 ? 0 : 2)} ${neededUnit} aprox.)</small>`;
                
                tr.insertCell().textContent = `${neededQuantity.toFixed(neededQuantity > 10 ? 0 : 2)} ${neededUnit}`;
                tr.insertCell().textContent = priceObj.supplier;
                tr.insertCell().textContent = `$${priceObj.price.toFixed(2)} / ${priceObj.unit}`;

                const subtotal = neededQuantity * priceObj.price;
                tr.insertCell().textContent = `$${subtotal.toFixed(2)}`;
                
                const btnSelect = document.createElement("button");
                btnSelect.textContent = "Seleccionar";
                btnSelect.classList.add("w3-button", "w3-green", "w3-tiny");
                
                btnSelect.onclick = () => this.selectPrice(item_name, priceObj, subtotal);
                tr.insertCell().appendChild(btnSelect);
            });
        });

        this.contentDiv.appendChild(table);
        this.updateTotal(); 
    }

    selectPrice(itemName, priceObj, subtotal) {
        alert(`Seleccionado: ${itemName} con ${priceObj.supplier} por $${subtotal.toFixed(2)}.`);
        this.totalSeleccion += subtotal;
        this.updateTotal();
    }
    
    updateTotal() {
        this.totalDiv.innerHTML = `<h4>Total Seleccionado: $${this.totalSeleccion.toFixed(2)}</h4>`;
    }

    async loadSupplierPrices() {
        if (!this.currentUser || this.currentUser.role !== 'proveedor') return;
        
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/supplier/prices/${this.currentUser.id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            this.supplierPrices = data;
            this.renderSupplierPricesTable();
        } catch (err) {
            console.error("Error cargando precios del proveedor:", err);
            const container = document.querySelector('#supplier-prices-container');
            if (container) {
                 container.innerHTML = `<h2 class="w3-text-red">Error al cargar Mis Precios</h2><p class="w3-text-red">${err.message || 'Error de conexión.'}</p>`;
            }
        }
    }

    async loadAllItems() {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/all_items`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            this.allMaterials = data.filter(item => item.type === 'material');
            this.allPremixes = data.filter(item => item.type === 'pre_mix');
            
            const itemNameCol = this.contentDiv.querySelector('#item-name-col');
            if (itemNameCol) {
                this.updateABMFormFields(itemNameCol); 
            }
        } catch (err) {
            console.error("Error cargando todos los ítems:", err);
        }
    }

    renderSupplierPricesTable() {
        const container = this.contentDiv.querySelector('#supplier-prices-container');
        if (!container) return; 

        container.innerHTML = '<h2>Mis Precios Publicados</h2>';
        
        if (this.supplierPrices.length === 0) {
            container.innerHTML += '<p class="w3-text-grey">Aún no tiene precios publicados. Use el formulario de arriba para cargar uno.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.classList.add('w3-table', 'w3-bordered', 'w3-striped');
        table.innerHTML = `
            <thead>
                <tr class="w3-light-grey">
                    <th>ID Precio</th>
                    <th>Tipo</th>
                    <th>Material/PreMix</th>
                    <th>Precio</th>
                    <th>Unidad</th>
                    <th>Acciones</th>
                </tr>
            </thead>
        `;
        const tbody = document.createElement('tbody');

        this.supplierPrices.forEach(price => {
            const tr = tbody.insertRow();
            tr.insertCell().textContent = price.id;
            tr.insertCell().textContent = price.type === 'material' ? 'Material' : 'Pre Mezcla';
            tr.insertCell().textContent = price.item_name;
            tr.insertCell().textContent = `$${price.price.toFixed(2)}`;
            tr.insertCell().textContent = price.unit;
            
            const tdActions = tr.insertCell();
            
            const btnEdit = document.createElement("button");
            btnEdit.textContent = "Editar";
            btnEdit.classList.add("w3-button", "w3-yellow", "w3-tiny", "w3-margin-right");
            btnEdit.onclick = () => this.handleUpdatePrice(price);
            tdActions.appendChild(btnEdit);

            const btnDelete = document.createElement("button");
            btnDelete.textContent = "Eliminar";
            btnDelete.classList.add("w3-button", "w3-red", "w3-tiny");
            btnDelete.onclick = () => this.deletePrice(price); 
            tdActions.appendChild(btnDelete);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    }

    renderABMForm() {
        
        if (this.contentDiv.querySelector('#supplier-abm-form')) {
            this.updateABMFormFields(this.contentDiv.querySelector('#item-name-col'));
            return;
        }
        
        const formContainer = document.createElement('div');
        formContainer.id = 'supplier-abm-form';
        formContainer.classList.add('w3-card', 'w3-padding', 'w3-light-grey', 'w3-margin-bottom');
        
        const formTitle = document.createElement('h3');
        formTitle.textContent = 'Cargar Nuevo Precio/Ítem';
        formContainer.appendChild(formTitle);

        const form = document.createElement('div');
        form.classList.add('w3-row-padding');
        
        const itemTypeCol = document.createElement('div');
        itemTypeCol.classList.add('w3-half', 'w3-margin-bottom');
        const lblType = document.createElement('label');
        lblType.textContent = 'Tipo de Ítem:';
        this.itemTypeSelect = document.createElement('select');
        this.itemTypeSelect.classList.add('w3-select');
        this.itemTypeSelect.innerHTML = `
            <option value="" disabled selected>Seleccione el tipo</option>
            <option value="material">Material Existente</option>
            <option value="pre_mix">Pre Mezcla Existente</option>
            <option value="new_material">Nuevo Material (Ladrillo/Bloque, etc.)</option>
            <option value="new_pre_mix">Nueva Pre Mezcla</option>
        `;
        itemTypeCol.append(lblType, this.itemTypeSelect);
        form.appendChild(itemTypeCol);
        
        const itemSelectCol = document.createElement('div');
        itemSelectCol.classList.add('w3-half', 'w3-margin-bottom');
        const lblItem = document.createElement('label');
        lblItem.textContent = 'Ítem Existente:';
        this.itemSelect = document.createElement('select');
        this.itemSelect.classList.add('w3-select');
        itemSelectCol.append(lblItem, this.itemSelect);
        form.appendChild(itemSelectCol);
        
        const itemNameCol = document.createElement('div');
        itemNameCol.id = 'item-name-col';
        itemNameCol.classList.add('w3-full', 'w3-margin-bottom');
        const itemNameObj = this.createInput('text', 'Nombre del nuevo Ítem:', 'Ingrese el nombre del material/premezcla');
        this.itemNameInput = itemNameObj.input;
        itemNameCol.append(itemNameObj.label, this.itemNameInput);
        formContainer.appendChild(itemNameCol); 
        
        const priceCol = document.createElement('div');
        priceCol.classList.add('w3-half', 'w3-margin-bottom');
        const priceObj = this.createInput('number', 'Precio:', 'Ej: 5000.50');
        this.priceInput = priceObj.input;
        this.priceInput.min = 0.01;
        this.priceInput.step = 0.01;
        priceCol.append(priceObj.label, this.priceInput);
        form.appendChild(priceCol);
        
        const unitCol = document.createElement('div');
        unitCol.classList.add('w3-half', 'w3-margin-bottom');
        const lblUnit = document.createElement('label');
        lblUnit.textContent = 'Unidad de Venta:';
        this.unitSelect = document.createElement('select');
        this.unitSelect.classList.add('w3-select');
        this.unitSelect.innerHTML = `
            <option value="" disabled selected>Seleccione unidad</option>
            <option value="unidad">Unidad</option>
            <option value="bolsa">Bolsa</option>
            <option value="bolsa 50kg">Bolsa 50kg</option>
            <option value="bolsa 25kg">Bolsa 25kg</option>
            <option value="m³">m³</option>
        `;
        unitCol.append(lblUnit, this.unitSelect);
        form.appendChild(unitCol);
   
        const btnCreate = document.createElement("button");
        btnCreate.textContent = "Cargar Precio/Ítem";
        btnCreate.classList.add("w3-button", "w3-green", "w3-margin-top");
        btnCreate.onclick = () => this.createPrice();
        
        formContainer.appendChild(form);
        formContainer.appendChild(btnCreate);

        const pricesContainer = document.createElement('div');
        pricesContainer.id = 'supplier-prices-container';
        pricesContainer.classList.add('w3-margin-top');
        
        this.contentDiv.appendChild(formContainer);
        this.contentDiv.appendChild(pricesContainer);

        this.itemTypeSelect.onchange = () => this.updateABMFormFields(itemNameCol);
        this.updateABMFormFields(itemNameCol); 
    }
    
    createInput(type, labelText, placeholder) {
        const lbl = document.createElement('label');
        lbl.textContent = labelText;
        const input = document.createElement('input');
        input.type = type;
        input.classList.add('w3-input');
        input.placeholder = placeholder;
        return { label: lbl, input: input };
    }

    updateABMFormFields(itemNameCol) {
        const selectedType = this.itemTypeSelect.value;
        const itemSelectCol = this.itemSelect.closest('.w3-half');
        
        this.itemSelect.innerHTML = '<option value="" disabled selected>Seleccione un ítem</option>';
        this.itemSelect.disabled = false;
        itemNameCol.style.display = 'none'; 
        itemSelectCol.style.display = 'block'; 

        if (selectedType === 'material') {
            this.itemSelect.innerHTML += this.allMaterials.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        } else if (selectedType === 'pre_mix') {
            this.itemSelect.innerHTML += this.allPremixes.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        } else if (selectedType.startsWith('new_')) {
            this.itemSelect.innerHTML = '<option value="" disabled selected>Se creará un nuevo ítem</option>';
            this.itemSelect.disabled = true;
            itemSelectCol.style.display = 'none'; 
            itemNameCol.style.display = 'block'; 
        } else {
            this.itemSelect.innerHTML = '<option value="" disabled selected>Seleccione un tipo primero</option>';
            this.itemSelect.disabled = true;
        }
    }

    async createPrice() {
        const selectedType = this.itemTypeSelect.value;
        const priceValue = parseFloat(this.priceInput.value);
        const unit = this.unitSelect.value;
        const supplierId = this.currentUser.id;

        if (isNaN(priceValue) || !unit || priceValue <= 0) {
            alert("El precio debe ser un número positivo y la unidad es requerida.");
            return;
        }
        
        if (selectedType.startsWith('new_')) {
            const itemName = this.itemNameInput.value.trim();
            if (!itemName) {
                alert("El nombre del nuevo ítem es requerido.");
                return;
            }

            try {
                const newItemType = selectedType === 'new_material' ? 'material' : 'pre_mix';
                const resItem = await fetch(`http://127.0.0.1:5000/api/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: newItemType, name: itemName })
                });
                const dataItem = await resItem.json();
                if (!resItem.ok) throw new Error(dataItem.message);
                
                alert(`Nuevo ítem (${dataItem.name}) creado. Agregando precio...`);
                
                this.itemNameInput.value = '';
                await this.loadAllItems();
                this.finalizePriceCreation(newItemType, dataItem.id, supplierId, priceValue, unit);

            } catch (error) {
                alert(`Error al crear el nuevo ítem: ${error.message}`);
            }

        } else if (selectedType === 'material' || selectedType === 'pre_mix') {
            const itemId = parseInt(this.itemSelect.value);
            if (!itemId) {
                alert("Por favor, seleccione un ítem existente.");
                return;
            }
            this.finalizePriceCreation(selectedType, itemId, supplierId, priceValue, unit);

        } else {
            alert("Seleccione un tipo de ítem válido.");
        }
    }

    async finalizePriceCreation(itemType, itemId, supplierId, priceValue, unit) {
        const body = {
            user_id: supplierId,
            price: priceValue,
            unit: unit,
            material_id: itemType === 'material' ? itemId : null,
            pre_mix_id: itemType === 'pre_mix' ? itemId : null,
        };
        
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/prices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message);
            
            alert(`Precio creado correctamente.`);
            
            this.priceInput.value = '';
            this.unitSelect.value = '';
            this.itemTypeSelect.value = ''; 
            this.updateABMFormFields(this.contentDiv.querySelector('#item-name-col'));
            this.loadSupplierPrices();
            
        } catch (error) {
            alert(`Error al crear el precio: ${error.message}`);
        }
    }

    handleUpdatePrice(priceObj) {
        const newPriceStr = prompt(`Nuevo precio para ${priceObj.item_name} (actual: $${priceObj.price}):`, priceObj.price);
        if (newPriceStr === null) return;
        const newPrice = parseFloat(newPriceStr);
        
        const newUnit = prompt(`Nueva unidad para ${priceObj.item_name} (actual: ${priceObj.unit}):`, priceObj.unit);
        if (newUnit === null) return;
        
        if (isNaN(newPrice) || newPrice <= 0 || newUnit.trim() === "") {
            alert("El precio debe ser un número positivo y la unidad no puede estar vacía.");
            return;
        }
        
        this.sendUpdatePrice(priceObj.id, priceObj.type, newPrice, newUnit);
    }
    
    async sendUpdatePrice(priceId, itemType, newPrice, newUnit) {
        try {
            const res = await fetch(`http://127.0.0.1:5000/api/prices/${priceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.currentUser.id, 
                    price: newPrice,
                    unit: newUnit,
                    type: itemType 
                })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message);
            
            alert(`Precio actualizado correctamente.`);
            this.loadSupplierPrices(); 
            
        } catch (error) {
            alert(`Error al actualizar el precio: ${error.message}`);
        }
    }

    async deletePrice(priceObj) {
        if (!confirm(`¿Seguro que desea eliminar el precio de ${priceObj.item_name}?`)) return;

        try {
            const res = await fetch(`http://127.0.0.1:5000/api/prices/${priceObj.id}`, { 
                method: "DELETE",
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            alert("Precio eliminado correctamente.");
            this.loadSupplierPrices();
        } catch (err) {
            alert(`Error eliminando precio: ${err.message || err}.`);
        }
    }
}

customElements.define("wc-materiales", WCMateriales);