class shaderSky extends THREE.ShaderMaterial{
    constructor({time=0,sunPosition=new THREE.Vector3(-0.3,0.4,-1),color = new THREE.Color(0xFFFEED), atmosphere= new THREE.Color(0x2671d3), horizon= new THREE.Color(0xa8cdff),horizonLine = new THREE.Color(0xbff6ff),sun = true,camera}={}){

        super();

        this.side = THREE.BackSide;

        this.sunPos = sunPosition;

        if(camera){
            this.cameraLookAt = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
            this.camera = camera;
        }else{
            console.error('no camera provided');
        }

        let sunOn = sun ? 1 : 0;

        this.uniforms = {
                time: {value: time},
                uColor: {value: color},
                uHorColor: {value: horizon},
                uAtmColor: {value: atmosphere},
                uHorHardColor: {value: horizonLine},
                uSunPos: {value: sunPosition},
                sunInt: {value: 0},
                cameraLookAt: {value: this.cameraLookAt}
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
        		vNormal = normalize( normalMatrix * normal );
                vViewPosition = position;
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
            uniform vec3 cameraLookAt;

    		varying vec3 vNormal;
    		varying vec3 vViewPosition;
    		varying vec2 vUv;

            vec4 circle(vec2 uv, vec2 pos, float rad, vec3 color) {
            	float d = length(pos - uv) - rad;
            	float t = clamp(d, 0.0, 1.0);
            	return vec4(color, 1.0 - t);
            }

            vec3 mod289(vec3 x) {
              return x - floor(x * (1.0 / 239.0)) * 239.0;
            }

            vec2 mod289(vec2 x) {
              return x - floor(x * (1.0 / 289.0)) * 289.0;
            }

            vec3 permute(vec3 x) {
              return mod289(((x*34.0)+1.0)*x);
            }

            float snoise(vec2 v) {

              const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                                  0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                                 -0.577350269189626,  // -1.0 + 2.0 * C.x
                                  0.024390243902439); // 1.0 / 41.0
            // First corner
              vec2 i  = floor(v + dot(v, C.yy) );
              vec2 x0 = v -   i + dot(i, C.xx);

              vec2 i1;
              i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
              vec4 x12 = x0.xyxy + C.xxzz;
              x12.xy -= i1;

              i = mod289(i); // Avoid truncation effects in permutation
              vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            		+ i.x + vec3(0.0, i1.x, 1.0 ));

              vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
              m = m*m ;
              m = m*m ;
              vec3 x = 2.0 * fract(p * C.www) - 1.0;
              vec3 h = abs(x) - 0.5;
              vec3 ox = floor(x + 0.5);
              vec3 a0 = x - ox;
              m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
              vec3 g;
              g.x  = a0.x  * x0.x  + h.x  * x0.y;
              g.yz = a0.yz * x12.xz + h.yz * x12.yw;
              return 150.0 * dot(m, g);
            }

            float star(vec2 p) {
              return step(1.0, smoothstep(0.5, 1.1, snoise(p)));
            }

