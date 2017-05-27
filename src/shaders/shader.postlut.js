class shaderPostLut extends THREE.ShaderMaterial{
    constructor({lut}){
        super();

        this.uniforms = {
            render: {value: null},
            lut: {value: lut || null}
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
            uniform sampler2D render;
            uniform sampler2D lut;

            varying vec2 vUv;

            // Ref: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#No_3D_Texture_support
            vec4 sampleAs3DTexture( sampler2D tex, vec3 texCoord, float size ) {
              float sliceSize = 1.0 / size;                         // space of 1 slice
              float slicePixelSize = sliceSize / size;              // space of 1 pixel
              float sliceInnerSize = slicePixelSize * (size - 1.0); // space of size pixels
              float zSlice0 = min(floor(texCoord.z * size), size - 1.0);
              float zSlice1 = min(zSlice0 + 1.0, size - 1.0);
              float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
              float s0 = xOffset + (zSlice0 * sliceSize);
              float s1 = xOffset + (zSlice1 * sliceSize);
              vec4 slice0Color = texture2D(tex, vec2(s0, texCoord.y));
              vec4 slice1Color = texture2D(tex, vec2(s1, texCoord.y));
              float zOffset = mod(texCoord.z * size, 1.0);
              return mix(slice0Color, slice1Color, zOffset);
            }

            void main(){
                vec4 image = texture2D(render,vUv);
                image.y = 1. - image.y;
                vec4 colorCorect = sampleAs3DTexture(lut,image.xyz,16.);
                gl_FragColor = colorCorect;
            }
        `


    }

    set lut(img){
        this.uniforms.lut.value = img;
    }

    set render(img){
        this.uniforms.render.value = img;
    }
}
