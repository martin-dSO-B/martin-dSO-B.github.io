async function cargarPuntosVuforia() {
    let listaPuntos = [];

    const myHeaders = new Headers();
    myHeaders.append("Access", accessKey);
    myHeaders.append("Secret", secretKey);

    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    fetch("https://vuforia-chrono.msob523.workers.dev/", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            listaPuntos = result.targets;
            console.log("Lista dentro del .then():", listaPuntos);
            for (let i = 0; i < listaPuntos.length; i++) {
                let punto = listaPuntos[i];
                console.log("Procesando punto:", punto);
        
                punto.replace("_", ".");
                let longitud = "";
                let latitud = "";
                let nombre = "";
                let parte = 0;
                for(let j = 0; j < punto.length; j++) {
                    if (parte == 0) {
                        if (j > 0 && punto[j] == "-") {
                            parte++;
                        } else {
                            longitud += punto[j];
                        }
                    } else if (parte == 1) {
                        if (punto[j] == "-") {
                            parte++;
                        } else {
                            latitud += punto[j];
                        }
                    } else if (parte == 2) {
                        nombre += punto[j];
                    }
                }
        
                console.log("Longitud:", longitud, "Latitud:", latitud, "Nombre:", nombre);
            }
            return listaPuntos;
        })
        .catch((error) => {
            console.error(error);
        });

}

const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
// Get the value of "some_key" in eg "https://example.com/?some_key=some_value"
const api_key = params.some_key; // "some_value"
const accessKey = params.accessKey;
const secretKey = params.secretKey;

function cargarMapa() {
    if (!api_key) {
        alert("Falta la API Key en la URL");
        return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${api_key}&callback=iniciarMapa&libraries=marker`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
}

// Llamar a la función para cargar la API de Google Maps
let infoWindow;

cargarMapa();
//const { AdvancedMarkerElement, PinElement } = new google.maps.importLibrary("marker");

function iniciarMapa() {
    const coordenadas = { lat: 43.4751, lng: -3.8078 };
    const mapa = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: coordenadas,
        mapId: "DEMO_MAP_ID"
    });

    new google.maps.Marker({
        position: coordenadas,
        map: mapa,
        title: "Ubicación de ejemplo",
    });

    cargarPuntosVuforia();

    /*cargarPuntosVuforia().then((listaPuntos) => {
        console.log(listaPuntos);
        for (let i = 0; i < listaPuntos.length; i++) {
            let punto = listaPuntos[i];
            console.log("Procesando punto:", punto);

            let partes = punto.split("-");

            if (partes.length < 3) {
                console.warn("Formato incorrecto en punto:", punto);
                continue;
            }

            // Manejo de longitud y latitud
            let longitud = partes[0].replace(/\./g, "_");
            let latitud = partes[1].replace(/\./g, "_");

            // Si hay "--", significa que la latitud es negativa
            if (punto.includes("--")) {
                latitud = "-" + latitud.replace("_", ""); // Elimina el primer "_"
            }

            // El nombre está después de la latitud
            let nombre = partes.slice(2).join("-");

            // Insertar espacio antes de letras mayúsculas, excepto la primera
            nombre = nombre.replace(/([a-z])([A-Z])/g, "$1 $2");

            console.log("Longitud:", longitud, "Latitud:", latitud, "Nombre:", nombre);
        }
    });*/

    // Ejemplo: Añadir más puntos de interés
    agregarPuntoDeInteres(mapa, 43.472511, -3.781207, "Playa del Sardinero");
    agregarPuntoDeInteres(mapa, 43.469433, -3.766479, "Palacio de la Magdalena");
    agregarPuntoDeInteres(mapa, 43.476249, -3.793371, "Casino de Santander");

    // Botón para buscar ubicación actual
    const locationButton = document.createElement("button");
    locationButton.textContent = "Mi ubicación";
    locationButton.classList.add("btn-location");
    mapa.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);

    locationButton.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    mapa.setCenter(userLocation);
                    new google.maps.Marker({
                        position: userLocation,
                        map: mapa,
                        title: "Tu ubicación",
                        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                    });
                },
                (error) => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            alert("Permiso denegado para acceder a la ubicación.");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            alert("Información de ubicación no disponible.");
                            break;
                        case error.TIMEOUT:
                            alert("La solicitud de ubicación ha expirado.");
                            break;
                        case error.UNKNOWN_ERROR:
                        default:
                            alert("Error desconocido al obtener la ubicación.");
                            break;
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            alert("Geolocalización no soportada en este navegador.");
        }
    });
}

// Función para agregar puntos de interés
function agregarPuntoDeInteres(mapa, lat, lng, titulo) {
    const marcador = new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map: mapa,
        title: titulo,
    });

    // Evento click para mostrar InfoWindow
    marcador.addListener("gmp-click", () => { // Cambiado de 'click' a 'gmp-click'
        if (!infoWindow) {
            infoWindow = new google.maps.InfoWindow();
        }

        infoWindow.close();
        infoWindow.setContent(`<h3>${titulo}</h3><p>Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>`);
        infoWindow.open(mapa, marcador);
    });
}