    		void main() {
                vec3 nPos = normalize( vViewPosition);
                vec3 fPos = nPos;
                nPos = 0.5 + (nPos * 0.5);
                vec3 gradient = vec3(0.0);
                vec4 gradient2 = vec4(0.0);
                vec3 colorAddition = vec3(0.0);
                vec3 sunPos = normalize(uSunPos);

                float nightdayIntensity = 0.2 + clamp(sunPos.y*.8,0.,1.);

                if(nPos.y > 0.49){
                    gradient = clamp(mix(uHorColor,uAtmColor,-2.0*0.5+nPos.y*2.0),0.0,1.0);
                }else{
                    gradient = clamp(mix(uHorColor,uAtmColor,2.0*0.5-nPos.y*2.0),0.0,0.1);
                }

                if(nPos.y > 0.49){
                    gradient2 = clamp(mix(vec4(gradient,0.0),vec4(uHorHardColor,1.0),10.0*0.6-nPos.y*10.0),0.0,1.0);
                }

                float s1 = star(vUv * 300.);
                float s2 = star(vUv * 500.5 + vec2(-20.0, 10.0));
                float s3 = star(vUv * 700.14 + vec2(-75.0, 25.0));
                vec3 starsLayer = vec3(s1 * 1. + s2 * .6 + s3 * .3 );

                gradient += starsLayer * clamp(1. - sunPos.y * 2.0, 0.0,1.0);

                float dist = distance(sunPos,fPos);

                vec4 sun = vec4(0.0);
                vec4 sunColor = vec4(0.0);
                if(dist*30.0 < 1.0){
                    sun = vec4(1.0);
                    sunColor = vec4(uColor,1.);
                }

                float distanceToCamera = (1.0 - clamp(distance(normalize(cameraLookAt),sunPos)*1.2,0.0,1.0)) * .3;

                float dist2 = distance(vec3(sunPos.x,0.0,sunPos.z),vec3(fPos.x*0.5+sunPos.x*0.5,fPos.y*10.0,fPos.z));
                dist = 0.5 * (1.0 + distanceToCamera) / exp(log(dist)/7.0);
                dist2 = 0.2 / exp(log(dist2)/4.0);
                dist += dist2;
                dist = clamp(dist,0.0,1.0);

                vec4 mix1 = mix(vec4(gradient,1.0),gradient2,gradient2.a * (1. - sunPos.y));

                vec4 rGradient = clamp(mix(vec4(mix1.rgb,0.0),vec4(uColor,1.0),dist),0.0,1.0);

                vec4 mix2 = mix(mix1,rGradient,rGradient.a*2.5 - 1.5);

                if(sun.r > 0.){
                    mix2 = mix(sun,sunColor,sunInt);
                }

    			gl_FragColor = vec4( mix2.rgb * (1.0 + distanceToCamera*4.0 * nightdayIntensity),1.0);

    		}`
    }

    update(clock){
        if(clock){
            this.uniforms.time.value = clock.getElapsedTime();
        }
        this.uniforms.cameraLookAt.value = new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion);
    }

    setTimeOfDay(time = 0, sunHue = [20,55] , sunSat = 1, atmHue = [195,230], atmSat = 1){ // 0 night - 1 noon | hue
        this.uniforms.uSunPos.value.y = -.1 + time;
        this.uniforms.sunInt.value = 1-time;
        const radial = ( sunHue[0] + time * (sunHue[1] - sunHue[0]) ) / 360;
        const radialSky = ( atmHue[0] + (1-time) * (atmHue[1] - atmHue[0]) ) / 360;
        this.uniforms.uColor.value.setHSL(radial, (.5 + (1-time)*.4) * sunSat, .5 + time * .4);
        this.uniforms.uHorHardColor.value.setHSL(radial, (.5 + (1-time)*.4) * sunSat, .2 + time * .75);
        this.uniforms.uHorColor.value.setHSL(radialSky, (.5 + (1-time)*.1) * atmSat, .15 + time * .5);
        this.uniforms.uAtmColor.value.setHSL(radialSky, (.5 + (1-time)*.1) * atmSat, time * .5);
    }

    setSunAngle(angle) {
        this.uniforms.uSunPos.value.x = Math.sin(( angle / 180 ) * Math.PI);
        this.uniforms.uSunPos.value.z = Math.cos((angle / 180 ) * Math.PI);
    }

    getLightInfo(){
        const position = this.uniforms.uSunPos.value.clone();
        const intensity = this.uniforms.uSunPos.value.y > 0 ? this.uniforms.uSunPos.value.y * .5 + .5 : 0;
        position.normalize();
        position.multiplyScalar(2000);
        const color = this.uniforms.uColor.value.clone();
        return {position: position, intensity: intensity,color: color};
    }

    getFogColor(){
        let fog = this.uniforms.uHorHardColor.value.clone();
        let alpha = this.uniforms.cameraLookAt.value.distanceTo(this.uniforms.uSunPos.value) * 1.2;
        alpha = alpha > 1 ? 1 : alpha < 0 ? 0 : alpha;
        fog.lerp(this.uniforms.uHorColor.value,alpha * .5 * (1 + this.uniforms.uSunPos.value.y*.8));
        fog.multiplyScalar(1 + (1 - alpha)*1.3);
        return fog.clone();
    }

    get sunPosition(){
        return this.uniforms.uSunPos.value;
    }

    set sunPosition(value){
        this.uniforms.uSunPos.value = value;
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
