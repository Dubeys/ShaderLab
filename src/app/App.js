class App {
    constructor(lib,{width = window.innerWidth,height = window.innerHeight,precision = 'highp'} = {}){

        this.width = width;
        this.height = height;

        this.renderer = new THREE.WebGLRenderer({antialias: true,precision: precision});
        this.renderer.setSize(width,height);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.autoClear = false;
        // this.renderer.setClearColor(0xCCCCFF);

        this.renderer.setPixelRatio(2);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.shadowMapWidth = 4096;
        // this.renderer.shadowMapHeight = 4096;

        this.camera = new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.01,10000);
        this.mirror = new THREE.CubeCamera(1,50000,1024);

        this.postProcess = false;

        this.clock = new THREE.Clock();

    }

    init(lib){

        document.body.appendChild(this.renderer.domElement);
        this.inputs = new Inputs();
        this.inputs.onResize(App.setSize.bind(this));

        this.level = new Scene(this.camera,lib,this.inputs);

        console.log(this.renderer.info)

        this.render();
        this.level.afterInitRender();
        this.run();

    }

    run(){
        requestAnimationFrame(this.run.bind(this));

        this.level.update();

        this.render();
    }

    render(){
        this.renderer.clear();
        this.renderer.setScissorTest(false);
        this.renderer.render(this.level,this.camera);
    }

    static setSize(e){
        this.renderer.setSize(e.target.innerWidth,e.target.innerHeight);
        this.camera.aspect = e.target.innerWidth/e.target.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
