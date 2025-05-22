import * as THREE from 'three';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2, LineGeometry, LineMaterial } from 'three/examples/jsm/Addons.js';

const colorMapping = [0x0000ff, 0xffffff, 0xffffff, 0xffffff, 0x0000ff, 0x0000ff]
const cubeGeometry: THREE.BufferGeometry = new THREE.BoxGeometry().toNonIndexed()
const positions = cubeGeometry.getAttribute('position');
const color = new THREE.Color();
const colors = []

let colorIndex = 0;
for (let i = 0; i < positions.count; i += 6) {
  color.setHex(colorMapping[colorIndex])
  colorIndex++;
  colors.push(color.r, color.g, color.b);
  colors.push(color.r, color.g, color.b);
  colors.push(color.r, color.g, color.b);

  colors.push(color.r, color.g, color.b);
  colors.push(color.r, color.g, color.b);
  colors.push(color.r, color.g, color.b);
}
cubeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
const material = new THREE.MeshStandardMaterial({ vertexColors: true })
const tentativeMat = new THREE.MeshStandardMaterial({ vertexColors: true, transparent: true, opacity: .7})
const grayMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
const emptyMaterial = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: .0 })

const edges = [
  [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5], [0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
  [-0.5, 0.5, -0.5], [-0.5, -0.5, -0.5],

  [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5],
  [0.5, -0.5, 0.5], [0.5, 0.5, 0.5],
  [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5], [-0.5, -0.5, 0.5],

  [-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5],
  [0.5, -0.5, -0.5], [0.5, -0.5, 0.5],
  [0.5, 0.5, -0.5], [0.5, 0.5, 0.5],
  [-0.5, 0.5, -0.5], [-0.5, 0.5, 0.5],
];

const outline = new LineSegmentsGeometry();
outline.setPositions(edges.flat());
let lsmat = new LineMaterial({ color: 0x555555, linewidth: 1 })

export class Block extends THREE.Object3D {

  mesh: THREE.Mesh;
  wire_mesh;
  static genericOutline = new LineSegments2(outline, lsmat);
  outlineVisible: boolean = false;
  meshVisible: boolean = true;
  tentativeVisible: boolean = false;
  position: THREE.Vector3;


  constructor(pos: THREE.Vector3, occupied?: boolean, gray?: boolean) {
    super();

    //this.meshVisible = occupied ?? true;
    this.position = pos;
    occupied = occupied ?? true;

    if (gray) {
      this.mesh = new THREE.Mesh(cubeGeometry, grayMaterial);
    } else {
      this.mesh = new THREE.Mesh(cubeGeometry, material);
    }

    //this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.castShadow = occupied;
    this.mesh.receiveShadow = occupied;

    this.wire_mesh = new LineSegments2(outline, lsmat);
    //this.wire_mesh.position.set(pos.x, pos.y, pos.z);
    this.add(this.mesh);

    this.setVisible(occupied);
      //this.mesh.material = emptyMaterial;

  }

  setTentative(state?: boolean) {
    state = state ?? true;
    if (state == this.tentativeVisible) return;

    if (state) {
      //this.add(this.mesh);
      this.mesh.material = tentativeMat;
      this.tentativeVisible = true;
      console.debug("Added mesh");
    } else if (!state) {
      console.debug("removed mesh");
      this.mesh.material = emptyMaterial;
      this.tentativeVisible = false;
    }

  }

  setVisible(state?: boolean) {
    state = state ?? true;
    if (state == this.meshVisible) return;

    if (state) {
      //this.add(this.mesh);
      this.mesh.material = material;
      this.meshVisible = true;
      console.debug("Added mesh");
      return;
    } else if (!state) {
      console.debug("removed mesh");
      //this.remove(this.mesh);
      this.mesh.material = emptyMaterial;
      this.meshVisible = false;
    }
  }

  setOutline(state?: boolean) {
    state = state ?? true;
    if (state == this.outlineVisible) return;

    if (state) {
      this.add(this.wire_mesh);
      this.outlineVisible = true;
      console.debug("Added outline");
      return;
    } else if (!state) {
      console.debug("removed outline");
      this.remove(this.wire_mesh);
      this.outlineVisible = false;
    }
  }

  setPosition(pos: THREE.Vector3) {
    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.wire_mesh.position.set(pos.x, pos.y, pos.z);
  }

  flipQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,1,1).normalize(), new THREE.Vector3(-1,-1,-1).normalize());
  normalQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,1,1).normalize(), new THREE.Vector3(1,1,1).normalize());
  setRotation(orientation: number, flip?: boolean) {
    flip = flip ?? false;
    console.log("rotate", orientation)

    if (flip) {
      console.log("bum rotate", orientation)
      this.mesh.setRotationFromQuaternion(this.flipQuat);
    } else {
      this.mesh.setRotationFromQuaternion(this.normalQuat);
    }
    orientation = orientation % 6;

    this.mesh.rotateOnWorldAxis(new THREE.Vector3(1, 1, 1).normalize(), Math.PI * 2 * orientation / 3);

  }

  incrementRotation(rate?: number) {
    rate = rate ?? 1;
    this.mesh.rotateOnAxis(new THREE.Vector3(1, 1, 1).normalize(), Math.PI / 3 * 2 * rate);
    //this.mesh.rotateOnAxis(new THREE.Vector3(1,1,1), Math.PI / 3);
    //this.mesh.rotateOnWorldAxis(new THREE.Vector3(1,1,1), Math.PI * 2 / 3)
    //this.geometry.rotateOnAxis(new THREE.Vector3(1,1,1), Math.PI / 3 * rate);
    //this.geometry.rotateX(Math.PI / 3 * rate);
    //this.mesh.rotateX(Math.PI / 3 * rate);
    //this.mesh.rotate
  }
}
