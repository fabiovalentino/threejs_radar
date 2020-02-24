import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Injectable, ElementRef, OnDestroy, NgZone } from '@angular/core';
import { List } from '../list';
import { ApiService } from '../api.service';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

@Injectable({
  providedIn: 'root'
})
export class EngineService implements OnDestroy {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private linePlayer: THREE.Line;
  private enemies: Map<number, number>;
  private deaths: Map<number, number>;
  private friends: Map<string, boolean>;
  private groupMap: Map<string, string>;
  private oldlista: Map<string, List>;
  private interval: any;

  private frameId: number = null;
  public playerid = '';
  public playergroupid = '';
  private player: List;
  private oldplayer: List;
  private pivot: THREE.Group;
  private pivot2: THREE.Group;

  public font: THREE.Font;

  private controls: any;

  private maxLife: number;

  private lineViewH: number;

  public is3D: boolean;


  private mixer: any;
  private clock: any;
  private idleAction: any;
  private walkAction: any;
  private runAction: any;
  private idleWeight: any;
  private walkWeight: any;
  private runWeight: any;
  private actions: any;
  private settings: any;
  private singleStepMode: boolean;

  private model: Map<string, THREE.Scene>;
  private sizeOfNextStep: Map<string, number>;

  private loadedGLTF;

  public constructor(private ngZone: NgZone, private api: ApiService) {
    this.settings = {
      'show model': true,
      'show skeleton': false,
      'deactivate all': this.deactivateAllActions,
      'activate all': this.activateAllActions,
      'pause/continue': this.pauseContinue,
      'make single step': this.toSingleStepMode,
      'modify step size': 0.05,
      'from walk to idle': function () {

        this.prepareCrossFade(this.walkAction, this.idleAction, 1.0);

      },
      'from idle to walk': function () {

        this.prepareCrossFade(this.idleAction, this.walkAction, 0.5);

      },
      'from walk to run': function () {

        this.prepareCrossFade(this.walkAction, this.runAction, 2.5);

      },
      'from run to walk': function () {

        this.prepareCrossFade(this.runAction, this.walkAction, 5.0);

      },
      'use default duration': true,
      'set custom duration': 1.0,
      'modify idle weight': 1.0,
      'modify walk weight': 0.0,
      'modify run weight': 0.0,
      'modify time scale': 1.0
    };
  }



