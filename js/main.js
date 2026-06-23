// 1. Configuraciones principales
const mapWidth = 6201;   // Ancho de la imagen original en píxeles
const mapHeight = 4429;  // Alto de la imagen original en píxeles
const maxZoomLevel = 4;  // El nivel de zoom máximo que generaste

// 2. Sistema de coordenadas personalizado
const factor = 1 / Math.pow(2, maxZoomLevel);
const customCRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(factor, 0, factor, 0)
});

// 3. Inicializamos el mapa
const map = L.map('map', {
    crs: customCRS,
    minZoom: 0,
    maxZoom: maxZoomLevel
});



// Añadimos un margen de 100 píxeles por cada lado
const margen = 10;

// Definimos los límites: desde coordenadas negativas hasta el tamaño real + el margen
const limitesMapa = [[-margen, -margen], [2220 + margen, 3100 + margen]];

// Aplicamos el anclaje con este margen extra
map.setMaxBounds(limitesMapa);

// Ajustamos la vista inicial para que se vea el mapa centrado con un poco de marco
map.fitBounds([[0, 0], [2220, 3100]], { padding: [50, 50] });



// Obligamos al mapa a que no pueda hacer zoom hacia afuera (alejar) más de lo necesario
map.setMinZoom(0);
const bounds = [[0, 0], [mapHeight, mapWidth]];

// 4. Cargamos los tiles
L.tileLayer('assets/tiles/{z}/{y}-{x}.png', {
    minZoom: 0,
    maxZoom: maxZoomLevel,
    noWrap: true
}).addTo(map);

map.fitBounds(bounds);


