class Scene extends THREE.Scene{
    constructor(camera,lib,inputs,name = "untitled"){
        super();

        this.name = name;

        this.inputs = inputs;
        this.lib = lib;

        this.camera = camera;
        camera.position.z = 100;

        this.prop = {};

        this.fog = new THREE.FogExp2(0xFFFFFF,0.001);

        const torusKnot = new THREE.TorusKnotGeometry(10,3.5,120,20);

        const objectShader = {
            toon: new shaderToon({color: 0xFFFFFF,shadowColor: 0x000000}),
            basic: new THREE.MeshPhongMaterial({color: 0xF0F0F0})
        };

        const exampleObject = new THREE.Mesh(torusKnot,objectShader.toon);
        exampleObject.torusShader = 'toon';
        exampleObject.shaders = objectShader;
        exampleObject.update = function(){
            this.rotateY(-.05);
            this.material = this.shaders[this.torusShader];
        }

        const skyBox = new THREE.IcosahedronGeometry(2000,1);

        this.lib.clouds.raw.wrapS = THREE.RepeatWrapping;
        this.lib.clouds.raw.wrapT = THREE.RepeatWrapping;
        console.log(this.lib.clouds.raw)

        const skyShader = {
            color: new THREE.MeshBasicMaterial({color: 0x000000,side: THREE.BackSide}),
            firewatch: new shaderSky({camera: this.camera,clouds: this.lib.clouds.raw})
        };

        const exampleSkybox = new THREE.Mesh(skyBox,skyShader.color);
        exampleSkybox.skyShader = 'firewatch';
        exampleSkybox.name = 'sky';
        exampleSkybox.shaders = skyShader;
        exampleSkybox.plainColor = [0,0,0];
        exampleSkybox.nightday = 0;
        exampleSkybox.update = function(clock){
            this.material = this.shaders[this.skyShader];
            if(this.skyShader === 'firewatch'){

                this.position.copy(this.material.camera.position);
                this.material.setSunAngle(180);
                this.material.update(clock);
                this.material.setTimeOfDay(this.nightday, [20,55] , 1, [195,230], 1);
            }else{
                this.material.color.r = this.plainColor[0] / 255;
                this.material.color.g = this.plainColor[1] / 255;
                this.material.color.b = this.plainColor[2] / 255;

                this.material.needsUpdate = true;
            }
        }

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(4000,4000,20,20),
            new THREE.MeshPhongMaterial({color: 0xCCBB88,side: THREE.DoubleSide,displacementMap: lib.hm_mountain.raw, displacementScale: 400,shading: THREE.FlatShading})
        )

        ground.rotation.x = -Math.PI * .5;
        ground.position.y = -50;
        // ground.position.z = -1300;

        const light = new THREE.DirectionalLight(0xFFFFFF,1);
        light.position.set(-10,20,15);
        light.follow = exampleSkybox;

        light.update = function(){
            if(this.follow.material.uniforms){

                const info = this.follow.material.getLightInfo();
                this.position.copy(info.position);
                this.intensity = info.intensity;
                this.color.copy(info.color);
            }else{
                this.position.set(-10,20,15);
                this.intensity = 1;
                this.color.setHex(0xFFFFFF);
            }
        }

        const hemi = new THREE.HemisphereLight(0x88BBFF,0xCCBB88,.3);
        hemi.follow = [exampleSkybox,this.fog];

        hemi.update = function(){
            if(this.follow[0].material.uniforms){
                this.intensity = this.follow[0].material.uniforms.uSunPos.value.y * .3;
            }else{
                this.intensity = .3;
            }

            this.color = this.follow[1].color.clone();
        }

        this.addChild(exampleSkybox);
        this.addChild(light);
        this.addChild(hemi);
        this.addChild(exampleObject);
        this.addChild(ground);

        this.addProperty('firstUpdate',true);
        this.addProperty('stopped',false);
        this.addProperty('editVector',new THREE.Vector3(0,0,0));

        this.clock = new THREE.Clock();
        this.clock.autoStart = false;

        this.gui = new dat.GUI();
        this.gui.add(exampleObject,'torusShader',['toon','basic']);
        this.gui.add(exampleSkybox,'skyShader',['firewatch','color']);
        this.gui.add(exampleSkybox,'nightday',0,1);
        this.gui.addColor(exampleSkybox,'plainColor');
    }

    update(){
        if(this.prop.firstUpdate){
            this.first();
            this.prop.firstUpdate = false;
        }

        for(let i = 0; i < this.children.length; i++){
            if(this.children[i].update){
                this.children[i].update(this.clock);
            }

            if(this.children[i].name === "sky" ){
                if(this.children[i].material.uniforms){
                    this.fog.color = this.children[i].material.getFogColor();

                }else{
                    this.fog.color.copy(this.children[i].material.color);

                }
            }
        }

        return this.prop.stopped;
    }

    afterInitRender(){

    }

    first(){
        this.clock.start();
    }

    addChild(object,obstacle = false,transparent = false){
        if(transparent){
            if(obstacle){
                this.player.addObstacle(object);
            }
        }else{
            this.add(object);
            if(obstacle){
                this.player.addObstacle(object);
            }
        }
    }

    removeChild(child){
        for(let i in this.children){
            if(child == this.children[i]){
                this.remove(child);
                this.player.removeObstacle(child);
            }
        }
    }

    addProperty(name,value){
        this.prop[name] = value
    }

    stop(){
        this.prop.stopped = true;
    }

    get cameraX(){
        return this.camera.position.x;
    }
    get cameraY(){
        return this.camera.position.y;
    }
    set cameraX(value){
        this.camera.position.x = value;
    }
    set cameraY(value){
        this.camera.position.y = value;
    }

}