  updatePlayers() {
    if (this.playerid !== null && this.playerid !== undefined && this.playerid !== '') {
      if (this.pivot === undefined) {
        this.getPlayers();
      } else {
        this.api.getPlayer()
          .subscribe( data => {
            if ( data.body !== null
              && data.body !== undefined
              && data.body.root !== undefined
              && data.body.root.playerCount === 0 ) {
              this.refreshVisual();
            }
            if ( data.body !== null
              && data.body !== undefined
              && data.body.root !== undefined
              && data.body.root.playerCount > 0 ) {

              const count = data.body.root.playerCount;
              const lista = data.body.list;


              let playerIdx = 0;

              for (let i = 0; i < count; i++) {
                const id = lista[i].id;
                if (id === this.playerid) {
                  this.player = lista[i];
                  playerIdx = i;
                  break;
                }
              }
              if (this.player !== null && this.player !== undefined) {
                for (let i = 0; i < count; i++) {
                  if (i !== playerIdx ) {
                    const posX = (lista[i].playerX - this.player.playerX);
                    const posY = (lista[i].playerY - this.player.playerY);
                    const posZ = (lista[i].playerZ - this.player.playerZ) * 4;



                    const oldEnemyId = this.enemies.get(lista[i].id);
                    if (oldEnemyId !== null && oldEnemyId !== undefined) {
                      const children = this.pivot.getObjectById(oldEnemyId);
                      if (children !== null && children !== undefined) {

                        if (this.oldlista.get(lista[i].id) !== undefined && this.oldlista.get(lista[i].id) !== null) {
                          let diffX = lista[i].playerX - this.oldlista.get(lista[i].id).playerX;
                          let diffY = lista[i].playerY - this.oldlista.get(lista[i].id).playerY;
                          let diffZ = lista[i].playerZ - this.oldlista.get(lista[i].id).playerZ;
                          if ( diffX < 0 ) { diffX = Math.abs(diffX); }
                          if ( diffY < 0 ) { diffY = Math.abs(diffY); }
                          if ( diffZ < 0 ) { diffZ = Math.abs(diffZ); }
                          if ( diffX === 0 && diffY === 0 && diffZ === 0 ) {
                            this.setWeight(this.idleAction.get('Soldier_' + lista[i].id), 1.0);
                            this.setWeight(this.walkAction.get('Soldier_' + lista[i].id), 0.0);
                            this.setWeight(this.runAction.get('Soldier_' + lista[i].id), 0.0);
                          } else if ((diffX >= 0 && diffX <= 10) || (diffY >= 0 && diffY <= 10) || (diffZ >= 0 && diffZ <= 10)) {
                            this.setWeight(this.idleAction.get('Soldier_' + lista[i].id), 0.0);
                            this.setWeight(this.walkAction.get('Soldier_' + lista[i].id), 1.0);
                            this.setWeight(this.runAction.get('Soldier_' + lista[i].id), 0.0);
                          } else {
                            this.setWeight(this.idleAction.get('Soldier_' + lista[i].id), 0.0);
                            this.setWeight(this.walkAction.get('Soldier_' + lista[i].id), 0.0);
                            this.setWeight(this.runAction.get('Soldier_' + lista[i].id), 1.0);
                          }
                        }
                        this.oldlista.set(lista[i].id, lista[i]);

                        children.position.x = posX;
                        children.position.y = posY;
                        children.rotation.z = this.toRad(lista[i].angleVertical * -1);



                        const lifep = (<THREE.Mesh>this.pivot2.getObjectByName('playerLife_' + lista[i].id));
                        const lifecontainerp = (<THREE.Mesh>this.pivot2.getObjectByName('playerLifeContainer_' + lista[i].id));
                        const health = lista[i].health;
                        const percentage = (10 / this.maxLife) * health;
                        (<THREE.CylinderGeometry>lifep.geometry) = new THREE.CylinderGeometry(0.5, 0.5, percentage, 10);


                        const rotationPiv2elm = this.toRad(this.player.angleVertical * -1);

                        lifep.rotation.z = this.toRad(90) + rotationPiv2elm;
                        lifep.position.y = posY - 7.5;
                        lifep.position.x = posX + 0;
                        lifep.position.z = posZ + 0.5;

                        lifecontainerp.rotation.z = this.toRad(90) + rotationPiv2elm;
                        lifecontainerp.position.y = posY - 7.5;
                        lifecontainerp.position.x = posX + 0;
                        lifecontainerp.position.z = posZ + 0.5;


                        const namep = (<THREE.Mesh>this.pivot2.getObjectByName('playerName_' + lista[i].id));
                        const textGeo = (<THREE.TextGeometry>namep.geometry);
                        const centerOffset = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
                        namep.rotation.z = rotationPiv2elm;
                        namep.position.x = posX + centerOffset;
                        namep.position.y = posY - 6;
                        namep.position.z = posZ + 0.5;


                        (<THREE.CylinderGeometry>lifep.geometry).verticesNeedUpdate = true;
                        (<THREE.CylinderGeometry>lifep.geometry).elementsNeedUpdate = true;
                        (<THREE.CylinderGeometry>lifep.geometry).uvsNeedUpdate = true;
                        (<THREE.CylinderGeometry>lifep.geometry).normalsNeedUpdate = true;

                        if (this.is3D) {
                          const childView = (<THREE.Group>children.getObjectByName('angleHorizontal'));
                          childView.rotation.x = this.toRad(lista[i].angleHorizontal * -1);
                          children.position.z = posZ;
                          const boxChild = (<THREE.Mesh>children.getObjectByName('zbase'));
                          (<THREE.CylinderGeometry>boxChild.geometry) = new THREE.CylinderGeometry(3, 3, posZ, 10);
                          boxChild.rotation.x = this.toRad(90);
                          boxChild.position.z = -posZ + (posZ / 2);

                          (<THREE.CylinderGeometry>boxChild.geometry).verticesNeedUpdate = true;
                          (<THREE.CylinderGeometry>boxChild.geometry).elementsNeedUpdate = true;
                          (<THREE.CylinderGeometry>boxChild.geometry).uvsNeedUpdate = true;
                          (<THREE.CylinderGeometry>boxChild.geometry).normalsNeedUpdate = true;
                        }
                      }




                    } else {

                      const clonedScene = (<THREE.Scene>SkeletonUtils.clone(this.loadedGLTF.scene));



                      this.clock.set('Soldier_' + lista[i].id, new THREE.Clock());


                      this.sizeOfNextStep.set('Soldier_' + lista[i].id, 0);

                      const childPivot = new THREE.Group();
                      childPivot.position.x = posX;
                      childPivot.position.y = posY;
                      childPivot.rotation.z = this.toRad(lista[i].angleVertical * -1);
                      this.enemies.set(lista[i].id, childPivot.id);
                      childPivot.name = lista[i].id + '';
                      this.pivot.add(childPivot);

                      let color = 0xff0000;
                      if (this.friends[lista[i].id]) {
                        color = 0x00ff00;
                      } else if (lista[i].side === '4') {
                        if (lista[i].isPlayer === 'true') {
                          color = 0x8f00a8;
                        } else {
                          color = 0x33ccf;
                        }
                      }

                      const lineGeom = new THREE.Geometry();
                      lineGeom.vertices.push(new THREE.Vector3(0, 2, this.lineViewH));
                      lineGeom.vertices.push(new THREE.Vector3(0, 20, this.lineViewH));



                      const childView = new THREE.Group();

                      const matGeom = new THREE.LineBasicMaterial({ color: color });
                      const line = new THREE.Line(lineGeom, matGeom);
                      childView.name = 'angleHorizontal';
                      childView.add(line);

                      childPivot.add(childView);
                      const colorName = '0x000000';
                      this.addName(this.pivot2, lista[i].name, lista[i].id, colorName);

                      this.addLife(this.pivot2, lista[i].id, 0, 0, 0);

                      if (this.is3D) {
                        const mGlass = new THREE.MeshLambertMaterial({
                          color: color,
                          opacity: 0.2,
                          transparent: true
                        });
                        const boxGeom = new THREE.CylinderGeometry(3, 3, posZ, 10);
                        const box = new THREE.Mesh(boxGeom, mGlass);
                        box.rotation.x = this.toRad(90);
                        box.position.z = -posZ + (posZ / 2);
                        box.name = 'zbase';
                        childPivot.add(box);
                      }


                      const modelen = clonedScene;
                      modelen.name = 'Soldier_' + lista[i].id;
                      this.model.set('Soldier_' + lista[i].id, modelen);

                      childPivot.add(modelen);



                      const animations = this.loadedGLTF.animations;

                      this.mixer.set('Soldier_' + lista[i].id, new THREE.AnimationMixer(this.model.get('Soldier_' + lista[i].id)));

                      this.idleAction.set('Soldier_' + lista[i].id, this.mixer.get('Soldier_' + lista[i].id).clipAction(animations[0]));
                      this.walkAction.set('Soldier_' + lista[i].id, this.mixer.get('Soldier_' + lista[i].id).clipAction(animations[3]));
                      this.runAction.set('Soldier_' + lista[i].id, this.mixer.get('Soldier_' + lista[i].id).clipAction(animations[1]));

                      this.actions.set('Soldier_' + lista[i].id, [this.idleAction.get('Soldier_' + lista[i].id),
                      this.walkAction.get('Soldier_' + lista[i].id),
                      this.runAction.get('Soldier_' + lista[i].id)]);

                      this.activateAllActions('Soldier_' + lista[i].id);


                    }
                  } else if (i === playerIdx) {

                    this.playergroupid = lista[i].groupId;
                    this.groupMap.set(lista[i].groupId, '0x000000');


                    const lifep = (<THREE.Mesh>this.scene.getObjectByName('playerLife'));

                    const health = lista[i].health;

                    const percentage = (10 / this.maxLife) * health;

                    (<THREE.CylinderGeometry>lifep.geometry) = new THREE.CylinderGeometry(0.5, 0.5, percentage, 10);

                    (<THREE.CylinderGeometry>lifep.geometry).verticesNeedUpdate = true;
                    (<THREE.CylinderGeometry>lifep.geometry).elementsNeedUpdate = true;
                    (<THREE.CylinderGeometry>lifep.geometry).uvsNeedUpdate = true;
                    (<THREE.CylinderGeometry>lifep.geometry).normalsNeedUpdate = true;
                  }

                }
                this.pivot.rotation.z = this.toRad(this.player.angleVertical);
                this.pivot2.rotation.z = this.toRad(this.player.angleVertical);

                if (this.oldplayer !== undefined) {
                  let diffX = this.oldplayer.playerX - this.player.playerX;
                  let diffY = this.oldplayer.playerY - this.player.playerY;
                  let diffZ = this.oldplayer.playerZ - this.player.playerZ;
                  if (diffX < 0) { diffX = Math.abs(diffX); }
                  if (diffY < 0) { diffY = Math.abs(diffY); }
                  if (diffZ < 0) { diffZ = Math.abs(diffZ); }
                  if (diffX === 0 && diffY === 0 && diffZ === 0) {
                    this.setWeight(this.idleAction.get('SoldierPlayer'), 1.0);
                    this.setWeight(this.walkAction.get('SoldierPlayer'), 0.0);
                    this.setWeight(this.runAction.get('SoldierPlayer'), 0.0);
                  } else if ((diffX >= 0 && diffX <= 10) || (diffY >= 0 && diffY <= 10) || (diffZ >= 0 && diffZ <= 10)) {
                    this.setWeight(this.idleAction.get('SoldierPlayer'), 0.0);
                    this.setWeight(this.walkAction.get('SoldierPlayer'), 1.0);
                    this.setWeight(this.runAction.get('SoldierPlayer'), 0.0);
                  } else {
                    this.setWeight(this.idleAction.get('SoldierPlayer'), 0.0);
                    this.setWeight(this.walkAction.get('SoldierPlayer'), 0.0);
                    this.setWeight(this.runAction.get('SoldierPlayer'), 1.0);
                  }
                }
                this.oldplayer = this.player;

                const keys = Array.from(this.enemies.keys());
                for (const key of keys) {
                  if (!this.isALive(key, lista, count)) {
                    const id = this.enemies.get(key);
                    const childDead = this.pivot.getObjectById(id);
                    this.pivot.remove(childDead);
                    this.enemies.delete(key);

                    const lifep = (<THREE.Mesh>this.scene.getObjectByName('playerLife_' + key));
                    const lifecontainerp = (<THREE.Mesh>this.scene.getObjectByName('playerLifeContainer_' + key));
                    const namep = (<THREE.Mesh>this.scene.getObjectByName('playerName_' + key));


                    this.pivot2.remove(lifep);
                    this.pivot2.remove(lifecontainerp);
                    this.pivot2.remove(namep);


                  }
                }


              }
            }
          });
      }
    }
  }