// --- SISTEMA DE ICONOS --
// Iconos base/genéricos
const iconoCiudad = L.icon({
    iconUrl: 'assets/icons/icono-ciudad.png', 
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// ¡CORREGIDO! Ahora la variable se llama iconoHitos
const iconoHitos = L.icon({
    iconUrl: 'assets/icons/hitos.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const diccionarioIconos = {
    "ciudad": iconoCiudad,
    "hitos": iconoHitos
};

// Iconos específicos de facción
const iconoCiudadMounthaven = L.icon({
    iconUrl: 'assets/icons/ciudad-mounthaven.png', 
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const iconoCiudadfeudom = L.icon({
    iconUrl: 'assets/icons/ciudad-feudom.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const diccionarioFacciones = {
    "Mounthaven": iconoCiudadMounthaven,
    "Feudom": iconoCiudadfeudom
};


// --- SISTEMA DE CAPAS (Para los filtros) ---
const capaCiudades = L.layerGroup().addTo(map);
const capaHitos = L.layerGroup().addTo(map);

const diccionarioCapas = {
    "ciudad": capaCiudades,
    "hitos": capaHitos
};


// --- CARGA DE UBICACIONES (Ciudades, Hitos y sus Popups personalizados) ---
fetch('data/ubicaciones.json')
    .then(respuesta => respuesta.json())
    .then(datos => {
        datos.forEach(lugar => {
            
            const capaElegida = diccionarioCapas[lugar.tipo];
            const iconoElegido = diccionarioFacciones[lugar.faccion] || diccionarioIconos[lugar.tipo];
            
            if (iconoElegido && capaElegida) {
                const marcador = L.marker(lugar.coordenadas, { icon: iconoElegido }).addTo(capaElegida);
                
                // Aplicamos el estilo visual CSS de la facción a la ventana
                const claseFaccion = lugar.faccion ? `popup-${lugar.faccion.toLowerCase()}` : 'popup-neutral';
                
                marcador.bindPopup(`
                    <div class="contenido-popup">
                        <h3>${lugar.nombre}</h3>
                        <p>${lugar.descripcion}</p>
                    </div>
                `, { className: claseFaccion });
            }
        });
    })
    .catch(error => console.error("Error al cargar las ubicaciones:", error));

// --- SISTEMA DE CAPAS DINÁMICO ---
const grupoRegionesMounthaven = L.layerGroup().addTo(map);
const grupoRegionesFeudom = L.layerGroup().addTo(map);
const grupoRegionesalianza = L.layerGroup().addTo(map);
const grupoRegioneshegemonia = L.layerGroup().addTo(map);
const grupoRegionesvastagos = L.layerGroup().addTo(map);
const grupoRegionestribus = L.layerGroup().addTo(map);
const grupoRegionessyennan = L.layerGroup().addTo(map);

// Mapeo para saber dónde meter cada cosa
const carpetasPorFaccion = {
    "Mounthaven": grupoRegionesMounthaven,
    "Feudom": grupoRegionesFeudom,
"Alianza": grupoRegionesalianza,
"Hegemonia": grupoRegioneshegemonia,
"Vastagos": grupoRegionesvastagos,
"Tribus": grupoRegionestribus,
"Syennan": grupoRegionessyennan

};

// --- CARGA AUTOMÁTICA DESDE JSON ---
fetch('data/regiones.json')
    .then(r => r.json())
    .then(datos => {
        console.log("Regiones cargadas:", datos); // Si esto sale en F12, el JSON está bien
        datos.forEach(region => {
            const imgLayer = L.imageOverlay(region.imagen, [[0, 0], [2220, 3100]], { interactive: false, opacity: 0.8 });
            carpetasPorFaccion[region.faccion].addLayer(imgLayer);
            imgLayer.bringToBack(); 
            
            // BUSCAMOS EL CONTENEDOR
            const contenedor = document.getElementById(`lista-regiones-${region.faccion.toLowerCase()}`);
            
            if (contenedor) {
                const btnImg = document.createElement('img');
                btnImg.src = region.icono;
                btnImg.className = 'btn-region-img';
                btnImg.title = region.nombre;
                
                btnImg.onclick = () => {
                    if (map.hasLayer(imgLayer)) {
                        map.removeLayer(imgLayer);
                        btnImg.classList.add('apagado');
                    } else {
                        map.addLayer(imgLayer);
                        btnImg.classList.remove('apagado');
                    }
                };
                contenedor.appendChild(btnImg);
                console.log("Botón creado para:", region.nombre);
            } else {
                console.error("No se encontró el contenedor: lista-regiones-" + region.faccion.toLowerCase());
            }
        });
    })
    .catch(err => console.error("Error crítico en regiones.json:", err));

// Forzamos que el mapa sepa qué capas están activas desde el segundo 1
const todosLosGrupos = [
    grupoRegionesMounthaven, grupoRegionesFeudom, grupoRegionesalianza, 
    grupoRegioneshegemonia, grupoRegionesvastagos, grupoRegionestribus, grupoRegionessyennan
];

todosLosGrupos.forEach(grupo => map.addLayer(grupo));

// --- LÓGICA DE LA INTERFAZ (Botones y Checkboxes) ---
const botonMenu = document.getElementById('boton-menu');
const menuLateral = document.getElementById('menu-lateral');

botonMenu.addEventListener('click', () => {
    menuLateral.classList.toggle('abierto');
});

// Botones de ubicaciones
document.getElementById('filtro-ciudades').addEventListener('change', function() {
    if (this.checked) {
        map.addLayer(capaCiudades);
    } else {
        map.removeLayer(capaCiudades);
    }
});

// ¡CORREGIDO! Ahora busca el botón de hitos y maneja la capaHitos
document.getElementById('filtro-hitos').addEventListener('change', function() {
    if (this.checked) {
        map.addLayer(capaHitos);
    } else {
        map.removeLayer(capaHitos);
    }
});



// --- HERRAMIENTA TEMPORAL PARA SACAR COORDENADAS ---
map.on('click', function(e) {
    let y = Math.round(e.latlng.lat); 
    let x = Math.round(e.latlng.lng); 
    console.log(`"coordenadas": [${y}, ${x}]`);
    
    // ESTA ES LA LÍNEA QUE FALTABA: Hace que salte el aviso en la pantalla
    alert(`Coordenadas de este punto: [${y}, ${x}]`);
});


// Configuración de los toggles
const configuracionFacciones = [
    { id: 'toggle-mounthaven', listaId: 'lista-regiones-mounthaven' },
    { id: 'toggle-feudom', listaId: 'lista-regiones-feudom' },
    { id: 'toggle-alianza', listaId: 'lista-regiones-alianza' },
    { id: 'toggle-hegemonia', listaId: 'lista-regiones-hegemonia' },
    { id: 'toggle-tribus', listaId: 'lista-regiones-tribus' },
    { id: 'toggle-vastagos', listaId: 'lista-regiones-vastagos' },
    { id: 'toggle-syennan', listaId: 'lista-regiones-syennan' }
];

configuracionFacciones.forEach(fac => {
    const botonToggle = document.getElementById(fac.id);
    const lista = document.getElementById(fac.listaId);

    botonToggle.addEventListener('click', () => {
        // Toggle de la clase activa
        lista.classList.toggle('activa');
        
        // Opcional: efecto de giro al banner al abrirse
        botonToggle.style.transform = lista.classList.contains('activa') ? 'scale(1.03)' : 'scale(1)';
    });
});