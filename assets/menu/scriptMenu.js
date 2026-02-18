const hamburguerMenu = document.getElementById("hamburguerMenu");
const navMenu = document.getElementById("navMenu");

hamburguerMenu.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});