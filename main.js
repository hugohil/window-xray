import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const sw = screen.width;
const sh = screen.height;
let iw = window.innerWidth;
let ih = window.innerHeight;

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

const title = document.querySelector('#title');
if (mode) title.textContent = mode.toUpperCase();

localStorage.setItem('type', 'shiba');

let currentType = localStorage.getItem('type');

title.addEventListener('input', () => {
  console.log('Content changed:', title.textContent);

  if (/shiba/gmi.test(title.textContent)) {
    model.shiba.visible = true;
    model.dino.visible = false;
    localStorage.setItem('type', title.textContent);
  } else if (/dino/gmi.test(title.textContent)) {
    model.dino.visible = true;
    model.shiba.visible = false;
    localStorage.setItem('type', title.textContent);
  }
});

const modelSize = 500;

const scene = new THREE.Scene();

let aspect = iw / ih;
const camera = new THREE.OrthographicCamera(aspect/-2, aspect/2, 1/2, 1/-2, -100, 100);
camera.z = 5;

let cameraWidth = camera.right - camera.left;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(iw, ih);
document.body.appendChild(renderer.domElement);

const vertexShader = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal); // Transform the normal to camera space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentXRAY = `
  varying vec3 vNormal;

  void main() {
    float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    // add scane lines
    intensity += sin(gl_FragCoord.y) * 0.2;
    gl_FragColor = vec4(0.0, 0.5, 1.0, 0.5) * intensity; // Blueish color with transparency
  }
`;

const materialXRAY = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentXRAY,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

let model = {
  shiba: null,
  dino: null
}

const loader = new GLTFLoader();
function loadFile (filename, cb) {
  loader.load(
    filename, // models from zixisun02 on sketchfab
    function (gltf) {
      const mesh = gltf.scene;
      mesh.position.z = -1;
  
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (mode === 'xray') {
            child.material = materialXRAY;
          } else if (mode === 'wireframe') {
            child.material.wireframe = true;
          }
        }
      });
  
      cb(mesh);
    },
    function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    function ( error ) {
      console.log( 'An error happened', error );
    }
  );
}

loadFile('shiba.glb', (mesh) => {
  model.shiba = mesh;
  scene.add(model.shiba);
  scaleModel();

});
loadFile('dinosaur.glb', (mesh) => {
  model.dino = mesh;
  model.dino.visible = false;
  scene.add(model.dino);
  scaleModel();
});

console.log(window.screenX, window.screenY)
console.log(sw, sh)
console.log(iw, ih)

const light = new THREE.PointLight(0xffffff, 20, 100);
light.position.set(0, 0, 0);
scene.add(light);

console.log(camera.left, camera.right, camera.top, camera.bottom)

// from https://github.com/bgstaal/multipleWindow3dScene/blob/main/main.js
let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

function getTime () {
  return (new Date().getTime() - today) / 1000.0;
}

function animate() {
  requestAnimationFrame(animate);

  currentType = localStorage.getItem('type');
  if (currentType === 'shiba') {
    if (model.shiba) model.shiba.visible = true;
    if (model.dino) model.dino.visible = false;
  } else if (currentType === 'dino') {
    if (model.dino) model.dino.visible = true;
    if (model.shiba) model.shiba.visible = false;
  }

  let t = getTime();

  const windowX = window.screenX;
  const windowY = window.screenY;

  const screenCenterX = sw / 2;
  const windowCenterX = iw / 2;
  const absWindowCenterX = windowX + windowCenterX;
  const offsetX = screenCenterX - absWindowCenterX;
  const worldOffsetX = (offsetX / iw);
  const camX = (camera.right - camera.left);
  let posX = worldOffsetX * camX;

  const screenCenterY = sh / 2;
  const windowCenterY = ih / 2;
  const absWindowCenterY = windowY + windowCenterY;
  const offsetY = 1 - (screenCenterY - absWindowCenterY);
  const worldOffsetY = (offsetY / ih);
  const camY = (camera.top - camera.bottom);
  let posY =(worldOffsetY * camY);

  if (model[currentType]) model[currentType].position.set(posX, posY, model[currentType].position.z);
  if (model[currentType]) model[currentType].rotation.y = t * 0.5;

  const elementX = (sw/2) - windowX
  const elementY = 50 - windowY
  title.style.left = `${elementX}px`;
  title.style.top = `${elementY}px`;

  renderer.render(scene, camera);
}
animate();

function scaleModel() {
  const size = (cameraWidth / iw) * modelSize;

  model.shiba?.scale.set(size, size, size);
  model.dino?.scale.set(size * 0.5, size * 0.5, size * 0.5);
}

function resize () {
  iw = window.innerWidth;
  ih = window.innerHeight;

  renderer.setSize(iw, ih);

  aspect = iw/ih;
  camera.left = -aspect/2;
  camera.right = aspect/2;
  camera.top = 1/2;
  camera.bottom = -1/2;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  cameraWidth = camera.right - camera.left;

  scaleModel();
}
window.addEventListener('resize', resize);
resize();

/*
"Dinosaur" (https://skfb.ly/6YnPP) by zixisun02 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).



 */