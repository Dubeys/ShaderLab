"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PostProcess = function () {
    function PostProcess(width, height, depth) {
        _classCallCheck(this, PostProcess);

        this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        this.readTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        this.depthTarget = new THREE.WebGLRenderTarget(width, height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        this.depthTarget.depthTexture = new THREE.DepthTexture(width, height, THREE.UnsignedIntType);

        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new THREE.Scene();

        this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
        this.quad.frustumCulled = false; // Avoid getting clipped

        this.scene.add(this.quad);

        this.effect = [];

        this.depthRender = depth;
        this.hiddenOnDepthWrite = [];
    }

    _createClass(PostProcess, [{
        key: "hideOnDepthRender",
        value: function hideOnDepthRender(object) {
            this.hiddenOnDepthWrite.push(object);
        }
    }, {
        key: "addShader",
        value: function addShader(shader, toScreen, before, after, uniformsToUpdate) {
            this.effect.push({ shader: shader, toScreen: toScreen, before: before, after: after, uniformsToUpdate: uniformsToUpdate });
        }
    }, {
        key: "render",
        value: function render(renderer, scene, camera) {
            var size = renderer.getSize();

            //depth render if needed
            if (this.depthRender) {

                for (var i in this.hiddenOnDepthWrite) {
                    this.hiddenOnDepthWrite[i].visible = false;
                }
                renderer.render(scene, camera, this.depthTarget, true);

                for (var _i in this.hiddenOnDepthWrite) {
                    this.hiddenOnDepthWrite[_i].visible = true;
                }
            }

            // scene initial render
            renderer.render(scene, camera, this.renderTarget, true);

            //loop trough all added effects
            for (var _i2 = 0; _i2 < this.effect.length; _i2++) {

                //before effect render callback
                if (this.effect[_i2].before) {
                    this.effect[_i2].before();
                }

                //set render texture
                this.effect[_i2].shader.uniforms.render.value = this.renderTarget.texture;

                //set depth texture if needed
                if (this.effect[_i2].shader.uniforms.renderDepth) {
                    this.effect[_i2].shader.uniforms.renderDepth.value = this.depthTarget.depthTexture;
                }

                // set size uniform if needed
                if (this.effect[_i2].shader.uniforms.size) {
                    this.effect[_i2].shader.uniforms.size.value = new THREE.Vector2(size.width, size.height);
                }

                // update special uniforms if needed
                if (this.effect[_i2].uniformsToUpdate) {
                    for (var _i3 in uniformsToUpdate) {
                        this.effect[_i3].shader.uniforms[_i3].value = uniformsToUpdate[_i3];
                    }
                }

                //apply shader to render quad;
                this.quad.material = this.effect[_i2].shader;

                //render to screen
                if (!this.effect[_i2].toScreen) {
                    renderer.render(this.scene, this.camera, this.readTarget, true);

                    // after effect render callback
                    if (this.effect[_i2].after) {
                        this.effect[_i2].after();
                    }

                    //swap
                    var tempTarget = this.renderTarget.clone();
                    this.renderTarget.copy(this.readTarget);
                    this.readTarget.copy(tempTarget);
                } else {
                    renderer.render(this.scene, this.camera);
                }
            }
        }
    }]);

    return PostProcess;
}();
