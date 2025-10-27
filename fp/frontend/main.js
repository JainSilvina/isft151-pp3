import { WCLogin } from './WCLogin.js';
import { WCRegister } from './WCRegister.js';
import { WCUserForm } from './WCUserForm.js';
import { WCCotizador } from './WCCotizador.js';
import { WCMateriales } from './WCMateriales.js'; 

function main() {
  let comp = new WCLogin();
  document.body.appendChild(comp);
}

window.onload = main;