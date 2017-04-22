class Scene extends THREE.Scene{
    constructor(camera,lib,inputs,name = "untitled"){
        super();

        this.name = name;

        this.inputs = inputs;
        this.lib = lib;

        this.camera = camera;
        camera.position.z = 100;

        this.prop = {};

        this.fog = new THREE.FogExp2(0xFFFFFF,0.002);

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

        const skyBox = new THREE.BoxGeometry(2000,2000,2000);

        const skyShader = {
            color: new THREE.MeshBasicMaterial({color: 0x000000,side: THREE.BackSide}),
            firewatch: new shaderSky()
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
                this.material.uniforms.uSunPos.value.x = Math.sin(clock.getElapsedTime()/2);
                this.material.uniforms.uSunPos.value.z = Math.cos(clock.getElapsedTime()/2);
                this.material.uniforms.uSunPos.value.y = -.1 + this.nightday ;
                this.material.uniforms.sunInt.value = 1-this.nightday;

                const radial = ( 20 + this.nightday * 35 ) / 360;
                const radialSky = ( 195 + (1-this.nightday) * 35 ) / 360;
                this.material.uniforms.uColor.value.setHSL(radial, .5 + (1-this.nightday)*.4, .5 + this.nightday * .4);
                this.material.uniforms.uHorHardColor.value.setHSL(radial, .5 + (1-this.nightday)*.4, .2 + this.nightday * .75);
                this.material.uniforms.uHorColor.value.setHSL(radialSky, .5 + (1-this.nightday)*.1, .15 + this.nightday * .5);
                this.material.uniforms.uAtmColor.value.setHSL(radialSky, .5 + (1-this.nightday)*.1, this.nightday * .5);
            }else{
                this.material.color.r = this.plainColor[0] / 255;
                this.material.color.g = this.plainColor[1] / 255;
                this.material.color.b = this.plainColor[2] / 255;

                this.material.needsUpdate = true;
            }
        }

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(3000,3000),
            new THREE.MeshPhongMaterial({color: 0xCCBB88})
        )

        ground.rotation.x = -Math.PI * .5;
        ground.position.y = -20;
        ground.position.z = -1300;

        const light = new THREE.DirectionalLight(0xFFFFFF,1);
        light.position.set(-10,20,15);
        light.follow = exampleSkybox;

        light.update = function(){
            if(this.follow.material.uniforms){
                this.position.copy(this.follow.material.uniforms.uSunPos.value)
                this.intensity = this.follow.material.uniforms.uSunPos.value.y > 0 ? this.follow.material.uniforms.uSunPos.value.y * .5 + .5 : 0;
                this.position.normalize();
                this.position.multiplyScalar(2000);
                this.color.copy(this.follow.material.uniforms.uColor.value);
            }else{
                this.position.set(-10,20,15);
                this.intensity = 1;
                this.color.setHex(0xFFFFFF);
            }
        }

        const hemi = new THREE.HemisphereLight(0x88BBFF,0xCCBB88,.3);
        hemi.follow = exampleSkybox;

        hemi.update = function(){
            if(this.follow.material.uniforms){
                this.intensity = this.follow.material.uniforms.uSunPos.value.y * .5;
            }else{
                this.intensity = .3;
            }
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
                    this.fog.color.copy(this.children[i].material.uniforms.uHorHardColor.value);
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
