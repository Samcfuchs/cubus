import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Block } from './block.ts';
import { Board } from './board.ts';

const ORIGIN = new THREE.Vector3(0, 0, 0);
const BOARD_ORIGIN = new THREE.Vector3(0, 1, 0);
let targetBlock: Block;

function putCube(pos: THREE.Vector3, size?: number): THREE.Mesh {
  size = size ?? 1;
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshNormalMaterial();
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(pos.x, pos.y, pos.z);
  return cube;
}

function drawLine(a: THREE.Vector3, b: THREE.Vector3, color?: any) {
  const geometry = new THREE.BufferGeometry().setFromPoints([a, b])
  const material = new THREE.LineBasicMaterial({ color: color ?? 0xffffff })
  const obj = new THREE.Line(geometry, material);
  return obj;
}

function drawCubeSystem() {
  let x_line = drawLine(ORIGIN, new THREE.Vector3(1, 0, 0), 0xff0000)
  let y_line = drawLine(ORIGIN, new THREE.Vector3(0, 1, 0), 0x00ff00)
  let z_line = drawLine(ORIGIN, new THREE.Vector3(0, 0, 1), 0x0000ff)

  cube_group.add(x_line);
  cube_group.add(y_line);
  cube_group.add(z_line);

  return cube_group;
}

let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let controls: OrbitControls;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;

const cube_group = new THREE.Group();
const vFrom = new THREE.Vector3(1, 1, 1).normalize();
const vTo = new THREE.Vector3(0, 1, 0);
const quaternion = new THREE.Quaternion().setFromUnitVectors(vFrom, vTo);
cube_group.setRotationFromQuaternion(quaternion);


const CAMERA_UP = new THREE.Vector3(0, 1, 0);
let gui: GUI;

let updateXView: () => void;
let updateYView: () => void;
let updateZView: () => void;

export function initScene() {
  const mount = document.getElementById('app') as HTMLDivElement;
  gui = new GUI( {container: document.getElementById('gui_container')!, title: "Configuration"} );

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  mount.appendChild(renderer.domElement);

  console.log("mounted");


  camera = new THREE.PerspectiveCamera(5, mount.clientWidth / mount.clientHeight);
  camera.position.set(0, 100, 0)
  camera.up.set(CAMERA_UP.x, CAMERA_UP.y, CAMERA_UP.z);

  camera.lookAt(BOARD_ORIGIN);


  window.addEventListener('resize', () => {
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(mount.clientWidth, mount.clientHeight);
  });


  controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = Math.PI * 0.1;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.mouseButtons = { RIGHT: THREE.MOUSE.ROTATE }

  controls.update(.01);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  addLights();

  updateXView = addFixedCamera(new THREE.Vector3(10, 0, 0), 'view_x');
  updateYView = addFixedCamera(new THREE.Vector3(0, 10, 0), 'view_y');
  updateZView = addFixedCamera(new THREE.Vector3(0, 0, 10), 'view_z');

}

function updateViews() {
  updateXView();
  updateYView();
  updateZView();
}

const FIXED_CAMERA_HEIGHT = 6;
function addFixedCamera(blockSpacePosition: THREE.Vector3, elementID: string) {
  let canvas = document.getElementById(elementID) as HTMLDivElement;
  let fixed_camera_width = FIXED_CAMERA_HEIGHT * (canvas.clientWidth / canvas.clientHeight);
  let camera = new THREE.OrthographicCamera(
    -fixed_camera_width, fixed_camera_width,
    FIXED_CAMERA_HEIGHT, -FIXED_CAMERA_HEIGHT);

  let pos = cube_group.localToWorld(blockSpacePosition);
  camera.position.set(pos.x, pos.y, pos.z);
  camera.up.set(CAMERA_UP.x, CAMERA_UP.y, CAMERA_UP.z);
  camera.lookAt(BOARD_ORIGIN);

  let renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  canvas.appendChild(renderer.domElement);

  renderer.render(scene, camera);

  window.addEventListener('resize', () => {
    //camera.aspect = mount.clientWidth / mount.clientHeight;
    fixed_camera_width = FIXED_CAMERA_HEIGHT * (canvas.clientWidth / canvas.clientHeight);
    camera.left = -fixed_camera_width, camera.right = fixed_camera_width;
    camera.updateProjectionMatrix();

    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.render(scene, camera);
  });

  return () => renderer.render(scene, camera);
}