  isALive(key, lista, count) {
    for (let i = 0; i < count; i++) {
      if (key === lista[i].id) {
        return true;
      }
    }
    return false;
  }

  getPlayers() {
    this.api.getPlayer()
      .subscribe(data => {
        if (this.playerid !== null
          && this.playerid !== undefined
          && this.playerid !== ''
          && data.body !== null
          && data.body !== undefined
          && data.body.root !== undefined
          && data.body.root.playerCount > 0) {
          const count = data.body.root.playerCount;
          const lista = data.body.list;

          for (let i = 0; i < count; i++) {
            const id = lista[i].id;
            if (id === this.playerid) {
              this.player = lista[i];
              break;
            }
          }

          this.pivot = new THREE.Group();
          this.pivot2 = new THREE.Group();
          this.scene.add(this.pivot);
          this.scene.add(this.pivot2);

        } else if (this.pivot !== undefined) {
          const sizechild = this.pivot.children.length;
          for (let z = 0; z < sizechild; z++) {
            const children = this.pivot.children[z];
            this.pivot.remove(children);
          }
        }
      });
  }

  public ngOnDestroy() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  toRad(degrees) {
    const pi = Math.PI;
    return degrees * (pi / 180);
  }

  createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    this.canvas = canvas.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.createSceneInternal();



