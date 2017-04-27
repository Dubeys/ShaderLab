class shaderPostVBlur extends THREE.ShaderMaterial{
    constructor(){
        super();

        this.uniforms = {
            render: {value: null},
            renderDepth: {value: null},
            cameraNear: {value: null},
            cameraFar: {value: null},
            size: {value: new THREE.Vector2()}
        }

        this.vertexShader =

        `
            varying vec2 vUv;

            void main(){
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `

        this.fragmentShader =

        `
            #include <packing>

            uniform sampler2D render;
            uniform sampler2D renderDepth;
            uniform float cameraNear;
            uniform float cameraFar;

            uniform vec2 size;

            varying vec2 vUv;

            vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
              vec4 color = vec4(0.0);
              vec2 off1 = vec2(1.3846153846) * direction;
              vec2 off2 = vec2(3.2307692308) * direction;
              color += texture2D(image, uv) * 0.2270270270;
              color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
              color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
              color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
              color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
              return color;
            }

            float readDepth(sampler2D tDepth,vec2 coord,float cameraNear, float cameraFar){
                float fragCoordZ = texture2D(tDepth, coord).x;
				float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
				return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
            }

            void main(){
                float depth = readDepth(renderDepth,vUv,cameraNear,cameraFar);
                vec4 color = texture2D(render,vUv);
                vec4 blurredImage = vec4(0.0);
                if(depth >= 1.0){
                    blurredImage = blur9(render,vUv,size,vec2(depth ))*.5;
                    blurredImage += blur9(render,vUv,size,vec2(-depth ))*.5;
                }else{
                    blurredImage = blur9(render,vUv,size,vec2(depth * 2.5))*.5;
                    blurredImage += blur9(render,vUv,size,vec2(-depth * 2.5))*.5;
                }
                gl_FragColor = blurredImage;
            }
        `


    }
}