function addLights() {
  const light = new THREE.AmbientLight(0xffffff, .4);
  scene.add(light);

  const dirlight = new THREE.DirectionalLight(0xFFF9F1, 10);
  dirlight.position.set(0, 10, 10);
  dirlight.lookAt(ORIGIN);
  dirlight.castShadow = true;
  dirlight.shadow.mapSize.width = 2048; // Higher resolution = sharper shadows
  dirlight.shadow.mapSize.height = 2048;
  dirlight.shadow.camera.near = 0.5;
  dirlight.shadow.camera.far = 50;

  scene.add(dirlight);

  const fillLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.5);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(-5, 3, -5);
  scene.add(backLight);

  let lightControls = gui.addFolder("Lights").close();
  lightControls.add(fillLight, 'intensity', 0, 10).name("Fill light intensity");
  lightControls.add(dirlight, 'intensity', 0, 10).name("Key light intensity");
  lightControls.add(backLight, 'intensity', 0, 10).name("Rim light intensity");

}

function createBoard() {
  let verticalOffset = .4;
  let height = 1;
  //const ground = new THREE.PlaneGeometry(10,10);
  //const ground = new THREE.CircleGeometry(6, 32);
  const ground = new THREE.CylinderGeometry(6.3, 8, height);

  const groundMat = new THREE.MeshStandardMaterial({ color: 0xa12f2f, roughness: 1.0, metalness: 0.0 })
  const groundMesh = new THREE.Mesh(ground, groundMat);
  groundMesh.position.set(BOARD_ORIGIN.x, BOARD_ORIGIN.y - height + verticalOffset, BOARD_ORIGIN.z);
  //groundMesh.lookAt(camera.up.clone().multiplyScalar(10));
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);
}

function addCubes() {

  for (let x = -3; x < 3; x++) {
    for (let y = -3; y < 3; y++) {
      for (let z = -3; z < 3; z++) {
        if (x + y + z == 1 && Math.random() > 0.6) {
          let block = new Block(new THREE.Vector3(x, y, z))
          cube_group.add(block);
          //cube_group.add(block.wire_mesh);
        }
        if (x + y + z == 2 && Math.random() > 0.8) {
          let block = new Block(new THREE.Vector3(x, y, z))
          block.incrementRotation();
          cube_group.add(block);
          //cube_group.add(block.wire_mesh);
        }
      }
    }
  }

  targetBlock = new Block(new THREE.Vector3(2, 2, 2));
  cube_group.add(targetBlock);

  scene.add(cube_group);
}

document.addEventListener('mousemove', onDocumentMouseMove, false);
function onDocumentMouseMove(event: MouseEvent) {
  const rect = renderer.domElement.getBoundingClientRect();

  mouse.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  board.placementRotation = clientRotation;
  board.raycastAvailableSpace(raycaster);
  updateRotation();

  console.debug(board);
}


document.addEventListener('wheel', onScroll)
function onScroll(event: WheelEvent) {
  if (event.deltaY < 0) {
    rotateCW();
  }
  else {
    rotateCCW();
  }
}

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

let ticks = 0;
let clientRotation = 0;
let invert = false;
function rotateCW() {
  ticks++;
  updateRotation();
}
document.getElementById('rotate_right')!.onclick = rotateCW;

function rotateCCW() {
  ticks--;
  updateRotation();
}
document.getElementById('rotate_left')!.onclick = rotateCCW;

function updateRotation() {
  board.pickedBlock?.setRotation(mod(ticks, 6), invert);
}

function invertFlip() {
  console.log("inverted:", invert)
  invert = !invert;
}
document.getElementById('flip')!.onclick = invertFlip;

function click() {
  if (board.pickedBlock) {
    board.addBlock(board.pickedBlock);
    board.pickedBlock = null;
    board.updateSpaces();
  }
  updateViews();
}
document.getElementById('app')!.onclick = click;

function animate() {
  requestAnimationFrame(animate);

  //targetBlock.incrementRotation(0.03);
  controls.update();
  renderer.render(scene, camera);
}

let board: Board;

export function main() {
  initScene();
  createBoard();
  board = new Board(scene);
  animate();

  updateViews();

  console.debug(board);
}

main();
