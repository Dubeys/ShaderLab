class App {
    constructor(lib,{width = window.innerWidth,height = window.innerHeight,precision = 'highp'} = {}){

        this.width = width;
        this.height = height;

        this.renderer = new THREE.WebGLRenderer({antialias: true,precision: precision});
        this.renderer.setSize(width,height);
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

        this.post.renderTarget = new THREE.WebGLRenderTarget(size.width*2 , size.height*2,{
            minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
        })
        this.post.readTarget = new THREE.WebGLRenderTarget(size.width*2 , size.height*2,{
            minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
        })
        this.post.depthTarget = new THREE.WebGLRenderTarget(size.width , size.height,{
            minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
        })

        this.post.depthTarget.depthTexture = new THREE.DepthTexture(size.width,size.height,THREE.UnsignedIntType);

        this.post.material = new shaderPost(); // custom shader
        this.post.materialVertical = new shaderPostVBlur(); // custom shader

        this.post.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        this.post.scene = new THREE.Scene();

    	this.post.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
        this.post.quad.frustumCulled = false; // Avoid getting clipped

        this.post.scene.add( this.post.quad );

    }

    init(lib){

        document.body.appendChild(this.renderer.domElement);
        this.inputs = new Inputs();
        this.inputs.onResize(App.setSize.bind(this));
        this.lib = lib;
        this.lib.nightgrade.raw.minFilter = THREE.NearestFilter;

        this.level = new Scene(this.camera,lib,this.inputs);

        console.log(this.renderer.info)

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
        this.postProcess();
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

    postProcess(opts){

        const size = this.renderer.getSize();

        this.post.renderTarget.setSize(size.width*2,size.height*2);
        this.post.depthTarget.setSize(size.width,size.height);
        this.post.readTarget.setSize(size.width,size.height);
        this.level.children[0].visible = false;
        this.renderer.render(this.level,this.camera,this.post.depthTarget,true);
        this.level.children[0].visible = true;
        this.renderer.render(this.level,this.camera,this.post.renderTarget,true);

        this.post.materialVertical.uniforms.render.value = this.post.renderTarget.texture;
        this.post.materialVertical.uniforms.renderDepth.value = this.post.depthTarget.depthTexture;
        this.post.materialVertical.uniforms.cameraNear.value = this.camera.near;
        this.post.materialVertical.uniforms.cameraFar.value = 4000;
        this.post.materialVertical.uniforms.size.value.set(size.width* 1.,size.height*1.);

        this.post.quad.material = this.post.materialVertical;

        this.renderer.render(this.post.scene,this.post.camera,this.post.readTarget,true);

        this.post.material.uniforms.render.value = this.post.readTarget.texture;
        this.post.material.uniforms.renderDepth.value = this.post.depthTarget.depthTexture;
        this.post.material.uniforms.lut.value = this.lib.nightgrade.raw;
        this.post.material.uniforms.cameraNear.value = this.camera.near;
        this.post.material.uniforms.cameraFar.value = 4000;
        this.post.material.uniforms.size.value.set(size.width* 1.,size.height*1.);

        this.post.quad.material = this.post.material;

        this.renderer.render(this.post.scene,this.post.camera);

    }

    static setSize(e){
        this.renderer.setSize(e.target.innerWidth,e.target.innerHeight);
        this.camera.aspect = e.target.innerWidth/e.target.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}
