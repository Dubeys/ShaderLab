class App {
    constructor(lib,{width = window.innerWidth,height = window.innerHeight,precision = 'highp'} = {}){

        this.width = width;
        this.height = height;

        this.renderer = new THREE.WebGLRenderer({antialias: true,precision: precision});
        this.renderer.setSize(width,height);
        // this.renderer.setPixelRatio(2);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.autoClear = false;
        // this.renderer.setClearColor(0xCCCCFF);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.shadowMapWidth = 4096;
        this.renderer.shadowMapHeight = 4096;

        this.camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.01,10000);
        this.cameraTarget = new THREE.Vector2(Math.PI/2,-Math.PI/2);
        // this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.mirror = new THREE.CubeCamera(1,50000,1024);

        this.clock = new THREE.Clock();

        this.post = {};

        const size = this.renderer.getSize();

        this.post = new PostProcess(size.width * 2, size.height * 2,false);

    }

    init(lib){

        document.body.appendChild(this.renderer.domElement);
        this.inputs = new Inputs();
        this.inputs.onResize(App.setSize.bind(this));
        this.lib = lib;

        this.level = new Scene(this.camera,lib,this.inputs);

        console.log(this.renderer.info)

        this.post.addShader(new shaderPostLut({lut: this.lib.neutralgrade.raw}),true);

        this.render();
        this.level.afterInitRender();
        this.run();

    }

    run(){
        requestAnimationFrame(this.run.bind(this));

        this.level.update();
        this.cameraControlsUpdate();

        this.render();
    }

    render(){
        this.renderer.clear();
        this.post.render(this.renderer,this.level,this.camera);
    }

    cameraControlsUpdate(){

        if(this.inputs.clickActive){
            this.cameraTarget.y += this.inputs.mouse.deltaX*5;
            this.cameraTarget.x += -this.inputs.mouse.deltaY*2;
        }

        const vector = new THREE.Vector3(
            Math.cos(this.cameraTarget.y) * Math.sin(this.cameraTarget.x),
            Math.cos(this.cameraTarget.x),
            Math.sin(this.cameraTarget.y) * Math.sin(this.cameraTarget.x)
        ).multiplyScalar(2000);
        this.camera.lookAt(vector);
    }

    static setSize(e){
        this.renderer.setSize(e.target.innerWidth,e.target.innerHeight);
        this.camera.aspect = e.target.innerWidth/e.target.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
