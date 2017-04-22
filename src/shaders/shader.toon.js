class shaderToon extends THREE.ShaderMaterial{
    constructor({color,shadowColor,colorMap,normalMap}){

        super();
        let shadow = new THREE.Color(shadowColor) || new THREE.Color('rgb(30,30,30)');

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
                uShadowColor: {value: shadow},
                color: {value: new THREE.Color(color)},
                colorMapEnabled: {value: colorMapEnabled},
                colorMap: {type: 't',value: colorMap},
                normalMap: {type: 't',value: normalMap},
                normalScale: {value: new THREE.Vector2(1,1)}
            }
        ]);

        if(colorMap){
            this.uniforms.repeat = {value: colorMap.repeat};
        }

        this.vertexShader = [

    		"varying vec3 vNormal;",
    		// "varying vec3 cNormal;",
            // "varying vec3 vPos;",
            "varying vec2 vUv;",
            "varying vec3 vViewPosition;",

            THREE.ShaderChunk['shadowmap_pars_vertex'],

    		"void main() {",

                "vUv = uv;",
        		"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
        		"vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",
        		"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
                THREE.ShaderChunk['shadowmap_vertex'],
        		"vNormal = normalize( normalMatrix * normal );",
                "vViewPosition = - mvPosition.xyz;",
        		// "vPos = vec3((modelViewMatrix * vec4( position, 1.0 )).xyz);",
        		// "cNormal = normalize( projectionMatrix * vec4(normal));",

            "}"

    	].join("\n");

    	this.fragmentShader = [

    		"uniform vec3 uShadowColor;",
            "uniform vec3 color;",
            "uniform bool colorMapEnabled;",
            "uniform sampler2D colorMap;",
            "uniform vec2 repeat;",

            "struct DirectionalLight {",
                "vec3 direction;",
                "vec3 color;",
                "int shadow;",
                "float shadowBias;",
                "float shadowRadius;",
                "vec2 shadowMapSize;",
            "};",

            "struct HemisphereLight {",
                "vec3 skyColor;",
                "vec3 direction;",
                "vec3 groundColor;",
            "};",

            "uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];",
            "#if NUM_HEMI_LIGHTS > 0",
            "uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];",
            "#endif",

    		"varying vec3 vNormal;",
    		"varying vec3 vPos;",
    		"varying vec3 vViewPosition;",
    		"varying vec2 vUv;",

            // THREE.ShaderChunk['lights_pars'],
            THREE.ShaderChunk['packing'],
            THREE.ShaderChunk['normalmap_pars_fragment'],
            THREE.ShaderChunk['shadowmap_pars_fragment'],
            THREE.ShaderChunk['shadowmask_pars_fragment'],

    		"void main() {",

                THREE.ShaderChunk['normal_flip'],
                THREE.ShaderChunk['normal_fragment'],
                "vec3 shadowColor = uShadowColor;",
                "#if NUM_HEMI_LIGHTS > 0",
                    "for(int i = 0; i < NUM_HEMI_LIGHTS; i++){",
                        "float dotNL = dot( normal, hemisphereLights[i].direction );",
                		"float hemiDiffuseWeight = 0.5 * dotNL + 0.5;",
                		"vec3 irradiance = mix( hemisphereLights[i].groundColor, hemisphereLights[i].skyColor, hemiDiffuseWeight );",
                		"shadowColor += irradiance;",
                    "}",
                "#endif",
                "vec3 outgoingLight = vec3(1.0);",
                "float colorInt = length(directionalLights[0].color);",
                "vec3 fColor = color * directionalLights[0].color;",
                // "fColor = mix(fColor, directionalLights[0].color,colorInt);",
                "vec3 finalColor = fColor;",
                "if(colorMapEnabled){",
                    "fColor = texture2D(colorMap,vUv*repeat).xyz;",
                "}",
    			// compute direction to light
                "shadowColor = shadowColor ;",
                "float diffuse = 0.0;",
                // loop for THREE Lights
                // "for(int l = 0; l < NUM_POINT_LIGHTS; l++){",
                    // "vec3 lDirection = vPos - pointLights[0].position;",
                    // "vec3 lVector = normalize( lDirection.xyz );",
                    // "diffuse += dot( normal,-lVector );",
                    "diffuse += dot( normal,directionalLights[0].direction );",
                // "};",
    			"if ( diffuse > 0.99 ) { finalColor = vec3(1.0) * colorInt * 3.; }",
    			"else if ( diffuse > 0.5 ) { finalColor = fColor; }",
    			"else if ( diffuse > -0.1 ) { finalColor = clamp(fColor,0.,1.) * (shadowColor + .5); }",
    			"else { finalColor = clamp(fColor,0.,1.) * shadowColor; }",

    			"gl_FragColor = vec4( finalColor*clamp(getShadowMask(),0.3,1.0),1.0);",

    		"}"

    	].join("\n")

        if(normalMap){
            this.fragmentShader = "#define USE_NORMALMAP \n" + this.fragmentShader
        }
    }
}
