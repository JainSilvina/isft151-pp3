import { CustomLogin } from './CustomLogin.js';
import { CustomUserForm } from './CustomUserForm.js'; 
import { CustomCotizador } from './CustomCotizador.js'; 

function main() {
  // Al cargar la página mostramos el login
  let comp = new CustomLogin();
  document.body.appendChild(comp);
}

window.onload = main;