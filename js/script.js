let mapa;
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
                let punto = listaPuntos[i].replaceAll("_", ".");
                console.log("Procesando punto:", punto);
        
                let longitud = "";
                let latitud = "";
                let nombre = "";
                let imagen = "";
                let parte = 0;
                for(let j = 0; j < punto.length; j++) {
                    if (parte == 0) {
                        if (j > 0 && punto[j] == "-") {
                            parte++;
                        } else {
                            longitud += punto[j];
                        }
                    } else if (parte == 1) {
                        if (punto[j] == "-" && punto[j-1] != "-") {
                            parte++;
                        } else {
                            latitud += punto[j];
                        }
                    } else if (parte == 2) {
                        if (punto[j] == "-") {
                            parte++
                        } else {
                            nombre += punto[j];
                        }
                    } else if (parte == 3) {
                        imagen += punto[j];
                    }
                }
                agregarPuntoDeInteres(mapa, parseFloat(longitud), parseFloat(latitud), nombre, imagen);
                //console.log("Longitud:", longitud, "Latitud:", latitud, "Nombre:", nombre);
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
    mapa = new google.maps.Map(document.getElementById("map"), {
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

function agregarPuntoDeInteres(mapa, lat, lng, titulo, imagen) {
    const marcador = new google.maps.marker.AdvancedMarkerElement({
        position: { lat, lng },
        map: mapa,
        title: titulo,
    });

    marcador.addListener("gmp-click", () => {
        if (!infoWindow) {
            infoWindow = new google.maps.InfoWindow();
        }

        const imgurID = imagen.replace(/\.(jpg|jpeg|png|gif)$/i, '');

        const embedHtml = `
            <div style="text-align: center;">
                <h3>${titulo}</h3>
                <blockquote class="imgur-embed-pub" lang="en" data-id="${imgurID}" data-context="false">
                    <a href="https://imgur.com/${imgurID}">Ver en Imgur</a>
                </blockquote>
                <p>Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
            </div>
        `;

        infoWindow.setContent(embedHtml);
        infoWindow.open(mapa, marcador);

        setTimeout(() => {
            if (!document.querySelector('script[src="//s.imgur.com/min/embed.js"]')) {
                const script = document.createElement('script');
                script.src = "//s.imgur.com/min/embed.js";
                script.async = true;
                script.charset = "utf-8";
                document.body.appendChild(script);
            } else if (window.imgurEmbed && typeof window.imgurEmbed.process === "function") {
                window.imgurEmbed.process();
            }
        }, 100);
    });
}



