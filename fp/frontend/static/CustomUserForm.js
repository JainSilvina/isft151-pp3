import { CustomLogin } from './CustomLogin.js';

export class CustomUserForm extends HTMLElement {
  constructor() {
    super();
    this.classList.add('w3-container', 'w3-margin-top');


    let header = document.createElement('header');
    header.classList.add('w3-container', 'w3-green');
    let h1 = document.createElement('h1');
    h1.textContent = 'Gestión de Usuarios (ABM)';
    header.appendChild(h1);
    this.appendChild(header);

    let content = document.createElement('div');
    content.classList.add('w3-panel', 'w3-light-grey', 'w3-padding-16');
    
    let p = document.createElement('p');
    p.textContent = '¡Login exitoso! Esta es la vista protegida para realizar el ABM.';
    content.appendChild(p);

    this.userListDiv = document.createElement('div');
    this.userListDiv.id = 'user-list';
    content.appendChild(this.userListDiv);

    this.loadBtn = document.createElement('button');
    this.loadBtn.innerText = 'Cargar Lista de Usuarios';
    this.loadBtn.classList.add('w3-button', 'w3-blue', 'w3-section');
    content.appendChild(this.loadBtn);

 
    this.logoutBtn = document.createElement('button');
    this.logoutBtn.innerText = 'Logout';
    this.logoutBtn.classList.add('w3-button', 'w3-red', 'w3-section', 'w3-margin-left');
    this.logoutBtn.onclick = () => {
        document.body.innerHTML = '';
        let loginComp = new CustomLogin();
        document.body.appendChild(loginComp);
    };
    content.appendChild(this.logoutBtn);
    
    this.appendChild(content);
  }

  connectedCallback() {
    this.loadBtn.onclick = this.loadUsers.bind(this);
  }
  
  loadUsers = async () => {
    try {
      let response = await fetch('http://localhost:5000/api/users', {
        method: 'GET'
      });
      let users = await response.json();
      
      this.renderUserList(users);
      
    } catch (error) {
      this.userListDiv.innerHTML = '<p class="w3-text-red">Error al cargar usuarios. Asegúrate que el backend de Flask esté corriendo.</p>';
    }
  }

  renderUserList(users) {
    this.userListDiv.innerHTML = ''; 
    let title = document.createElement('h4');
    title.textContent = "Usuarios Registrados:";
    this.userListDiv.appendChild(title);

    if (users.length === 0) {
        let p = document.createElement('p');
        p.textContent = "No hay usuarios registrados.";
        this.userListDiv.appendChild(p);
        return;
    }

    let ul = document.createElement('ul');
    ul.classList.add("w3-ul", "w3-card-4");

    users.forEach(user => {
        let li = document.createElement('li');
        li.textContent = user;

        let btn = document.createElement('button');
        btn.classList.add('w3-button', 'w3-red', 'w3-tiny', 'w3-right');
        btn.textContent = "❌ Borrar";
        btn.addEventListener('click', () => this.deleteUser(user));

        li.appendChild(btn);
        ul.appendChild(li);
    });

    this.userListDiv.appendChild(ul);
  }
  
  deleteUser = async (name) => {
    if (!confirm(`¿Desea borrar al usuario: ${name}?`)) {
        return;
    }
    
    try {
        let response = await fetch(`http://localhost:5000/api/users/${name}`, {
            method: 'DELETE',
        });
        let result = await response.json();
        
        if (response.ok) {
            alert(`Usuario ${name} borrado: ${result.message}`);
            this.loadUsers(); 
        } else {
            alert(`Error al borrar: ${result.message}`);
        }
    } catch (error) {
        alert("Error de conexión al intentar borrar usuario.");
    }
  }
}

customElements.define('x-form', CustomUserForm);