import { Viewer } from 'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.module.js';

const container = document.getElementById('images');

const imageId = '154753879917602';
const accessToken = 'MLY|7783857768335335|3c8731e3c9d763554e7d2c4519ee1858';
let bboxes = ["33.446,-17.649,68.129,47.482"]
let images = [];

let map = null;

let marker = null;
let lat_lng = null;
let polyline = null;

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

function init_map() {
    map = L.map('map').setView([0, 0], 2);



    const mapContainer = document.getElementById('container-map');
    const toggleButton = document.getElementById('toggle-map');

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        if (marker) {
            marker.remove();
        }
        marker = L.marker([lat, lng]).addTo(map);
        lat_lng = [lat, lng];
    });



    toggleButton.addEventListener('click', () => {
        mapContainer.classList.toggle('expanded');
        toggleButton.textContent = mapContainer.classList.contains('expanded') ? 'Collapse' : 'Expand';
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    });
}

function distance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c / 1000;
}

function score() {
    if (!lat_lng) {
        alert('Please select a location on the map');
        return;
    }
    let dis = distance(lat_lng[0], lat_lng[1], images[0].coordinates[1], images[0].coordinates[0]);
    let score = 0;
    const minDistance = 10;
    const maxDistance = 2000;
    const maxScore = 5000;

    if (dis <= minDistance) {
        score = maxScore;
    } else if (dis >= maxDistance) {
        score = 0;
    } else {
        // Interpolación lineal
        
        score = Math.round(maxScore * (1 - (dis - minDistance) / (maxDistance - minDistance)));
    }

    alert(`Your score is ${score}`);

    if (polyline) {
        polyline.remove();
    }
    polyline = L.polyline([lat_lng, [images[0].coordinates[1], images[0].coordinates[0]]], { color: 'red' }).addTo(map);
}

function main() {
    init_map();
    showImage(images[0].id);

    const guess = document.getElementById('guess');

    guess.addEventListener('click',() => score());
}

fetchAllImages().then(main);
