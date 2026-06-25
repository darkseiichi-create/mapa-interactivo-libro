// ==========================================
// 1. CONFIGURACIÓN DEL MAPA Y COORDENADAS
// ==========================================
const mapWidth = 6201;   
const mapHeight = 4429;  
const maxZoomLevel = 4;  

const factor = 1 / Math.pow(2, maxZoomLevel);
const customCRS = L.extend({}, L.CRS.Simple, {
    transformation: new L.Transformation(factor, 0, factor, 0)
});

const map = L.map('map', {
    crs: customCRS,
    minZoom: 0,
    maxZoom: maxZoomLevel
});

const margen = 10;
const limitesMapa = [[-margen, -margen], [2220 + margen, 3100 + margen]];
map.setMaxBounds(limitesMapa);
map.fitBounds([[0, 0], [2220, 3100]], { padding: [50, 50] });
map.setMinZoom(0);

L.tileLayer('assets/tiles/{z}/{y}-{x}.png', {
    minZoom: 0,
    maxZoom: maxZoomLevel,
    noWrap: true
}).addTo(map);


// ==========================================
// 2. SISTEMA DE CAPAS Y GRUPOS (FACCIONES)
// ==========================================
const capaCiudades = L.layerGroup().addTo(map);
const capaHitos = L.layerGroup().addTo(map);

const grupoRegionesMounthaven = L.layerGroup();
const grupoRegionesFeudom = L.layerGroup();
const grupoRegionesalianza = L.layerGroup();
const grupoRegioneshegemonia = L.layerGroup();
const grupoRegionesvastagos = L.layerGroup();
const grupoRegionestribus = L.layerGroup();
const grupoRegionessyennan = L.layerGroup();

const diccionarioCapas = {
    "ciudad": capaCiudades,
    "hitos": capaHitos
};

const carpetasPorFaccion = {
    "Mounthaven": grupoRegionesMounthaven,
    "Feudom": grupoRegionesFeudom,
    "Alianza": grupoRegionesalianza,
    "Hegemonia": grupoRegioneshegemonia,
    "Vastagos": grupoRegionesvastagos,
    "Tribus": grupoRegionestribus,
    "Syennan": grupoRegionessyennan
};