    this.getPlayers();
    this.interval = setInterval(() => {
      this.updatePlayers();
    }, 2000);

  }

  createSceneInternal() {
    const loader = new THREE.FontLoader();
    const _this = this;
    loader.load('https://raw.githubusercontent.com/rollup/three-jsnext/master/examples/fonts/droid/droid_sans_mono_regular.typeface.json',
     function (response) {
      _this.font = response;
    });

    if (this.is3D === undefined) {
      this.is3D = true;
    }

    this.lineViewH = 8;

    this.enemies = new Map<number, number>();
    this.deaths = new Map<number, number>();
    this.friends = new Map<string, boolean>();

    this.oldlista = new Map<string, List>();


    this.model = new Map<string, THREE.Scene>();
    this.mixer = new Map<string, THREE.AnimationMixer>();
    this.actions = new Map<string, []>();
    this.clock = new Map<string, THREE.Clock>();
    this.idleAction = new Map<string, any>();
    this.walkAction = new Map<string, any>();
    this.runAction = new Map<string, any>();
    this.idleWeight = new Map<string, any>();
    this.walkWeight = new Map<string, any>();
    this.runWeight = new Map<string, any>();
    this.sizeOfNextStep = new Map<string, number>();

    this.friends['1'] = true;
    this.friends['2'] = true;
    this.friends['3'] = true;
    this.friends['4'] = true;


    this.groupMap = new Map<string, string>();

    this.maxLife = 100;


    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x999999);




    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(- 3, 10, - 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = - 2;
    dirLight.shadow.camera.left = - 2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    this.scene.add(dirLight);
    this.scene.add(new THREE.AmbientLight(0x999999));
    this.camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 25, 1000);



    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, 0, 100);
    this.camera.add(new THREE.PointLight(0xffffff, 0));

    const grid = new THREE.GridHelper(1000, 20, 0xffffff, 0x6c7373);
    grid.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * (Math.PI / 180));
    this.scene.add(grid);


    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 50, 10);
    this.controls.update();

    const color = 0x00ff00;



    const lineGeom = new THREE.Geometry();
    lineGeom.vertices.push(new THREE.Vector3(0, 2, this.lineViewH));
    lineGeom.vertices.push(new THREE.Vector3(0, 500, this.lineViewH));

    const matGeom = new THREE.LineBasicMaterial({ color: color });
    this.linePlayer = new THREE.Line(lineGeom, matGeom);
    this.scene.add(this.linePlayer);

    this.addLife(this.scene, '', 0, 0, 0);



    this.singleStepMode = false;
    const that = this;
    const soldierloader = new GLTFLoader();
    soldierloader.load('assets/model/Soldier.glb', function (gltf) {
      that.loadedGLTF = gltf;
      that.clock.set('SoldierPlayer', new THREE.Clock());

      that.sizeOfNextStep.set('SoldierPlayer', 0);

      gltf.scene.scale.set(5, 5, 5);
      gltf.scene.rotateOnAxis(new THREE.Vector3(1, 0, 0), 90 * (Math.PI / 180));

      const modelp = gltf.scene;
      modelp.name = 'SoldierPlayer';
      that.model.set('SoldierPlayer', modelp);
      that.scene.add(modelp);



      const animations = gltf.animations;

      that.mixer.set('SoldierPlayer', new THREE.AnimationMixer(that.model.get('SoldierPlayer')));

      that.idleAction.set('SoldierPlayer', that.mixer.get('SoldierPlayer').clipAction(animations[0]));
      that.walkAction.set('SoldierPlayer', that.mixer.get('SoldierPlayer').clipAction(animations[3]));
      that.runAction.set('SoldierPlayer', that.mixer.get('SoldierPlayer').clipAction(animations[1]));

      that.actions.set('SoldierPlayer', [that.idleAction.get('SoldierPlayer'), that.walkAction.get('SoldierPlayer'), that.runAction.get('SoldierPlayer')]);

      that.activateAllActions('SoldierPlayer');

    });

    that.animate();

  }

  addLife(child, id, posX, posY, posZ) {


    const mLifeContainer = new THREE.MeshLambertMaterial({
      color: 0x000000,
      opacity: 0.2,
      transparent: true
    });
    const lifeGeomContainer = new THREE.CylinderGeometry(0.5, 0.5, 10, 10);
    const boxContainer = new THREE.Mesh(lifeGeomContainer, mLifeContainer);
    boxContainer.name = 'playerLifeContainer_' + id;
    boxContainer.rotation.z = this.toRad(90);
    boxContainer.position.y = posX - 7.5;
    boxContainer.position.x = posY + 0;
    boxContainer.position.z = posZ + 0.5;
    child.add(boxContainer);




    const mLife = new THREE.MeshLambertMaterial({
      color: 0xff0000,
      opacity: 0.9,
      transparent: true
    });
    const lifeGeom = new THREE.CylinderGeometry(0.5, 0.5, 10, 10);
    const box = new THREE.Mesh(lifeGeom, mLife);
    if (id !== null && id !== undefined && id !== '') {
      box.name = 'playerLife_' + id;
    } else {
      box.name = 'playerLife';
    }
    box.rotation.z = this.toRad(90);
    box.position.y = posX - 7.5;
    box.position.x = posY + 0;
    box.position.z = posZ + 0.5;
    child.add(box);
  }

  addName(child, name, id, color) {
    if (child === null) {
      child = this.scene;
    }
    const oldChildText = (<THREE.Mesh>child.getObjectByName(name));
    if (oldChildText === undefined || oldChildText === null) {
      const textGeo = new THREE.TextGeometry(name, {

        font: this.font,

        size: 1.8,
        height: 0.1,
        curveSegments: 0,

        bevelThickness: 1,
        bevelSize: 1,
        bevelEnabled: false

      });

      textGeo.computeBoundingBox();
      textGeo.computeVertexNormals();


      const materials = new THREE.LineBasicMaterial({
        color: +color
      });

      const textMesh = new THREE.Mesh(textGeo, materials);

      textMesh.rotation.x = 0;
      textMesh.rotation.y = Math.PI * 2;
      textMesh.name = 'playerName_' + id;

      child.add(textMesh);
    }
  }

  setPlayerName(name, color) {
    const oldTextMesh = (<THREE.Mesh>this.scene.getObjectByName('playerName'));
    this.scene.remove(oldTextMesh);
    const textGeo = new THREE.TextGeometry(name, {

      font: this.font,

      size: 1.8,
      height: 0.1,
      curveSegments: 0,

      bevelThickness: 1,
      bevelSize: 1,
      bevelEnabled: false

    });

    textGeo.computeBoundingBox();
    textGeo.computeVertexNormals();


    const materials = new THREE.LineBasicMaterial({
      color: +color
    });

    const textMesh = new THREE.Mesh(textGeo, materials);
    const centerOffset = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
    textMesh.position.x = centerOffset;
    textMesh.position.y = -6;
    textMesh.position.z = 0;

    textMesh.rotation.x = 0;
    textMesh.rotation.y = Math.PI * 2;
    textMesh.name = 'playerName';
    this.scene.add(textMesh);
  }

  addBody(child, color) {

    const matGeom = new THREE.LineBasicMaterial({ color: color });

    const body = new THREE.Geometry();
    body.vertices.push(new THREE.Vector3(0, 0, 3));
    body.vertices.push(new THREE.Vector3(0, 0, 6));
    const lineBody = new THREE.Line(body, matGeom);
    child.add(lineBody);


    const leftHand = new THREE.Geometry();
    leftHand.vertices.push(new THREE.Vector3(2, 0, 3));
    leftHand.vertices.push(new THREE.Vector3(0, 0, 6));
    const lineleftHand = new THREE.Line(leftHand, matGeom);
    child.add(lineleftHand);


    const rightHand = new THREE.Geometry();
    rightHand.vertices.push(new THREE.Vector3(-2, 0, 3));
    rightHand.vertices.push(new THREE.Vector3(0, 0, 6));
    const linerightHand = new THREE.Line(rightHand, matGeom);
    child.add(linerightHand);


    const leftLeg = new THREE.Geometry();
    leftLeg.vertices.push(new THREE.Vector3(2, 0, 0));
    leftLeg.vertices.push(new THREE.Vector3(0, 0, 3));
    const lineleftLeg = new THREE.Line(leftLeg, matGeom);
    child.add(lineleftLeg);


    const rightLeg = new THREE.Geometry();
    rightLeg.vertices.push(new THREE.Vector3(-2, 0, 0));
    rightLeg.vertices.push(new THREE.Vector3(0, 0, 3));
    const linerightLeg = new THREE.Line(rightLeg, matGeom);
    child.add(linerightLeg);
  }

  animate(): void {
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== 'loading') {
        this.render();
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this.render();
        });
      }

      window.addEventListener('resize', () => {
        this.resize();
      });
    });
  }



  public resetVisual() {
    this.refreshVisual();
    this.is3D = true;
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, 0, 100);
    this.controls.target.set(0, 50, 10);
    this.controls.update();
  }

  public highVisual() {
    this.refreshVisual();
    this.is3D = false;
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0, 0, 100);
    this.controls.target.set(0, 0, 10);
    this.controls.update();
  }

  public refreshVisual() {
    const keys = Array.from(this.enemies.keys());
    for (const key of keys) {
      this.enemies.delete(key);
    }
    const dkeys = Array.from(this.deaths.keys());
    for (const dkey of dkeys) {
      this.deaths.delete(dkey);
    }
    this.scene.remove(this.pivot);
    this.pivot = new THREE.Group();
    this.scene.add(this.pivot);
    this.scene.remove(this.pivot2);
    this.pivot2 = new THREE.Group();
    this.scene.add(this.pivot2);
    this.oldlista = new Map<string, List>();
  }

  render() {

    this.frameId = requestAnimationFrame(() => {
      this.render();
    });


    const keys = Array.from(this.mixer.keys());
    for (const key of keys) {



      this.idleWeight.set(key, this.idleAction.get(key).getEffectiveWeight());
      this.walkWeight.set(key, this.walkAction.get(key).getEffectiveWeight());
      this.runWeight.set(key, this.runAction.get(key).getEffectiveWeight());
      let mixerUpdateDelta = this.clock.get(key).getDelta();
      if (this.singleStepMode) {
        mixerUpdateDelta = (this.sizeOfNextStep.get(<string>key));
        this.sizeOfNextStep.set(<string>key, 0);
      }

      this.mixer.get(key).update(mixerUpdateDelta);
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  activateAllActions(id) {

    this.setWeight(this.idleAction.get(id), this.settings['modify idle weight']);
    this.setWeight(this.walkAction.get(id), this.settings['modify walk weight']);
    this.setWeight(this.runAction.get(id), this.settings['modify run weight']);


    this.actions.get(id).forEach(function (action) {

      action.play();

    });

  }

  setWeight(action, weight) {

    action.enabled = true;
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(weight);

  }

  prepareCrossFade(startAction, endAction, defaultDuration) {

    const duration = this.setCrossFadeDuration(defaultDuration);

    this.singleStepMode = false;
    this.unPauseAllActions();

    if (startAction === this.idleAction) {

      this.executeCrossFade(startAction, endAction, duration);

    } else {

      this.synchronizeCrossFade(startAction, endAction, duration);

    }

  }

  setCrossFadeDuration(defaultDuration) {

    if (this.settings['use default duration']) {

      return defaultDuration;

    } else {

      return this.settings['set custom duration'];

    }

  }

  deactivateAllActions() {

    this.actions.forEach(function (action) {

      action.stop();

    });

  }



  unPauseAllActions() {

    this.actions.forEach(function (action) {

      action.paused = false;

    });

  }

  pauseAllActions() {

    this.actions.forEach(function (action) {

      action.paused = true;

    });

  }

  pauseContinue() {

    if (this.singleStepMode) {

      this.singleStepMode = false;
      this.unPauseAllActions();

    } else {

      if (this.idleAction.paused) {

        this.unPauseAllActions();

      } else {

        this.pauseAllActions();

      }

    }

  }

  toSingleStepMode() {

    this.unPauseAllActions();

    this.singleStepMode = true;
    this.sizeOfNextStep = this.settings['modify step size'];

  }

  executeCrossFade(startAction, endAction, duration) {


    this.setWeight(endAction, 1);
    endAction.time = 0;


    startAction.crossFadeTo(endAction, duration, true);

  }



  synchronizeCrossFade(startAction, endAction, duration) {

    this.mixer.addEventListener('loop', onLoopFinished);

    const that = this;

    function onLoopFinished(event) {

      if (event.action === startAction) {

        that.mixer.removeEventListener('loop', onLoopFinished);

        that.executeCrossFade(startAction, endAction, duration);

      }

    }

  }
}
