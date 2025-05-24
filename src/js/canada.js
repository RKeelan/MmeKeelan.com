import '../css/styles.css';
import '../css/canadaStyles.css';
import canadaMapPath from '../assets/images/ca.svg';
const maxSvgHeight = 1000;

const provinceData = {
    'Yukon': {
        Nom: 'Yukon',
        Capitale: 'Whitehorse',
        Population: "40K"
    },
    'Northwest Territories': {
        Nom: 'Territoires du Nord-Ouest',
        Capitale: 'Yellowknife',
        Population: "41K"
    },
    'Nunavut': {
        Nom: 'Nunavut',
        Capitale: 'Iqaluit',
        Population: "37K"
    },
    'British Columbia': {
        Nom: 'Colombie-Britannique',
        Capitale: 'Victoria',
        Population: "5M"
    },
    'Alberta': {
        Nom: 'Alberta',
        Capitale: 'Edmonton',
        Population: "___"
    },
    'Saskatchewan': {
        Nom: 'Saskatchewan',
        Capitale: 'Regina',
        Population: "___"
    },
    'Manitoba': {
        Nom: 'Manitoba',
        Capitale: '_Winnipeg__',
        Population: "___"
    },
    'Ontario': {
        Nom: 'Ontario',
        Capitale: 'Toronto',
        Population: "15.5M"
    },
    'Québec': {
        Nom: 'Québec',
        Capitale: 'Ville de Québec',
        Population: "8.5M"
    },
    'New Brunswick': {
        Nom: 'Nouveau-Brunswick',
        Capitale: 'Fredericton',
        Population: "___"
    },
    'Nova Scotia': {
        Nom: 'Nouvelle-Écosse',
        Capitale: 'Halifax',
        Population: "___"
    },
    'Prince Edward Island': {
        Nom: 'Île-du-Prince-Édouard',
        Capitale: 'Charlottetown',
        Population: "___"
    },
    'Newfoundland and Labrador': {
        Nom: 'Terre-Neuve-et-Labrador',
        Capitale: 'St John\'s',
        Population: "___"
    },
}

fetch(canadaMapPath)
  .then(response => response.text())
  .then(data => {
    document.getElementById('caSvgContainer').innerHTML = data;
    const svgElement = caSvgContainer.querySelector('svg');

    // Calculate aspect ratio and scale
    const originalWidth = parseFloat(svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width);
    const originalHeight = parseFloat(svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height);
    const aspectRatio = originalWidth / originalHeight;
    scaleSvg(svgElement, aspectRatio);

    // Select elements
    var elements = Array.from(document.querySelectorAll('svg path[name]'));
    console.log(elements.length);

    // Add event listeners
    elements.forEach(function(el) {
        el.addEventListener("click",  click);
    })
    
    // event listener functions
    

});

function scaleSvg(svgElement, aspectRatio) {
    let newHeight = Math.min(maxSvgHeight, window.innerHeight);
    let newWidth = newHeight * aspectRatio;
  
    svgElement.setAttribute('width', newWidth);
    svgElement.setAttribute('height', newHeight);
}

function click(e){
    var province = e.target.getAttribute('name');
    
    // Update info card
    document.querySelector('#infoCard h2').innerText = province;
    const tableBody = document.querySelector('#infoTable tbody');
    tableBody.innerHTML = ''; // Clear current rows
  
    const data = provinceData[province];
    for (const [key, value] of Object.entries(data)) {
        const row = document.createElement('tr');
        const cellKey = document.createElement('td');
        const cellValue = document.createElement('td');
        cellKey.innerText = `${key}:`;
        cellValue.innerText = value;
        row.appendChild(cellKey);
        row.appendChild(cellValue);
        tableBody.appendChild(row);
    }
}