const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  // Get the value of "some_key" in eg "https://example.com/?some_key=some_value"
const api_key = params.some_key; // "some_value"

function cargarMapa() {
    if (!api_key) {
        alert("Falta la API Key en la URL");
        return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${api_key}&callback=iniciarMapa`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
}

cargarMapa(); // Llamamos a la función para cargar el script de Google Maps

function iniciarMapa() {
    const coordenadas = { lat: 43.4751, lng: -3.8078 }; 
    const mapa = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: coordenadas,
    });

    new google.maps.Marker({
        position: coordenadas,
        map: mapa,
        title: "Ubicación de ejemplo",
    });

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
