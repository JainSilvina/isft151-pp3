document.addEventListener("login-success", () => {
  document.querySelector("login-component").style.display = "none";
  document.querySelector("formulario-component").style.display = "block";
});
