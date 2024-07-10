function getLocation() {
    navigator.geolocation.getCurrentPosition(function(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        // Envoyer les coordonnées à l'endpoint /location
        fetch("http://127.0.0.1:8000/location", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ latitude, longitude })
        }).then(response => response.text())
          .then(data => console.log(data));
    }, function(error) {
        console.error("Error Code = " + error.code + " - " + error.message);
    });
}

getLocation();
