
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


function cargarPuntosVuforia(){
    let targetIds = traerTargetIds();

    console.log(targetIds);

}

function traerTargetIds() {
    const url = 'https://cors-anywhere.herokuapp.com/https://vws.vuforia.com/targets';
    let targetIds = [];

    const httpVerb = "GET";
    const md5 = "d41d8cd98f00b204e9800998ecf8427e"; //al ser una peticion sin body
    const contentType = "";
    const date = new Date().toUTCString();
    const requestPath = "/targets";

    const stringToSign = httpVerb + "\n" +
                         md5 + "\n" +
                         contentType + "\n" +
                         date + "\n" +
                         requestPath;
    
    const signature = generarHMAC(stringToSign, secretKey);

    //header `Authorization`
    const authorizationHeader = `VWS ${accessKey}:${signature}`;

    /*
    const xhr = new XMLHttpRequest();
    
    xhr.open("GET", url);
    xhr.setRequestHeader("Host", "vws.vuforia.com");
    xhr.setRequestHeader("Date", date);
    xhr.setRequestHeader("Authorization", authorizationHeader);
    xhr.send();
    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const data = xhr.response;
            targetIds = data.results;
            console.log(data);
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };*/
    fetch(url, {
        method: "GET",
        headers: {
            "Host": "vws.vuforia.com", // No puedes establecer este encabezado manualmente, pero fetch lo maneja por sí mismo
            "Date": date,              // Similar a "Host", este encabezado lo maneja fetch automáticamente
            "Authorization": authorizationHeader
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();  // Parsear la respuesta a JSON
        } else {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
    })
    .then(data => {
        targetIds = data.results;
        console.log(data);
    })
    .catch(error => {
        console.log(error);
    });
    

    return targetIds;
}

function generarHMAC(stringToSign, secretKey) {
    function generarHMAC(stringToSign, secretKey) {
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secretKey);
    
        // Importar la clave de manera asincrónica
        return window.crypto.subtle.importKey(
            "raw", keyData, { name: "HMAC", hash: { name: "SHA-1" } }, false, ["sign"]
        )
        .then((key) => {
            // Firmar de manera asincrónica
            return window.crypto.subtle.sign(
                "HMAC", key, encoder.encode(stringToSign)
            );
        })
        .then((signatureBuffer) => {
            const signatureArray = new Uint8Array(signatureBuffer);
            const signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray));
            return signatureBase64;
        })
        .catch((error) => {
            console.error("Error al generar HMAC:", error);
        });
    }
    
}