// ==========================================
// 3. SISTEMA DE DICCIONARIO DE ICONOS
// ==========================================
const crearIcono = (url) => L.icon({
    iconUrl: url, 
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

const diccionarioIconos = {
    "ciudad": crearIcono('assets/icons/ciudad-neutral.png'),
    "hitos": crearIcono('assets/icons/hitos.png')
};

const diccionarioFacciones = {
    "Mounthaven": crearIcono('assets/icons/ciudad-mounthaven.png'),
    "Feudom": crearIcono('assets/icons/ciudad-feudom.png'),
    "Alianza": crearIcono('assets/icons/ciudad-alianza.png'),
    "Hegemonia": crearIcono('assets/icons/ciudad-hegemonia.png'),
    "Vastagos": crearIcono('assets/icons/ciudad-vastagos.png'),
    "Syennan": crearIcono('assets/icons/ciudad-syennan.png'),
    "Tribus": crearIcono('assets/icons/ciudad-tribus.png')
};


// ==========================================
// 4. CARGA DE DATOS (JSON)
// ==========================================

// 4.1 Cargar Ubicaciones (Marcadores)
fetch('data/ubicaciones.json')
    .then(respuesta => respuesta.json())
    .then(datos => {
        datos.forEach(lugar => {
            const capaElegida = diccionarioCapas[lugar.tipo];
            const iconoElegido = diccionarioFacciones[lugar.faccion] || diccionarioIconos[lugar.tipo];
            
            if (iconoElegido && capaElegida) {
                const marcador = L.marker(lugar.coordenadas, { icon: iconoElegido }).addTo(capaElegida);
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

// 4.2 Cargar Regiones (Imágenes Overlay) - 
fetch('data/regiones.json')
    .then(r => r.json())
    .then(datos => {
        console.log("Regiones cargadas:", datos); 
        datos.forEach(region => {
            const imgLayer = L.imageOverlay(region.imagen, [[0, 0], [2220, 3100]], { interactive: false, opacity: 0.8 });
            carpetasPorFaccion[region.faccion].addLayer(imgLayer);
            imgLayer.bringToBack(); 
            
            const contenedor = document.getElementById(`lista-regiones-${region.faccion.toLowerCase()}`);
            
            if (contenedor) {
                const btnImg = document.createElement('img');
                btnImg.src = region.icono;
                btnImg.className = 'btn-region-img apagado'; 
                btnImg.title = region.nombre;
                btnImg.capaLeaflet = imgLayer;
                
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
            } else {
                console.error("No se encontró el contenedor: lista-regiones-" + region.faccion.toLowerCase());
            }
        });
    })
    .catch(err => console.error("Error crítico en regiones.json:", err));


// ==========================================
// 5. INTERFAZ Y EVENTOS DE USUARIO
// ==========================================

// 5.1 Menú Lateral
const botonMenu = document.getElementById('boton-menu');
const menuLateral = document.getElementById('menu-lateral');

botonMenu.addEventListener('click', () => {
    menuLateral.classList.toggle('abierto');
});

// 5.2 Filtros de Ciudades e Hitos
document.getElementById('filtro-ciudades').addEventListener('change', function() {
    this.checked ? map.addLayer(capaCiudades) : map.removeLayer(capaCiudades);
});

document.getElementById('filtro-hitos').addEventListener('change', function() {
    this.checked ? map.addLayer(capaHitos) : map.removeLayer(capaHitos);
});

// 5.3 Acordeones de Facción
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

    if (botonToggle && lista) {
        botonToggle.addEventListener('click', () => {
            lista.classList.toggle('activa');
            botonToggle.style.transform = lista.classList.contains('activa') ? 'scale(1.03)' : 'scale(1)';
        });
    }
});

// 5.4 Botones Maestros (Activar/Desactivar todo el grupo)
const nombresFacciones = ['hegemonia', 'tribus', 'vastagos', 'syennan', 'mounthaven', 'feudom', 'alianza'];

nombresFacciones.forEach(faccion => {
    const btnGlobal = document.getElementById(`global-${faccion}`);
    
    if (btnGlobal) {
        btnGlobal.addEventListener('click', () => {
            const estaApagado = btnGlobal.classList.contains('apagado');
            
            if (estaApagado) {
                btnGlobal.classList.remove('apagado'); 
            } else {
                btnGlobal.classList.add('apagado');    
            }

            const contenedorLista = document.getElementById(`lista-regiones-${faccion}`);
            
            if (contenedorLista) {
                const botonesRegion = contenedorLista.querySelectorAll('.btn-region-img');
                
                botonesRegion.forEach(btnRegion => {
                    const layerMapa = btnRegion.capaLeaflet; 
                    
                    if (layerMapa) {
                        if (!estaApagado) {
                            map.removeLayer(layerMapa);
                            btnRegion.classList.add('apagado');
                        } else {
                            map.addLayer(layerMapa);
                            btnRegion.classList.remove('apagado');
                        }
                    }
                });
            }
        });
    }
});


// ==========================================
// 6. HERRAMIENTAS DE DESARROLLO
// ==========================================
// Clic para obtener coordenadas
map.on('click', function(e) {
    let y = Math.round(e.latlng.lat); 
    let x = Math.round(e.latlng.lng); 
    console.log(`"coordenadas": [${y}, ${x}]`);
    alert(`Coordenadas de este punto: [${y}, ${x}]`);
});

// ==========================================
// 7. DESPLEGABLE MAESTRO DE FACCIONES
// ==========================================
const tituloFacciones = document.getElementById('titulo-facciones');
const contenedorFacciones = document.getElementById('contenedor-facciones');

if (tituloFacciones && contenedorFacciones) {
    tituloFacciones.addEventListener('click', () => {
        contenedorFacciones.classList.toggle('activa');
        
        if (contenedorFacciones.classList.contains('activa')) {
            tituloFacciones.innerText = 'Regiones ▼';
        } else {
            tituloFacciones.innerText = 'Regiones ►';
        }
    });
} else {
    // Si sale esto en la consola, es que el HTML y el JS no se están comunicando
    console.error("Fallo: No se encontraron los IDs titulo-facciones o contenedor-facciones");
}