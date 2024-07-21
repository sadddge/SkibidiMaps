import { Viewer } from 'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.module.js';

const container = document.getElementById('images');
const accessToken = 'MLY|7783857768335335|3c8731e3c9d763554e7d2c4519ee1858';
let bboxes = [`33.446,-17.649,68.129,47.482`]
let imagesPerBbox = 200;
let images = [];
let round = 1;

let map = null;
let points = 0;
let score = 0;

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

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;

}

async function fetchAllImages() {
    for (const bbox of bboxes) {
        const imagesInBbox = await fetch(`https://graph.mapillary.com/images?access_token=${accessToken}&fields=id,geometry&limit=${imagesPerBbox}&bbox=${bbox}`);
        const data = await imagesInBbox.json();
        for (const image of data.data) {
            const info = {
                id: image.id,
                coordinates: image.geometry.coordinates
            };
            images.push(info);
        }
    }
    images = shuffle(images);
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
    map = L.map('map', {
        center: [0, 0],
        zoom : 2,
        minZoom: 2,
    });

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

    let cords = bboxes[0].split(',');
    
    L.marker([Number(cords[0]), Number(cords[1])]).addTo(map);
    L.marker([Number(cords[2]), Number(cords[3])]).addTo(map);



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

function calculateScore() {
    if (!lat_lng) {
        alert('Please select a location on the map');
        return;
    }

    let dis = distance(lat_lng[0], lat_lng[1], images[0].coordinates[1], images[0].coordinates[0]);
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

    points += score;

    const guess = document.getElementById('guess');
    const next = document.getElementById('next');
    guess.disabled = true;
    next.disabled = false;



    if (polyline) {
        polyline.remove();
    }
    polyline = L.polyline([lat_lng, [images[0].coordinates[1], images[0].coordinates[0]]], { color: 'red', smoothFactor: 10 }).addTo(map);
}

function updateScore() {
    const scoreLabel = document.getElementById('score');
    scoreLabel.textContent = "Score: " + String(score);
}

function updatePoints() {
    const pointsLabel = document.getElementById('points');
    pointsLabel.textContent = "Puntaje: " + String(points);
}

function nextImage() {
    if (round == 5) {
        alert('Game Over - Puntaje final: ' + points);
        setTimeout(reset, 2000);
        return;
    }
    images.shift();
    showImage(images[0].id);

    round++;
    const roundLabel = document.getElementById('round');
    const next = document.getElementById('next');
    const score = document.getElementById('score');
    score.textContent = "Score:";
    next.disabled = true;
    roundLabel.textContent = "Round: " + String(round);
    
    marker.remove();
    polyline.remove();
    lat_lng = null;

    const mapContainer = document.getElementById('container-map');
    const toggleButton = document.getElementById('toggle-map');

    if (mapContainer.classList.contains('expanded')) {
        mapContainer.classList.toggle('expanded');
        toggleButton.textContent = 'Expand';
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }

    
}

function reset() {
    round = 1;
    points = 0;
    score = 0;
    images.shift();
    showImage(images[0].id);
    updatePoints();

    polyline.remove();
    const roundLabel = document.getElementById('round');
    const next = document.getElementById('next');
    next.disabled = true;

    roundLabel.textContent = "Round: " + String(round);
}

function main() {
    init_map();
    showImage(images[0].id);

    const guess = document.getElementById('guess');
    const next = document.getElementById('next');
    next.disabled = true;

    guess.onclick = () => {
        calculateScore();
        updateScore();
        updatePoints();
    };

    next.onclick = () => {
        nextImage();
        guess.disabled = false;
    };
}

fetchAllImages().then(main);
