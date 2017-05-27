class PostProcess {
    constructor(width, height,depth){
        this.renderTarget = new THREE.WebGLRenderTarget(width , height,{
            minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
        })

        this.readTarget = new THREE.WebGLRenderTarget(width , height,{
            minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
        })

        this.depthTarget = new THREE.WebGLRenderTarget(width , height,{
            minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBAFormat,
			stencilBuffer: false
        })

        this.depthTarget.depthTexture = new THREE.DepthTexture(width,height,THREE.UnsignedIntType);

        this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        this.scene = new THREE.Scene();

        this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
        this.quad.frustumCulled = false; // Avoid getting clipped

        this.scene.add( this.quad );

        this.effect = [];

        this.depthRender = depth;
        this.hiddenOnDepthWrite = [];
    }

    hideOnDepthRender(object){
        this.hiddenOnDepthWrite.push(object);
    }

    addShader(shader,toScreen,before,after,uniformsToUpdate){
        this.effect.push({shader: shader, toScreen: toScreen,before: before,after:after,uniformsToUpdate: uniformsToUpdate});
    }

    render(renderer,scene,camera){
        const size = renderer.getSize();

        //depth render if needed
        if(this.depthRender){

            for(let i in this.hiddenOnDepthWrite){
                this.hiddenOnDepthWrite[i].visible = false;
            }
            renderer.render(scene,camera,this.depthTarget,true);

            for(let i in this.hiddenOnDepthWrite){
                this.hiddenOnDepthWrite[i].visible = true;
            }

        }

        // scene initial render
        renderer.render(scene,camera,this.renderTarget,true);

        //loop trough all added effects
        for(let i = 0; i < this.effect.length; i++){

            //before effect render callback
            if(this.effect[i].before){
                this.effect[i].before();
            }

            //set render texture
            this.effect[i].shader.uniforms.render.value = this.renderTarget.texture;

            //set depth texture if needed
            if(this.effect[i].shader.uniforms.renderDepth){
                this.effect[i].shader.uniforms.renderDepth.value = this.depthTarget.depthTexture;
            }

            // set size uniform if needed
            if(this.effect[i].shader.uniforms.size){
                this.effect[i].shader.uniforms.size.value = new THREE.Vector2(size.width,size.height);
            }

            // update special uniforms if needed
            if(this.effect[i].uniformsToUpdate){
                for(let i in uniformsToUpdate){
                    this.effect[i].shader.uniforms[i].value = uniformsToUpdate[i];
                }
            }

            //apply shader to render quad;
            this.quad.material = this.effect[i].shader;

            //render to screen
            if(!this.effect[i].toScreen){
                renderer.render(this.scene,this.camera,this.readTarget,true);

                // after effect render callback
                if(this.effect[i].after){
                    this.effect[i].after();
                }

                //swap
                const tempTarget = this.renderTarget.clone();
                this.renderTarget.copy(this.readTarget);
                this.readTarget.copy(tempTarget);

            }else{
                renderer.render(this.scene,this.camera);
            }

        }

    }
}
