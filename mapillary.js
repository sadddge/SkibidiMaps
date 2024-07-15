import {Viewer} from 'https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.module.js';

const container = document.createElement('div');
container.style.width = '1200px';
container.style.height = '900px';
document.body.appendChild(container);

const viewer = new Viewer({
    accessToken: 'MLY|7783857768335335|3c8731e3c9d763554e7d2c4519ee1858',
    container,
    imageId: '154753879917602',
});

async function fetchImageLocation(imageId, accessToken) {
    const response = await fetch(`https://graph.mapillary.com/${imageId}?fields=id,geometry&access_token=${accessToken}`);
    const data = await response.json();
    return data.geometry.coordinates;
}

const imageId = '154753879917602';
const accessToken = 'MLY|7783857768335335|3c8731e3c9d763554e7d2c4519ee1858';

fetchImageLocation(imageId, accessToken)
    .then(coordinates => {
        const locationInfoDiv = document.getElementById('location-info');
        locationInfoDiv.innerHTML = `Latitud: ${coordinates[1]}, Longitud: ${coordinates[0]}`;
    })
    .catch(error => console.error('Error fetching image location:', error));