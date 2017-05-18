class shaderToon extends THREE.ShaderMaterial{
    constructor({color = 0xFFFFFF,shadowColor = 'rgb(30,30,30)',colorMap,normalMap,opacity = 1} = {}){

        super();

        this.side = THREE.DoubleSide;
        this.lights = true;

        let colorMapEnabled = true;
        if(!colorMap){
            colorMapEnabled = false;
        }

        //enabling GL_OES_standard_derivatives
        this.extensions.derivatives = true;

        this.uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib['lights'],
            THREE.UniformsLib[ "shadowmap" ],
            {
                uShadowColor: {value: new THREE.Color(shadowColor)},
                color: {value: new THREE.Color(color)},
                colorMapEnabled: {value: colorMapEnabled},
                colorMap: {type: 't',value: colorMap},
                normalMap: {type: 't',value: normalMap},
                normalScale: {value: new THREE.Vector2(1,1)},
                opacity: {value: opacity}
            }
        ]);

        if(colorMap){
            this.uniforms.repeat = {value: colorMap.repeat};
        }

        this.vertexShader = `

    		varying vec3 vNormal;
    		// varying vec3 cNormal;
            // varying vec3 vPos;
            varying vec2 vUv;
            varying vec3 vViewPosition;

            #include <shadowmap_pars_vertex>

    		void main() {

                vUv = uv;
        		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        		vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                #include <shadowmap_vertex>
        		vNormal = normalize( normalMatrix * normal );
                vViewPosition = mvPosition.xyz;
        		// "vPos = vec3((modelViewMatrix * vec4( position, 1.0 )).xyz);
        		// "cNormal = normalize( projectionMatrix * vec4(normal));

            }

        `

    	this.fragmentShader = `

    		uniform vec3 uShadowColor;
            uniform vec3 color;
            uniform bool colorMapEnabled;
            uniform sampler2D colorMap;
            uniform vec2 repeat;
            uniform float opacity;

            struct DirectionalLight {
                vec3 direction;
                vec3 color;
                int shadow;
                float shadowBias;
                float shadowRadius;
                vec2 shadowMapSize;
            };

            struct PointLight {
                vec3 position;
                vec3 color;
                float distance;
                int shadow;
                float shadowBias;
                float shadowRadius;
                vec2 shadowMapSize;
            };

            struct HemisphereLight {
                vec3 skyColor;
                vec3 direction;
                vec3 groundColor;
            };

            #if NUM_DIR_LIGHTS > 0
            uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
            #endif
            #if NUM_POINT_LIGHTS > 0
            uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
            #endif
            #if NUM_HEMI_LIGHTS > 0
            uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
            #endif

    		varying vec3 vNormal;
    		varying vec3 vViewPosition;
    		varying vec2 vUv;

            #include <packing>
            #include <normalmap_pars_fragment>
            #include <shadowmap_pars_fragment>
            #include <shadowmask_pars_fragment>

    		void main() {

                #include <normal_flip>
                #include <normal_fragment>
                vec3 shadowColor = uShadowColor;

                vec3 outgoingLight = vec3(1.0);

                // float colorInt = length(directionalLights[0].color);
                float colorInt = 0.;

                // vec3 fColor = color * directionalLights[0].color;
                vec3 fColor = color;

                if(colorMapEnabled){
                    fColor = texture2D(colorMap,vUv*repeat).xyz;
                }

                float shadowMask = getShadowMask();

                float diffuse = 0.0;

                #if NUM_POINT_LIGHTS > 0
                for(int l = 0; l < NUM_POINT_LIGHTS; l++){
                    vec3 lDirection = vViewPosition - pointLights[l].position;
                    vec3 lVector = normalize( lDirection.xyz );
                    float dotLight = dot( normal,-lVector );
                    float d = length(lDirection) / pointLights[l].distance;
                    diffuse += clamp(dotLight,0.,1.) * clamp(1./(d*d),0.,1.);
                    // fColor *= pointLights[l].color * clamp(1. - length(lDirection) * .0001, .5, 1.);
                    fColor *= pointLights[l].color;
                };
                #endif

                #if NUM_DIR_LIGHTS > 0
                for(int l = 0; l < NUM_POINT_LIGHTS; l++){
                    float dotLight = dot( normal,directionalLights[l].direction )
                    diffuse += clamp(dotLight,0.,1.);
                    fColor *= directionalLights[l].color
                };
                #endif

                #if NUM_HEMI_LIGHTS > 0
                    for(int i = 0; i < NUM_HEMI_LIGHTS; i++){
                        float dotNL = dot( normal, hemisphereLights[i].direction );
                		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
                		vec3 irradiance = mix( hemisphereLights[i].groundColor, hemisphereLights[i].skyColor, hemiDiffuseWeight );
                		shadowColor += irradiance;
                    }
                #endif

                vec3 finalColor = fColor;

    			if ( diffuse > 0.99 ) { finalColor = vec3(1.0) * clamp(length(fColor) * 10., 0.,1.) ; }
    			else if ( diffuse > 0.5 ) { finalColor = fColor; }
    			else if ( diffuse > 0.0 ) { finalColor = clamp(fColor,0.,1.) * (shadowColor + .5); }
    			else { finalColor = clamp(fColor,0.,1.) * shadowColor; }
    			finalColor = mix(clamp(fColor,0.,1.) * shadowColor,finalColor,shadowMask);

    			gl_FragColor = vec4( finalColor,clamp(opacity,0.,1.));

    		}
        `

        if(normalMap){
            this.fragmentShader = "#define USE_NORMALMAP \n" + this.fragmentShader
        }

    }

    set map(img){
        this.uniforms.colorMap.value = img;
        this.uniforms.colorMapEnabled.value = true;
    }
}
