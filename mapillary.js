import { Viewer } from 'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.module.js';

const container = document.getElementById('images');

const imageId = '154753879917602';
const accessToken = 'MLY|7783857768335335|3c8731e3c9d763554e7d2c4519ee1858';
let bboxes = ["33.446,-17.649,68.129,47.482"]
let images = [];

let viewer = null;

function showImage(imageId) {
    if (viewer) {
        viewer.remove();
    }
    viewer = new Viewer({
        container,
        imageId,
        accessToken
    });
}

async function fetchAllImages() {
    for (const bbox of bboxes) {
        const imagesInBbox = await fetch(`https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,geometry&limit=200&bbox=${bbox}`);
        const data = await imagesInBbox.json();
        for (const image of data.data) {
            const info = {
                id: image.id,
                coordinates: image.geometry.coordinates
            };
            images.push(info);
        }
    }
}

function switchImage(index) {
    if (index < 0) {
        index = images.length - 1;
    } else if (index >= images.length) {
        index = 0;
    }
    showImage(images[index].id);
    setTimeout(() => switchImage(index + 1), 4000);
}

function main() {
    const map = L.map('map').setView([0, 0], 2); // Coordenadas centradas en el mundo y zoom inicial

    // Añadir capa de tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Manejar el clic en el mapa
    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        L.marker([lat, lng]).addTo(map)
            .bindPopup(`You clicked the map at ${lat.toFixed(2)}, ${lng.toFixed(2)}`)
            .openPopup();
    });

    // Manejar el clic en el botón para expandir/contraer el mapa
    const mapContainer = document.getElementById('container-map');
    const toggleButton = document.getElementById('toggle-map');

    toggleButton.addEventListener('click', () => {
        mapContainer.classList.toggle('expanded');
        toggleButton.textContent = mapContainer.classList.contains('expanded') ? 'Collapse' : 'Expand';
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    });

    fetchAllImages().then(() => {
        showImage(images[0].id);
    });
}

main();
