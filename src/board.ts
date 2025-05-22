import * as THREE from 'three';
import { Block } from './block';

export class Board {

  placedBlocks: Block[];
  //placedPositions: [number,number,number][];
  placedPositions: Set<number>;
  blocks: THREE.Group;
  candidateBlocks: THREE.Group;
  spacesAvailable: Set<number>;
  scene: THREE.Scene;

  size: number = 4;
  placementRotation: number = 0;


  constructor(s: THREE.Scene) {
    this.placedBlocks = []
    this.placedPositions = new Set();
    this.spacesAvailable = new Set();
    this.scene = s;
    this.blocks = new THREE.Group();
    this.candidateBlocks = new THREE.Group();

    const vFrom = new THREE.Vector3(1, 1, 1).normalize();
    const vTo = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(vFrom, vTo);
    this.blocks.setRotationFromQuaternion(quaternion);
    this.candidateBlocks.setRotationFromQuaternion(quaternion);

    this.scene.add(this.blocks);
    this.scene.add(this.candidateBlocks);

    this.initBlocks();
    this.updateSpaces();
  };

  initBlocks() {
    this.iterateLayer(this.addBaseBlock.bind(this), 1)
  }

  iterateLayer(callback : ((x:number,y: number,z:number) => void), layer?: number) {
    for (let x = -this.size; x < this.size; x++) {
      for (let y = -this.size; y < this.size; y++) {
        for (let z = -this.size; z < this.size; z++) {
          if (!layer || x + y + z == layer) {
            callback(x,y,z);
          }
        }
      }
    }
  }

  addBaseBlock(x: number, y: number, z: number) {

    if (this.placedPositions.has(this.keyCoords(x,y,z))) {
      console.warn("Placing block over existing position");
    }

    let b = new Block(new THREE.Vector3(x, y, z), true, true);
    this.addBlock(b);

    return b;

  }


  createBlock(x: number, y: number, z: number) {


    let b = new Block(new THREE.Vector3(x, y, z));
    this.addBlock(b);

    return b;
  }

  addBlock(b: Block) {
    let pos : [number, number, number] = [b.position.x,b.position.y,b.position.z]

    if (this.placedPositions.has(this.keyCoords(...pos))) {
      console.warn("Placing block over existing position");
    }

    if (!this.spacesAvailable.has(this.keyCoords(...pos))) {
      console.warn("Illegal placement");
    }

    b.setVisible(true);
    this.blocks.add(b);
    this.placedBlocks.push(b);
    this.placedPositions.add(this.keyCoords(...pos));
    this.candidateBlocks.remove(b);

    this.updateSpaces();

  }

  // Hash an integer
  private hash(x:number,y:number,z:number) {
    return (x << 16) | (y << 8) | z;
  }

  private keyCoords(x:number, y:number, z:number) {
    return this.hash(x+this.size, y+this.size, z+this.size)
  }

  checkPosition(x: number, y:number, z: number) {
    return this.placedPositions.has(this.keyCoords(x,y,z));

  }

  updateSpaces() {
    console.log(this);
    this.iterateLayer((x,y,z) => {
      // Skip lower layers
      if (x+y+z <=1) return;

      if (this.checkPosition(x,y,z)) {
        this.spacesAvailable.delete(this.keyCoords(x,y,z));
        return;
      }

      // Check blocks below
      if (!this.checkPosition(x-1,y,z)) return;
      if (!this.checkPosition(x,y-1,z)) return;
      if (!this.checkPosition(x,y,z-1)) return;

      console.log("Open slot: ", x,y,z);

      let b = new Block(new THREE.Vector3(x,y,z), false);
      this.spacesAvailable.add(this.keyCoords(x,y,z));
      this.candidateBlocks.add(b);


    });
  }

  pickedBlock: Block | null = null;

  raycastAvailableSpace(raycaster: THREE.Raycaster, orientation?: number) {
    let intersects: THREE.Intersection[];
    let intersectedObject: THREE.Object3D | null;

    intersects = raycaster.intersectObjects(this.candidateBlocks.children);

    if (intersects.length > 0 ) {
      intersectedObject = intersects[0].object;

      while (intersectedObject && !(intersectedObject instanceof Block)) {
        intersectedObject = intersectedObject.parent;
      }


      if (intersectedObject instanceof Block) {
        if (this.pickedBlock !== intersectedObject) {
          this.pickedBlock?.setOutline(false);
          intersectedObject.setOutline(true);

          this.pickedBlock?.setTentative(false);
          intersectedObject.setTentative(true);

          this.pickedBlock?.setRotation(0);
          intersectedObject.setRotation(this.placementRotation);

          this.pickedBlock = intersectedObject;
        }
        return;
      }
    }
    if (this.pickedBlock) {
      this.pickedBlock.setOutline(false);
      this.pickedBlock.setRotation(0);
      this.pickedBlock.setTentative(false);
      this.pickedBlock = null;
    }
        
  }
}
