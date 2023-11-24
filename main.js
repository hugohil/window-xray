import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const sw = screen.width;
const sh = screen.height;
let iw = window.innerWidth;
let ih = window.innerHeight;

const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

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

const fragmentShader = `
  varying vec3 vNormal;

  void main() {
    float intensity = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(0.0, 0.5, 1.0, 0.5) * intensity; // Blueish color with transparency
  }
`;

const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});


let model = null;

const loader = new GLTFLoader();
loader.load(
  'shiba.glb', // model from zixisun02 on sketchfab
  function ( gltf ) {
    // gltf.scene.updateMatrixWorld();
    model = gltf.scene;
    scaleModel();
    model.position.z = -1;

    model.traverse((child) => {
      if (child instanceof THREE.Mesh && mode === 'xray') {
        child.material = material;
      }
    });

    scene.add(model);
  },
  function ( xhr ) {
    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
  },
  function ( error ) {
    console.log( 'An error happened', error );
  }
);

// // set model to be a cube
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const color = urlParams.get('color');
// const material = new THREE.MeshPhongMaterial({ color: color ? `#${color}` : 0x00ff00 });
// model = new THREE.Mesh(geometry, material);
// model.position.z = -5;
// scene.add(model);

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

  let t = getTime();

  const screenCenterX = sw / 2;
  const windowCenterX = iw / 2;
  const absWindowCenterX = window.screenX + windowCenterX;
  const offsetX = screenCenterX - absWindowCenterX;
  const worldOffsetX = (offsetX / iw);
  const camX = (camera.right - camera.left);
  const posX = worldOffsetX * camX;

  const screenCenterY = sh / 2;
  const windowCenterY = ih / 2;
  const absWindowCenterY = window.screenY + windowCenterY;
  const offsetY = 1 - (screenCenterY - absWindowCenterY);
  const worldOffsetY = (offsetY / ih);
  const camY = (camera.top - camera.bottom);
  const posY =(worldOffsetY * camY);

  if (model) model.position.set(posX, posY, model.position.z);
  if (model) model.rotation.y = t * 0.5;

  renderer.render(scene, camera);
}
animate();

function scaleModel() {
  const pixelSizeInCameraUnits = (cameraWidth / iw) * modelSize;
  model?.scale.set(pixelSizeInCameraUnits, pixelSizeInCameraUnits, pixelSizeInCameraUnits);
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
