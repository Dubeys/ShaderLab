class shaderSky extends THREE.ShaderMaterial{
    constructor({time=0,sunPosition=new THREE.Vector3(-0.3,0.4,-1),color = new THREE.Color(0xFFFEED), atmosphere= new THREE.Color(0x2671d3), horizon= new THREE.Color(0xa8cdff),horizonLine = new THREE.Color(0xbff6ff),sun = true}={}){

        super();

        this.side = THREE.BackSide;

        this.sunPos = sunPosition;

        let sunOn = sun ? 1 : 0;

        this.uniforms = {
                time: {value: time},
                uColor: {value: color},
                uHorColor: {value: horizon},
                uAtmColor: {value: atmosphere},
                uHorHardColor: {value: horizonLine},
                uSunPos: {value: sunPosition},
                sunInt: {value: 0}
            }

        this.vertexShader =

            `uniform float time;

    		varying vec3 vNormal;
            varying vec2 vUv;
            varying vec3 vViewPosition;

    		void main() {

                vUv = uv;
        		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        		vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        		vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        		vNormal = normalize( normalMatrix * normal );
                vViewPosition = - mvPosition.xyz;
        		// vPos = vec3((modelViewMatrix * vec4( position, 1.0 )).xyz);
                // cNormal = normalize( projectionMatrix * vec4(normal));

            }`

    	this.fragmentShader =

    		`uniform float time;
            uniform vec3 uColor;
            uniform vec3 uAtmColor;
            uniform vec3 uHorColor;
            uniform vec3 uHorHardColor;
            uniform vec3 uSunPos;
            uniform float sunInt;

    		varying vec3 vNormal;
    		varying vec3 vViewPosition;
    		varying vec2 vUv;

            vec4 circle(vec2 uv, vec2 pos, float rad, vec3 color) {
            	float d = length(pos - uv) - rad;
            	float t = clamp(d, 0.0, 1.0);
            	return vec4(color, 1.0 - t);
            }

    		void main() {
                vec3 nPos = normalize(-vViewPosition);
                vec3 fPos = nPos;
                nPos = 0.5 + (nPos * 0.5);
                vec3 gradient = vec3(0.0);
                vec4 gradient2 = vec4(0.0);
                vec3 colorAddition = vec3(0.0);
                vec3 sunPos = normalize(uSunPos);

                if(nPos.y > 0.49){
                    gradient = clamp(mix(uHorColor,uAtmColor,-2.0*0.5+nPos.y*2.0),0.0,1.0);
                }else{
                    gradient = clamp(mix(uHorColor,uAtmColor,2.0*0.5-nPos.y*2.0),0.0,0.1);
                }

                if(nPos.y > 0.49){
                    gradient2 = clamp(mix(vec4(gradient,0.0),vec4(uHorHardColor,1.0),10.0*0.6-nPos.y*10.0),0.0,1.0);
                }

                float dist = distance(sunPos,fPos);

                vec4 sun = vec4(0.0);
                vec4 sunColor = vec4(0.0);
                if(dist*30.0 < 1.0){
                    sun = vec4(1.0);
                    sunColor = vec4(uColor,1.);
                }

                float dist2 = distance(vec3(sunPos.x,0.0,sunPos.z),vec3(fPos.x*0.5+sunPos.x*0.5,fPos.y*10.0,fPos.z));
                dist = 0.5 / exp(log(dist)/7.0);
                dist2 = 0.2/ exp(log(dist2)/4.0);
                dist += dist2;
                dist = clamp(dist,0.0,1.0);

                vec4 mix1 = mix(vec4(gradient,1.0),gradient2,gradient2.a);
                vec4 rGradient = clamp(mix(vec4(mix1.rgb,0.0),vec4(uColor,1.0),dist),0.0,1.0);

                vec4 mix2 = mix(mix1,rGradient,rGradient.a*2.5 - 1.5);

                if(sun.r > 0.){
                    mix2 = mix(sun,sunColor,sunInt);
                }


    			gl_FragColor = vec4( mix2.rgb ,1.0);

    		}`
    }

    get horizonLine(){
        return this.uniforms.uHorHardColor.value
    }
    get horizon(){
        return this.uniforms.uHorColor.value
    }
    get sun(){
        return this.uniforms.sunInt.value
    }
    set sun(value){
        this.uniforms.sunInt.value = value
    }
    get sunColor(){
        return this.uniforms.uColor.value
    }
    get atmosphere(){
        return this.uniforms.uAtmColor.value
    }
}
