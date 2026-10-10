let peliculas = [];
let favoritos = [];
let filtroActual = "todas";
let ordenActual = "recientes";
let busquedaActual = "";

const grid = document.getElementById("grid-peliculas");
const buscador = document.getElementById("buscador");
const btnBuscar = document.getElementById("btn-buscar");
const filtroTodas = document.getElementById("filtro-todas");
const filtroFavoritas = document.getElementById("filtro-favoritas");
const selectOrden = document.getElementById("orden");
const contadorResultados = document.getElementById("contador-resultados");
const numFavoritos = document.getElementById("num-favoritos");
const mensajeVacio = document.getElementById("mensaje-vacio");

const CLAVE_FAVORITOS = "cineapp-favoritos";

function cargarFavoritos() {
  const guardados = localStorage.getItem(CLAVE_FAVORITOS);
  favoritos = guardados ? JSON.parse(guardados) : [];
}

function guardarFavoritos() {
  localStorage.setItem(CLAVE_FAVORITOS, JSON.stringify(favoritos));
}

function esFavorito(id) {
  return favoritos.includes(id);
}

function toggleFavorito(id) {
  if (esFavorito(id)) {
    favoritos = favoritos.filter((fav) => fav !== id);
  } else {
    favoritos.push(id);
  }
  guardarFavoritos();
  actualizarContadorFavoritos();
}

function actualizarContadorFavoritos() {
  numFavoritos.textContent = favoritos.length;
}

async function cargarPeliculas() {
  try {
    const respuesta = await fetch("data/peliculas.json");

    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }

    peliculas = await respuesta.json();
    renderizar();
  } catch (error) {
    console.error("Error al cargar películas:", error);
    grid.innerHTML = `
            <p class="mensaje-vacio">
                No se pudieron cargar las películas. Intenta recargar la página.
            </p>
        `;
  }
}

function obtenerPeliculasFiltradas() {
  let resultado = [...peliculas];

  if (filtroActual === "favoritas") {
    resultado = resultado.filter((p) => esFavorito(p.id));
  }

  if (busquedaActual.trim() !== "") {
    const busqueda = busquedaActual.toLowerCase().trim();
    resultado = resultado.filter((p) =>
      p.title.toLowerCase().includes(busqueda),
    );
  }

  resultado.sort((a, b) => {
    switch (ordenActual) {
      case "recientes":
        return b.year - a.year;
      case "antiguas":
        return a.year - b.year;
      case "alfabetico":
        return a.title.localeCompare(b.title);
      case "alfabetico-desc":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return resultado;
}

function crearTarjeta(pelicula) {
  const esFav = esFavorito(pelicula.id);

  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";
  tarjeta.dataset.id = pelicula.id;

  tarjeta.innerHTML = `
        <img src="${pelicula.image}" 
             alt="${pelicula.title}" 
             class="tarjeta__imagen"
             loading="lazy">
        <button class="tarjeta__favorito ${esFav ? "tarjeta__favorito--activo" : ""}"
                data-id="${pelicula.id}"
                aria-label="${esFav ? "Quitar de favoritos" : "Añadir a favoritos"}">
            ★
        </button>
        <div class="tarjeta__info">
            <h3 class="tarjeta__titulo">${pelicula.title}</h3>
            <p class="tarjeta__meta">${pelicula.year}</p>
            <span class="tarjeta__genero">${pelicula.genre}</span>
            
            <button class="tarjeta__toggle-sinopsis" 
                    data-id="${pelicula.id}"
                    aria-expanded="false"
                    aria-controls="sinopsis-${pelicula.id}">
                <span class="tarjeta__flecha">▼</span> Sinopsis
            </button>
            
            <p class="tarjeta__sinopsis" 
               id="sinopsis-${pelicula.id}" 
               hidden>
                ${pelicula.synopsis}
            </p>
            
            <button class="tarjeta__boton ${esFav ? "tarjeta__boton--activo" : ""}"
                    data-id="${pelicula.id}">
                ${esFav ? "★ En favoritos" : "☆ Agregar a favoritos"}
            </button>
        </div>
    `;

  return tarjeta;
}

function renderizar() {
  const lista = obtenerPeliculasFiltradas();

  contadorResultados.textContent = `${lista.length} película${lista.length !== 1 ? "s" : ""} encontrada${lista.length !== 1 ? "s" : ""}`;

  if (lista.length === 0) {
    grid.innerHTML = "";
    mensajeVacio.hidden = false;
    return;
  }

  mensajeVacio.hidden = true;

  const fragmento = document.createDocumentFragment();
  lista.forEach((pelicula) => {
    fragmento.appendChild(crearTarjeta(pelicula));
  });

  grid.innerHTML = "";
  grid.appendChild(fragmento);
}

let timeoutBusqueda;
buscador.addEventListener("input", (e) => {
  busquedaActual = e.target.value;
  clearTimeout(timeoutBusqueda);
  timeoutBusqueda = setTimeout(renderizar, 300);
});

btnBuscar.addEventListener("click", () => {
  busquedaActual = buscador.value;
  renderizar();
});

buscador.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    busquedaActual = buscador.value;
    renderizar();
  }
});

filtroTodas.addEventListener("click", () => {
  filtroActual = "todas";
  filtroTodas.classList.add("filtro--activo");
  filtroFavoritas.classList.remove("filtro--activo");
  renderizar();
});

filtroFavoritas.addEventListener("click", () => {
  filtroActual = "favoritas";
  filtroFavoritas.classList.add("filtro--activo");
  filtroTodas.classList.remove("filtro--activo");
  renderizar();
});

selectOrden.addEventListener("change", (e) => {
  ordenActual = e.target.value;
  renderizar();
});

grid.addEventListener('click', (e) => {
    const botonFav = e.target.closest('.tarjeta__favorito, .tarjeta__boton');
    if (botonFav) {
        const id = Number(botonFav.dataset.id);
        toggleFavorito(id);
        renderizar();
        return;
    }

    const botonSinopsis = e.target.closest('.tarjeta__toggle-sinopsis');
    if (botonSinopsis) {
        const id = botonSinopsis.dataset.id;
        const sinopsis = document.getElementById(`sinopsis-${id}`);
        
        const estaAbierta = !sinopsis.hidden;
        
        if (estaAbierta) {
            sinopsis.hidden = true;
            botonSinopsis.setAttribute('aria-expanded', 'false');
        } else {
            sinopsis.hidden = false;
            botonSinopsis.setAttribute('aria-expanded', 'true');
        }
        return;
    }
});

function iniciar() {
  cargarFavoritos();
  actualizarContadorFavoritos();
  cargarPeliculas();
}

iniciar();
