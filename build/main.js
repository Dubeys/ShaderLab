'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var App = function () {
    function App(lib) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$width = _ref.width,
            width = _ref$width === undefined ? window.innerWidth : _ref$width,
            _ref$height = _ref.height,
            height = _ref$height === undefined ? window.innerHeight : _ref$height,
            _ref$precision = _ref.precision,
            precision = _ref$precision === undefined ? 'highp' : _ref$precision;

        _classCallCheck(this, App);

        this.width = width;
        this.height = height;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, precision: precision });
        this.renderer.setSize(width, height);
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.autoClear = false;
        // this.renderer.setClearColor(0xCCCCFF);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // this.renderer.shadowMapWidth = 4096;
        // this.renderer.shadowMapHeight = 4096;

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 10000);
        this.cameraTarget = new THREE.Vector2(Math.PI / 2, -Math.PI / 2);
        // this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );
        this.mirror = new THREE.CubeCamera(1, 50000, 1024);

        this.clock = new THREE.Clock();

        this.post = {};

        var size = this.renderer.getSize();

        this.post.renderTarget = new THREE.WebGLRenderTarget(size.width * 2, size.height * 2, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });
        this.post.readTarget = new THREE.WebGLRenderTarget(size.width * 2, size.height * 2, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });
        this.post.depthTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            stencilBuffer: false
        });

        this.post.depthTarget.depthTexture = new THREE.DepthTexture(size.width, size.height, THREE.UnsignedIntType);

        this.post.material = new shaderPost(); // custom shader
        this.post.materialVertical = new shaderPostVBlur(); // custom shader

        this.post.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.post.scene = new THREE.Scene();

        this.post.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
        this.post.quad.frustumCulled = false; // Avoid getting clipped

        this.post.scene.add(this.post.quad);
    }

    _createClass(App, [{
        key: 'init',
        value: function init(lib) {

            document.body.appendChild(this.renderer.domElement);
            this.inputs = new Inputs();
            this.inputs.onResize(App.setSize.bind(this));
            this.lib = lib;
            this.lib.nightgrade.raw.minFilter = THREE.NearestFilter;

            this.level = new Scene(this.camera, lib, this.inputs);

            console.log(this.renderer.info);

            this.render();
            this.level.afterInitRender();
            this.run();
        }
    }, {
        key: 'run',
        value: function run() {
            requestAnimationFrame(this.run.bind(this));

            this.level.update();
            this.cameraControlsUpdate();

            this.render();
        }
    }, {
        key: 'render',
        value: function render() {
            this.renderer.clear();
            this.postProcess();
        }
    }, {
        key: 'cameraControlsUpdate',
        value: function cameraControlsUpdate() {

            if (this.inputs.clickActive) {
                this.cameraTarget.y += this.inputs.mouse.deltaX * 5;
                this.cameraTarget.x += -this.inputs.mouse.deltaY * 2;
            }

            var vector = new THREE.Vector3(Math.cos(this.cameraTarget.y) * Math.sin(this.cameraTarget.x), Math.cos(this.cameraTarget.x), Math.sin(this.cameraTarget.y) * Math.sin(this.cameraTarget.x)).multiplyScalar(2000);
            this.camera.lookAt(vector);
        }
    }, {
        key: 'postProcess',
        value: function postProcess(opts) {

            var size = this.renderer.getSize();

            this.post.renderTarget.setSize(size.width * 2, size.height * 2);
            this.post.depthTarget.setSize(size.width, size.height);
            this.post.readTarget.setSize(size.width, size.height);
            this.level.children[0].visible = false;
            this.renderer.render(this.level, this.camera, this.post.depthTarget, true);
            this.level.children[0].visible = true;
            this.renderer.render(this.level, this.camera, this.post.renderTarget, true);

            this.post.materialVertical.uniforms.render.value = this.post.renderTarget.texture;
            this.post.materialVertical.uniforms.renderDepth.value = this.post.depthTarget.depthTexture;
            this.post.materialVertical.uniforms.cameraNear.value = this.camera.near;
            this.post.materialVertical.uniforms.cameraFar.value = 4000;
            this.post.materialVertical.uniforms.size.value.set(size.width * 1., size.height * 1.);

            this.post.quad.material = this.post.materialVertical;

            this.renderer.render(this.post.scene, this.post.camera, this.post.readTarget, true);

            this.post.material.uniforms.render.value = this.post.readTarget.texture;
            this.post.material.uniforms.renderDepth.value = this.post.depthTarget.depthTexture;
            this.post.material.uniforms.lut.value = this.lib.nightgrade.raw;
            this.post.material.uniforms.cameraNear.value = this.camera.near;
            this.post.material.uniforms.cameraFar.value = 4000;
            this.post.material.uniforms.size.value.set(size.width * 1., size.height * 1.);

            this.post.quad.material = this.post.material;

            this.renderer.render(this.post.scene, this.post.camera);
        }
    }], [{
        key: 'setSize',
        value: function setSize(e) {
            this.renderer.setSize(e.target.innerWidth, e.target.innerHeight);
            this.camera.aspect = e.target.innerWidth / e.target.innerHeight;
            this.camera.updateProjectionMatrix();
        }
    }]);

    return App;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cache = function () {
    function Cache() {
        _classCallCheck(this, Cache);

        this.loadedCount = 0;
        this.toLoad = [];
        this.toLoadCount = 0;
        this.progressEach = {};
        this.progressAll = 0;
        this.progressCb;
        this.lib = {};
        this.lib.geometries = {};
        this.toLoadSingle = false;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    _createClass(Cache, [{
        key: 'add',
        value: function add(info) {
            this.toLoad.push(info);
            this.toLoadCount++;
            this.progressEach[info.name];
        }
    }, {
        key: 'loadJSONList',
        value: function loadJSONList(url) {
            var loader = new THREE.FileLoader().load(url, function (data) {
                var parsed = JSON.parse(data);
                this.addList(parsed);
            }.bind(this));
        }
    }, {
        key: 'addList',
        value: function addList(list) {
            if (list.length > 0) {

                for (var i in list) {
                    this.add(list[i]);
                }

                this.loadAll();
            } else {
                this.onAll();
            }
        }
    }, {
        key: 'changeSource',
        value: function changeSource(libAssetName, newUrl) {
            if (this.toLoad === 0) {
                var info = this.lib[libAssetName];
                this.load(info);
                this.toLoadSingle = true;
            } else {
                console.warn('wait for assets to load first');
            }
        }
    }, {
        key: 'load',
        value: function load(info) {
            switch (info.type) {
                case 'sound':
                    Cache.loadSound.call(this, info);
                    break;

                case 'texture':
                    Cache.loadMap.call(this, info);
                    break;

                case 'box':
                    Cache.loadCube.call(this, info);
                    break;

                case 'jsonObj':
                    Cache.loadJsonObj.call(this, info);
                    break;

                case 'level':
                    Cache.loadLevel.call(this, info);
                    break;

            }
        }
    }, {
        key: 'loadAll',
        value: function loadAll() {
            for (var i in this.toLoad) {
                var info = this.toLoad[i];
                this.load(info);
            }
        }
    }], [{
        key: 'loaded',
        value: function loaded() {

            if (!this.toLoadSingle) {
                this.toLoad.pop();
                if (this.toLoad.length === 0) {
                    this.onAll(this.lib);
                }
            } else {
                this.onSingle(this.lib);
            }
        }
    }, {
        key: 'loadSound',
        value: function loadSound(info) {
            var request = new XMLHttpRequest();
            request.open('GET', info.url, true);
            request.responseType = 'arraybuffer';
            request.onload = function () {
                info.raw = request.response;
                this.audioContext.decodeAudioData(info.raw, function (buffer) {
                    info.raw = buffer;
                    this.lib[info.name] = info;
                    Cache.progress.call(this, info.name, 100);
                    Cache.loaded.call(this);
                }.bind(this));
            }.bind(this);

            request.addEventListener('progress', function (name, e) {
                Cache.progress.call(this, name, e.loaded / e.total * 100);
            }.bind(this, info.name));

            request.send();
        }
    }, {
        key: 'loadMap',
        value: function loadMap(info) {
            var loader = new THREE.TextureLoader();
            loader.load(info.url, function (texture) {
                info.raw = texture;
                this.lib[info.name] = info;
                Cache.progress.call(this, info.name, 100);
                Cache.loaded.call(this);
            }.bind(this), function (name, xhr) {
                Cache.progress.call(this, name, xhr.loaded / xhr.total * 100);
            }.bind(this, info.name));
        }
    }, {
        key: 'loadCube',
        value: function loadCube(info) {
            var loader = new THREE.CubeTextureLoader().setPath(info.dir).load([info.commonName + 'l.jpg', info.commonName + 'r.jpg', info.commonName + 'u.jpg', info.commonName + 'd.jpg', info.commonName + 'f.jpg', info.commonName + 'b.jpg'], function (texture) {
                info.raw = texture;
                this.lib[info.name] = info;
                Cache.progress.call(this, info.name, 100);
                Cache.loaded.call(this);
            }.bind(this), function (name, xhr) {
                Cache.progress.call(this, name, xhr.loaded / xhr.total * 100);
            }.bind(this, info.name));
        }
    }, {
        key: 'loadJsonObj',
        value: function loadJsonObj(info) {
            var loader = new THREE.JSONLoader().load(info.url, function (object) {
                object.computeFaceNormals();
                info.raw = object;
                this.lib.geometries[info.name] = info;
                Cache.progress.call(this, info.name, 100);
                Cache.loaded.call(this);
            }.bind(this), function (name, xhr) {
                Cache.progress.call(this, name, xhr.loaded / xhr.total * 100);
            }.bind(this, info.name));
        }
    }, {
        key: 'loadLevel',
        value: function loadLevel(info) {
            var loader = new THREE.FileLoader().load(info.url, function (data) {
                var parsed = JSON.parse(data);
                info = parsed;
                this.lib[info.name] = info;
                Cache.progress.call(this, info.name, 100);
                Cache.loaded.call(this);
            }.bind(this), function (name, xhr) {
                Cache.progress.call(this, name, xhr.loaded / xhr.total * 100);
            }.bind(this, info.name));
        }
    }, {
        key: 'progress',
        value: function progress(name, value) {
            this.progressEach[name] = value;

            this.progressAll = 0;

            for (var prog in this.progressEach) {
                this.progressAll += this.progressEach[prog];
            }

            this.progressAll /= this.toLoadCount;
            if (this.onProgress) {
                this.onProgress(this.progressAll);
            }
        }
    }]);

    return Cache;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Inputs = function () {
    function Inputs() {
        _classCallCheck(this, Inputs);

        this.upActive = false;
        this.downActive = false;
        this.leftActive = false;
        this.rightActive = false;
        this.mActive = false;
        this.spaceActive = false;
        this.escapeActive = false;
        this.gActive = false;

        this.upPressed = false;
        this.downPressed = false;
        this.leftPressed = false;
        this.rightPressed = false;
        this.mPressed = false;
        this.spacePressed = false;
        this.escapePressed = false;
        this.gPressed = false;

        window.addEventListener('keydown', function (e) {
            if (e.keyCode == '38') {
                if (!this.upActive) {
                    this.upActive = true;
                    this.upPressed = true;
                } else {
                    this.upPressed = false;
                }
            }

            if (e.keyCode == '40') {
                if (!this.downActive) {
                    this.downActive = true;
                    this.downPressed = true;
                } else {
                    this.downPressed = false;
                }
            }

            if (e.keyCode == '37') {
                if (!this.leftActive) {
                    this.leftActive = true;
                    this.leftPressed = true;
                } else {
                    this.leftPressed = false;
                }
            }

            if (e.keyCode == '39') {
                if (!this.rightActive) {
                    this.rightActive = true;
                    this.rightPressed = true;
                } else {
                    this.rightPressed = false;
                }
            }

            if (e.keyCode == '16') {
                if (!this.shiftActive) {
                    this.shiftActive = true;
                    this.shiftPressed = true;
                } else {
                    this.shiftPressed = false;
                }
            }

            if (e.keyCode == '77') {
                if (!this.mActive) {
                    this.mActive = true;
                    this.mPressed = true;
                } else {
                    this.mPressed = false;
                }
            }

            if (e.keyCode == '32') {
                if (!this.spaceActive) {
                    this.spaceActive = true;
                    this.spacePressed = true;
                } else {
                    this.spacePressed = false;
                }
            }

            if (e.keyCode == '27') {
                if (!this.escapeActive) {
                    this.escapeActive = true;
                    this.escapePressed = true;
                } else {
                    this.escapePressed = false;
                }
            }

            if (e.keyCode == '71') {
                if (!this.gActive) {
                    this.gActive = true;
                    this.gPressed = true;
                } else {
                    this.gPressed = false;
                }
            }
        }.bind(this));

        window.addEventListener('keyup', function (e) {

            switch (e.keyCode) {
                case 38:
                    this.upActive = false;
                    this.upPressed = false;
                    break;
                case 40:
                    this.downActive = false;
                    this.downPressed = false;
                    break;
                case 37:
                    this.leftActive = false;
                    this.leftPressed = false;
                    break;
                case 39:
                    this.rightActive = false;
                    this.rightPressed = false;
                    break;
                case 16:
                    this.shiftActive = false;
                    this.shiftPressed = false;
                    break;
                case 77:
                    this.mActive = false;
                    this.mPressed = false;
                    break;
                case 32:
                    this.spaceActive = false;
                    this.spacePressed = false;
                    break;
                case 27:
                    this.escapeActive = false;
                    this.escapePressed = false;
                    break;
                case 71:
                    this.gActive = false;
                    this.gPressed = false;
                    break;

            }
        }.bind(this));

        this.mouse = new THREE.Vector2();
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.click = false;
        this.clickActive = false;
        this.mousedown = false;
        window.addEventListener('mousemove', function (event) {
            var x = this.mouse.x;
            var y = this.mouse.y;

            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            this.mouse.x = event.clientX / window.innerWidth * 2 - 1;

            this.mouse.deltaX = x - this.mouse.x;
            this.mouse.deltaY = y - this.mouse.y;
        }.bind(this));

        var canvas = document.querySelector('canvas');
        canvas.addEventListener('mousedown', function (event) {
            if (!this.clickActive) {
                this.clickActive = true;
                this.click = true;
            } else {
                this.click = false;
            }

            event.preventDefault();
        }.bind(this));
        canvas.addEventListener('mouseup', function (event) {
            this.click = false;
            this.clickActive = false;
            this.clickUp = true;
        }.bind(this));
    }

    _createClass(Inputs, [{
        key: 'resetPressed',
        value: function resetPressed() {
            this.upPressed = false;
            this.downPressed = false;
            this.leftPressed = false;
            this.rightPressed = false;
            this.mPressed = false;
            this.spacePressed = false;
            this.escapePressed = false;
            this.gPressed = false;
            this.click = false;
        }
    }, {
        key: 'onFocus',
        value: function onFocus(fn) {
            window.addEventListener('focus', fn);
        }
    }, {
        key: 'onResize',
        value: function onResize(fn) {
            window.addEventListener('resize', fn);
        }
    }]);

    return Inputs;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Scene = function (_THREE$Scene) {
    _inherits(Scene, _THREE$Scene);

    function Scene(camera, lib, inputs) {
        var name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "untitled";

        _classCallCheck(this, Scene);

        var _this = _possibleConstructorReturn(this, (Scene.__proto__ || Object.getPrototypeOf(Scene)).call(this));

        _this.name = name;

        _this.inputs = inputs;
        _this.lib = lib;

        _this.camera = camera;
        camera.position.z = 100;

        _this.prop = {};

        _this.fog = new THREE.FogExp2(0xFFFFFF, 0.001);

        var torusKnot = new THREE.TorusKnotGeometry(10, 3.5, 120, 20);

        var objectShader = {
            toon: new shaderToon({ color: 0xFFFFFF, shadowColor: 0x000000 }),
            basic: new THREE.MeshPhongMaterial({ color: 0xF0F0F0 })
        };

        var exampleObject = new THREE.Mesh(torusKnot, objectShader.toon);
        exampleObject.torusShader = 'toon';
        exampleObject.shaders = objectShader;
        exampleObject.update = function () {
            this.rotateY(-.05);
            this.material = this.shaders[this.torusShader];
        };

        var skyBox = new THREE.IcosahedronGeometry(3000, 1);

        _this.lib.clouds.raw.wrapS = THREE.RepeatWrapping;
        _this.lib.clouds.raw.wrapT = THREE.RepeatWrapping;
        console.log(_this.lib.clouds.raw);

        var skyShader = {
            color: new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide }),
            firewatch: new shaderSky({ camera: _this.camera, clouds: _this.lib.clouds.raw })
        };

        var exampleSkybox = new THREE.Mesh(skyBox, skyShader.color);
        exampleSkybox.skyShader = 'firewatch';
        exampleSkybox.name = 'sky';
        exampleSkybox.shaders = skyShader;
        exampleSkybox.plainColor = [0, 0, 0];
        exampleSkybox.nightday = 0;
        exampleSkybox.update = function (clock) {
            this.material = this.shaders[this.skyShader];
            if (this.skyShader === 'firewatch') {

                this.position.copy(this.material.camera.position);
                this.material.setSunAngle(clock.getElapsedTime() * 100.);
                this.material.update(clock);
                this.material.setTimeOfDay(this.nightday, [20, 55], 1, [195, 230], 1);
            } else {
                this.material.color.r = this.plainColor[0] / 255;
                this.material.color.g = this.plainColor[1] / 255;
                this.material.color.b = this.plainColor[2] / 255;

                this.material.needsUpdate = true;
            }
        };

        var ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 20, 20), new THREE.MeshPhongMaterial({ color: 0xCCBB88, side: THREE.DoubleSide, displacementMap: lib.hm_mountain.raw, displacementScale: 400, shading: THREE.FlatShading }));

        ground.rotation.x = -Math.PI * .5;
        ground.position.y = -50;
        // ground.position.z = -1300;

        var light = new THREE.DirectionalLight(0xFFFFFF, 1);
        light.position.set(-10, 20, 15);
        light.follow = exampleSkybox;

        light.update = function () {
            if (this.follow.material.uniforms) {

                var info = this.follow.material.getLightInfo();
                this.position.copy(info.position);
                this.intensity = info.intensity;
                this.color.copy(info.color);
            } else {
                this.position.set(-10, 20, 15);
                this.intensity = 1;
                this.color.setHex(0xFFFFFF);
            }
        };

        var hemi = new THREE.HemisphereLight(0x88BBFF, 0xCCBB88, .3);
        hemi.follow = [exampleSkybox, _this.fog];

        hemi.update = function () {
            if (this.follow[0].material.uniforms) {
                this.intensity = this.follow[0].material.uniforms.uSunPos.value.y * .3;
            } else {
                this.intensity = .3;
            }

            this.color = this.follow[1].color.clone();
        };

        _this.addChild(exampleSkybox);
        _this.addChild(light);
        _this.addChild(hemi);
        _this.addChild(exampleObject);
        _this.addChild(ground);

        _this.addProperty('firstUpdate', true);
        _this.addProperty('stopped', false);
        _this.addProperty('editVector', new THREE.Vector3(0, 0, 0));

        _this.clock = new THREE.Clock();
        _this.clock.autoStart = false;

        _this.gui = new dat.GUI();
        _this.gui.add(exampleObject, 'torusShader', ['toon', 'basic']);
        _this.gui.add(exampleSkybox, 'skyShader', ['firewatch', 'color']);
        _this.gui.add(exampleSkybox, 'nightday', 0, 1);
        _this.gui.addColor(exampleSkybox, 'plainColor');
        return _this;
    }

    _createClass(Scene, [{
        key: 'update',
        value: function update() {
            if (this.prop.firstUpdate) {
                this.first();
                this.prop.firstUpdate = false;
            }

            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i].update) {
                    this.children[i].update(this.clock);
                }

                if (this.children[i].name === "sky") {
                    if (this.children[i].material.uniforms) {
                        this.fog.color = this.children[i].material.getFogColor();
                    } else {
                        this.fog.color.copy(this.children[i].material.color);
                    }
                }
            }

            return this.prop.stopped;
        }
    }, {
        key: 'afterInitRender',
        value: function afterInitRender() {}
    }, {
        key: 'first',
        value: function first() {
            this.clock.start();
        }
    }, {
        key: 'addChild',
        value: function addChild(object) {
            var obstacle = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var transparent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            if (transparent) {
                if (obstacle) {
                    this.player.addObstacle(object);
                }
            } else {
                this.add(object);
                if (obstacle) {
                    this.player.addObstacle(object);
                }
            }
        }
    }, {
        key: 'removeChild',
        value: function removeChild(child) {
            for (var i in this.children) {
                if (child == this.children[i]) {
                    this.remove(child);
                    this.player.removeObstacle(child);
                }
            }
        }
    }, {
        key: 'addProperty',
        value: function addProperty(name, value) {
            this.prop[name] = value;
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.prop.stopped = true;
        }
    }, {
        key: 'cameraX',
        get: function get() {
            return this.camera.position.x;
        },
        set: function set(value) {
            this.camera.position.x = value;
        }
    }, {
        key: 'cameraY',
        get: function get() {
            return this.camera.position.y;
        },
        set: function set(value) {
            this.camera.position.y = value;
        }
    }]);

    return Scene;
}(THREE.Scene);
'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var CACHE = new Cache();
    var APP = new App();

    CACHE.onAll = function (lib) {
        APP.init(lib);
    };

    CACHE.loadJSONList('build/imports.json');
});
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var shaderPost = function (_THREE$ShaderMaterial) {
    _inherits(shaderPost, _THREE$ShaderMaterial);

    function shaderPost() {
        _classCallCheck(this, shaderPost);

        var _this = _possibleConstructorReturn(this, (shaderPost.__proto__ || Object.getPrototypeOf(shaderPost)).call(this));

        _this.uniforms = {
            render: { value: null },
            lut: { value: null },
            renderDepth: { value: null },
            cameraNear: { value: null },
            cameraFar: { value: null },
            size: { value: new THREE.Vector2() }
        };

        _this.vertexShader = "\n            varying vec2 vUv;\n\n            void main(){\n                vUv = uv;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n            }\n        ";

        _this.fragmentShader = "\n            #include <packing>\n\n            uniform sampler2D render;\n            uniform sampler2D lut;\n            uniform sampler2D renderDepth;\n            uniform float cameraNear;\n            uniform float cameraFar;\n\n            uniform vec2 size;\n\n            varying vec2 vUv;\n\n            // Ref: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#No_3D_Texture_support\n            vec4 sampleAs3DTexture( sampler2D tex, vec3 texCoord, float size ) {\n              float sliceSize = 1.0 / size;                         // space of 1 slice\n              float slicePixelSize = sliceSize / size;              // space of 1 pixel\n              float sliceInnerSize = slicePixelSize * (size - 1.0); // space of size pixels\n              float zSlice0 = min(floor(texCoord.z * size), size - 1.0);\n              float zSlice1 = min(zSlice0 + 1.0, size - 1.0);\n              float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;\n              float s0 = xOffset + (zSlice0 * sliceSize);\n              float s1 = xOffset + (zSlice1 * sliceSize);\n              vec4 slice0Color = texture2D(tex, vec2(s0, texCoord.y));\n              vec4 slice1Color = texture2D(tex, vec2(s1, texCoord.y));\n              float zOffset = mod(texCoord.z * size, 1.0);\n              return mix(slice0Color, slice1Color, zOffset);\n            }\n\n            vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {\n              vec4 color = vec4(0.0);\n              vec2 off1 = vec2(1.3846153846) * direction;\n              vec2 off2 = vec2(3.2307692308) * direction;\n              color += texture2D(image, uv) * 0.2270270270;\n              color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;\n              color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;\n              color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;\n              color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;\n              return color;\n            }\n\n            float readDepth(sampler2D tDepth,vec2 coord,float cameraNear, float cameraFar){\n                float fragCoordZ = texture2D(tDepth, coord).x;\n\t\t\t\tfloat viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );\n\t\t\t\treturn viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );\n            }\n\n            void main(){\n                float depth = readDepth(renderDepth,vUv,cameraNear,cameraFar);\n                vec4 blurredImage = vec4(0.0);\n                if(depth >= 1.0){\n                    blurredImage = blur9(render,vUv,size,vec2(depth,-depth))*.5;\n                    blurredImage += blur9(render,vUv,size,vec2(-depth,depth))*.5;\n                }else{\n                    blurredImage = blur9(render,vUv,size,vec2(depth * 2.5,-depth * 2.5))*.5;\n                    blurredImage += blur9(render,vUv,size,vec2(-depth * 2.5,depth * 2.5))*.5;\n                }\n                // image.y = 1. - image.y;\n                // vec4 colorCorect = sampleAs3DTexture(lut,image.xyz,16.);\n                gl_FragColor = blurredImage;\n            }\n        ";

        return _this;
    }

    return shaderPost;
}(THREE.ShaderMaterial);
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var shaderPostVBlur = function (_THREE$ShaderMaterial) {
    _inherits(shaderPostVBlur, _THREE$ShaderMaterial);

    function shaderPostVBlur() {
        _classCallCheck(this, shaderPostVBlur);

        var _this = _possibleConstructorReturn(this, (shaderPostVBlur.__proto__ || Object.getPrototypeOf(shaderPostVBlur)).call(this));

        _this.uniforms = {
            render: { value: null },
            renderDepth: { value: null },
            cameraNear: { value: null },
            cameraFar: { value: null },
            size: { value: new THREE.Vector2() }
        };

        _this.vertexShader = "\n            varying vec2 vUv;\n\n            void main(){\n                vUv = uv;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n            }\n        ";

        _this.fragmentShader = "\n            #include <packing>\n\n            uniform sampler2D render;\n            uniform sampler2D renderDepth;\n            uniform float cameraNear;\n            uniform float cameraFar;\n\n            uniform vec2 size;\n\n            varying vec2 vUv;\n\n            vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {\n              vec4 color = vec4(0.0);\n              vec2 off1 = vec2(1.3846153846) * direction;\n              vec2 off2 = vec2(3.2307692308) * direction;\n              color += texture2D(image, uv) * 0.2270270270;\n              color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;\n              color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;\n              color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;\n              color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;\n              return color;\n            }\n\n            float readDepth(sampler2D tDepth,vec2 coord,float cameraNear, float cameraFar){\n                float fragCoordZ = texture2D(tDepth, coord).x;\n\t\t\t\tfloat viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );\n\t\t\t\treturn viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );\n            }\n\n            void main(){\n                float depth = readDepth(renderDepth,vUv,cameraNear,cameraFar);\n                vec4 color = texture2D(render,vUv);\n                vec4 blurredImage = vec4(0.0);\n                if(depth >= 1.0){\n                    blurredImage = blur9(render,vUv,size,vec2(depth ))*.5;\n                    blurredImage += blur9(render,vUv,size,vec2(-depth ))*.5;\n                }else{\n                    blurredImage = blur9(render,vUv,size,vec2(depth * 2.5))*.5;\n                    blurredImage += blur9(render,vUv,size,vec2(-depth * 2.5))*.5;\n                }\n                gl_FragColor = blurredImage;\n            }\n        ";

        return _this;
    }

    return shaderPostVBlur;
}(THREE.ShaderMaterial);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var shaderSky = function (_THREE$ShaderMaterial) {
    _inherits(shaderSky, _THREE$ShaderMaterial);

    function shaderSky() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref$time = _ref.time,
            time = _ref$time === undefined ? 0 : _ref$time,
            _ref$sunPosition = _ref.sunPosition,
            sunPosition = _ref$sunPosition === undefined ? new THREE.Vector3(-0.3, 0.4, -1) : _ref$sunPosition,
            _ref$color = _ref.color,
            color = _ref$color === undefined ? new THREE.Color(0xFFFEED) : _ref$color,
            _ref$atmosphere = _ref.atmosphere,
            atmosphere = _ref$atmosphere === undefined ? new THREE.Color(0x2671d3) : _ref$atmosphere,
            _ref$horizon = _ref.horizon,
            horizon = _ref$horizon === undefined ? new THREE.Color(0xa8cdff) : _ref$horizon,
            _ref$horizonLine = _ref.horizonLine,
            horizonLine = _ref$horizonLine === undefined ? new THREE.Color(0xbff6ff) : _ref$horizonLine,
            _ref$sun = _ref.sun,
            sun = _ref$sun === undefined ? true : _ref$sun,
            camera = _ref.camera,
            clouds = _ref.clouds;

        _classCallCheck(this, shaderSky);

        var _this = _possibleConstructorReturn(this, (shaderSky.__proto__ || Object.getPrototypeOf(shaderSky)).call(this));

        _this.side = THREE.BackSide;

        _this.sunPos = sunPosition;

        if (camera) {
            _this.cameraLookAt = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
            _this.camera = camera;
        } else {
            console.error('no camera provided');
        }

        var sunOn = sun ? 1 : 0;

        _this.uniforms = {
            time: { value: time },
            uColor: { value: color },
            uHorColor: { value: horizon },
            uAtmColor: { value: atmosphere },
            uHorHardColor: { value: horizonLine },
            uSunPos: { value: sunPosition },
            sunInt: { value: 0 },
            cameraLookAt: { value: _this.cameraLookAt },
            clouds: { value: clouds }
        };

        _this.vertexShader = 'uniform float time;\n\n    \t\tvarying vec3 vNormal;\n            varying vec2 vUv;\n            varying vec3 vViewPosition;\n\n    \t\tvoid main() {\n\n                vUv = uv;\n        \t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n        \t\tvec4 worldPosition = modelMatrix * vec4( position, 1.0 );\n        \t\tvNormal = normalize( normalMatrix * normal );\n                vViewPosition = position;\n        \t\t// vPos = vec3((modelViewMatrix * vec4( position, 1.0 )).xyz);\n                // cNormal = normalize( projectionMatrix * vec4(normal));\n\n            }';

        _this.fragmentShader = 'uniform float time;\n            uniform vec3 uColor;\n            uniform vec3 uAtmColor;\n            uniform vec3 uHorColor;\n            uniform vec3 uHorHardColor;\n            uniform vec3 uSunPos;\n            uniform float sunInt;\n            uniform vec3 cameraLookAt;\n            uniform sampler2D clouds;\n\n    \t\tvarying vec3 vNormal;\n    \t\tvarying vec3 vViewPosition;\n    \t\tvarying vec2 vUv;\n\n            vec4 circle(vec2 uv, vec2 pos, float rad, vec3 color) {\n            \tfloat d = length(pos - uv) - rad;\n            \tfloat t = clamp(d, 0.0, 1.0);\n            \treturn vec4(color, 1.0 - t);\n            }\n\n            vec3 mod289(vec3 x) {\n              return x - floor(x * (1.0 / 239.0)) * 239.0;\n            }\n\n            vec2 mod289(vec2 x) {\n              return x - floor(x * (1.0 / 289.0)) * 289.0;\n            }\n\n            vec3 permute(vec3 x) {\n              return mod289(((x*34.0)+1.0)*x);\n            }\n\n            float snoise(vec2 v) {\n\n              const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0\n                                  0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)\n                                 -0.577350269189626,  // -1.0 + 2.0 * C.x\n                                  0.024390243902439); // 1.0 / 41.0\n            // First corner\n              vec2 i  = floor(v + dot(v, C.yy) );\n              vec2 x0 = v -   i + dot(i, C.xx);\n\n              vec2 i1;\n              i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n              vec4 x12 = x0.xyxy + C.xxzz;\n              x12.xy -= i1;\n\n              i = mod289(i); // Avoid truncation effects in permutation\n              vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))\n            \t\t+ i.x + vec3(0.0, i1.x, 1.0 ));\n\n              vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\n              m = m*m ;\n              m = m*m ;\n              vec3 x = 2.0 * fract(p * C.www) - 1.0;\n              vec3 h = abs(x) - 0.5;\n              vec3 ox = floor(x + 0.5);\n              vec3 a0 = x - ox;\n              m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n              vec3 g;\n              g.x  = a0.x  * x0.x  + h.x  * x0.y;\n              g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n              return 150.0 * dot(m, g);\n            }\n\n            float star(vec2 p) {\n              return step(1.0, smoothstep(0.5, 1.1, snoise(p)));\n            }\n\n    \t\tvoid main() {\n                vec3 nPos = normalize( vViewPosition);\n                vec3 fPos = nPos;\n                nPos = 0.5 + (nPos * 0.5);\n                vec3 gradient = vec3(0.0);\n                vec4 gradient2 = vec4(0.0);\n                vec3 colorAddition = vec3(0.0);\n                vec3 sunPos = normalize(uSunPos);\n\n                float nightdayIntensity = 0.2 + clamp(sunPos.y*.8,0.,1.);\n\n                if(nPos.y > 0.49){\n                    gradient = clamp(mix(uHorColor,uAtmColor,-2.0*0.5+nPos.y*2.0),0.0,1.0);\n                }else{\n                    gradient = clamp(mix(uHorColor,uAtmColor,2.0*0.5-nPos.y*2.0),0.0,0.1);\n                }\n\n                if(nPos.y > 0.49){\n                    gradient2 = clamp(mix(vec4(gradient,0.0),vec4(uHorHardColor,1.0),10.0*0.6-nPos.y*10.0),0.0,1.0);\n                }\n\n                float s1 = star(vUv * 300.);\n                float s2 = star(vUv * 500.5 + vec2(-20.0, 10.0));\n                float s3 = star(vUv * 700.14 + vec2(-75.0, 25.0));\n                vec3 starsLayer = vec3(s1 * 1. + s2 * .6 + s3 * .3 );\n\n                gradient += starsLayer * clamp(1. - sunPos.y * 2.0, 0.0,1.0);\n\n                float dist = distance(sunPos,fPos);\n\n                vec4 sun = vec4(0.0);\n                vec4 sunColor = vec4(0.0);\n                if(dist*30.0 < 1.0){\n                    sun = vec4(1.0);\n                    sunColor = vec4(uColor,1.);\n                }\n\n                float distanceToCamera = (1.0 - clamp(distance(normalize(cameraLookAt),sunPos)*1.2,0.0,1.0)) * .3;\n\n                float dist2 = distance(vec3(sunPos.x,0.0,sunPos.z),vec3(fPos.x*0.5+sunPos.x*0.5,fPos.y*10.0,fPos.z));\n                dist = 0.5 * (1.0 + distanceToCamera) / exp(log(dist)/7.0);\n                dist2 = 0.2 / exp(log(dist2)/4.0);\n                dist += dist2;\n                dist = clamp(dist,0.0,1.0);\n\n                vec4 mix1 = mix(vec4(gradient,1.0),gradient2,gradient2.a * (1. - sunPos.y));\n\n                vec4 rGradient = clamp(mix(vec4(mix1.rgb,0.0),vec4(uColor,1.0),dist),0.0,1.0);\n\n                vec4 mix2 = mix(mix1,rGradient,rGradient.a*2.5 - 1.5);\n\n                if(sun.r > 0.){\n                    mix2 = mix(sun,sunColor,sunInt);\n                }\n\n    \t\t\t// gl_FragColor = vec4( mix2.rgb * (1.0 + distanceToCamera*4.0 * nightdayIntensity),1.0);\n                vec2 nUv = fPos.xz * (1.2 - fPos.y );\n                nUv = .5 + nUv * .5;\n                vec4 cloudsColor = mix(vec4(uHorHardColor.rgb,0.),vec4(uHorHardColor.rgb,1.),texture2D(clouds,nUv + vec2(time/100.,time/100.)).r);\n                gl_FragColor = mix(vec4( mix2.rgb * (1.0 + distanceToCamera*4.0 * nightdayIntensity),1.0) , cloudsColor, cloudsColor.a );\n\n    \t\t}';
        return _this;
    }

    _createClass(shaderSky, [{
        key: 'update',
        value: function update(clock) {
            if (clock) {
                this.uniforms.time.value = clock.getElapsedTime();
            }
            this.uniforms.cameraLookAt.value = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        }
    }, {
        key: 'setTimeOfDay',
        value: function setTimeOfDay() {
            var time = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
            var sunHue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [20, 55];
            var sunSat = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
            var atmHue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [195, 230];
            var atmSat = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
            // 0 night - 1 noon | hue
            this.uniforms.uSunPos.value.y = -.1 + time;
            this.uniforms.sunInt.value = 1 - time;
            var radial = (sunHue[0] + time * (sunHue[1] - sunHue[0])) / 360;
            var radialSky = (atmHue[0] + (1 - time) * (atmHue[1] - atmHue[0])) / 360;
            this.uniforms.uColor.value.setHSL(radial, (.5 + (1 - time) * .4) * sunSat, .5 + time * .4);
            this.uniforms.uHorHardColor.value.setHSL(radial, (.5 + (1 - time) * .4) * sunSat, .2 + time * .75);
            this.uniforms.uHorColor.value.setHSL(radialSky, (.5 + (1 - time) * .1) * atmSat, .15 + time * .5);
            this.uniforms.uAtmColor.value.setHSL(radialSky, (.5 + (1 - time) * .1) * atmSat, time * .5);
        }
    }, {
        key: 'setSunAngle',
        value: function setSunAngle(angle) {
            this.uniforms.uSunPos.value.x = Math.sin(angle / 180 * Math.PI);
            this.uniforms.uSunPos.value.z = Math.cos(angle / 180 * Math.PI);
        }
    }, {
        key: 'getLightInfo',
        value: function getLightInfo() {
            var position = this.uniforms.uSunPos.value.clone();
            var intensity = this.uniforms.uSunPos.value.y > 0 ? this.uniforms.uSunPos.value.y * .5 + .5 : 0;
            position.normalize();
            position.multiplyScalar(2000);
            var color = this.uniforms.uColor.value.clone();
            return { position: position, intensity: intensity, color: color };
        }
    }, {
        key: 'getFogColor',
        value: function getFogColor() {
            var fog = this.uniforms.uHorHardColor.value.clone();
            var alpha = this.uniforms.cameraLookAt.value.distanceTo(this.uniforms.uSunPos.value) * 1.2;
            alpha = alpha > 1 ? 1 : alpha < 0 ? 0 : alpha;
            fog.lerp(this.uniforms.uHorColor.value, alpha * .5 * (1 + this.uniforms.uSunPos.value.y * .8));
            fog.multiplyScalar(1 + (1 - alpha) * 1.3);
            return fog.clone();
        }
    }, {
        key: 'sunPosition',
        get: function get() {
            return this.uniforms.uSunPos.value;
        },
        set: function set(value) {
            this.uniforms.uSunPos.value = value;
        }
    }, {
        key: 'horizonLine',
        get: function get() {
            return this.uniforms.uHorHardColor.value;
        }
    }, {
        key: 'horizon',
        get: function get() {
            return this.uniforms.uHorColor.value;
        }
    }, {
        key: 'sun',
        get: function get() {
            return this.uniforms.sunInt.value;
        },
        set: function set(value) {
            this.uniforms.sunInt.value = value;
        }
    }, {
        key: 'sunColor',
        get: function get() {
            return this.uniforms.uColor.value;
        }
    }, {
        key: 'atmosphere',
        get: function get() {
            return this.uniforms.uAtmColor.value;
        }
    }]);

    return shaderSky;
}(THREE.ShaderMaterial);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var shaderToon = function (_THREE$ShaderMaterial) {
    _inherits(shaderToon, _THREE$ShaderMaterial);

    function shaderToon(_ref) {
        var color = _ref.color,
            shadowColor = _ref.shadowColor,
            colorMap = _ref.colorMap,
            normalMap = _ref.normalMap;

        _classCallCheck(this, shaderToon);

        var _this = _possibleConstructorReturn(this, (shaderToon.__proto__ || Object.getPrototypeOf(shaderToon)).call(this));

        var shadow = new THREE.Color(shadowColor) || new THREE.Color('rgb(30,30,30)');

        _this.side = THREE.DoubleSide;
        _this.lights = true;

        var colorMapEnabled = true;
        if (!colorMap) {
            colorMapEnabled = false;
        }

        //enabling GL_OES_standard_derivatives
        _this.extensions.derivatives = true;

        _this.uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib['lights'], THREE.UniformsLib["shadowmap"], {
            uShadowColor: { value: shadow },
            color: { value: new THREE.Color(color) },
            colorMapEnabled: { value: colorMapEnabled },
            colorMap: { type: 't', value: colorMap },
            normalMap: { type: 't', value: normalMap },
            normalScale: { value: new THREE.Vector2(1, 1) }
        }]);

        if (colorMap) {
            _this.uniforms.repeat = { value: colorMap.repeat };
        }

        _this.vertexShader = ["varying vec3 vNormal;",
        // "varying vec3 cNormal;",
        // "varying vec3 vPos;",
        "varying vec2 vUv;", "varying vec3 vViewPosition;", THREE.ShaderChunk['shadowmap_pars_vertex'], "void main() {", "vUv = uv;", "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );", "vec4 worldPosition = modelMatrix * vec4( position, 1.0 );", "vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );", THREE.ShaderChunk['shadowmap_vertex'], "vNormal = normalize( normalMatrix * normal );", "vViewPosition = - mvPosition.xyz;",
        // "vPos = vec3((modelViewMatrix * vec4( position, 1.0 )).xyz);",
        // "cNormal = normalize( projectionMatrix * vec4(normal));",

        "}"].join("\n");

        _this.fragmentShader = ["uniform vec3 uShadowColor;", "uniform vec3 color;", "uniform bool colorMapEnabled;", "uniform sampler2D colorMap;", "uniform vec2 repeat;", "struct DirectionalLight {", "vec3 direction;", "vec3 color;", "int shadow;", "float shadowBias;", "float shadowRadius;", "vec2 shadowMapSize;", "};", "struct HemisphereLight {", "vec3 skyColor;", "vec3 direction;", "vec3 groundColor;", "};", "uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];", "#if NUM_HEMI_LIGHTS > 0", "uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];", "#endif", "varying vec3 vNormal;", "varying vec3 vPos;", "varying vec3 vViewPosition;", "varying vec2 vUv;",

        // THREE.ShaderChunk['lights_pars'],
        THREE.ShaderChunk['packing'], THREE.ShaderChunk['normalmap_pars_fragment'], THREE.ShaderChunk['shadowmap_pars_fragment'], THREE.ShaderChunk['shadowmask_pars_fragment'], "void main() {", THREE.ShaderChunk['normal_flip'], THREE.ShaderChunk['normal_fragment'], "vec3 shadowColor = uShadowColor;", "#if NUM_HEMI_LIGHTS > 0", "for(int i = 0; i < NUM_HEMI_LIGHTS; i++){", "float dotNL = dot( normal, hemisphereLights[i].direction );", "float hemiDiffuseWeight = 0.5 * dotNL + 0.5;", "vec3 irradiance = mix( hemisphereLights[i].groundColor, hemisphereLights[i].skyColor, hemiDiffuseWeight );", "shadowColor += irradiance;", "}", "#endif", "vec3 outgoingLight = vec3(1.0);", "float colorInt = length(directionalLights[0].color);", "vec3 fColor = color * directionalLights[0].color;",
        // "fColor = mix(fColor, directionalLights[0].color,colorInt);",
        "vec3 finalColor = fColor;", "if(colorMapEnabled){", "fColor = texture2D(colorMap,vUv*repeat).xyz;", "}",
        // compute direction to light
        "shadowColor = shadowColor ;", "float diffuse = 0.0;",
        // loop for THREE Lights
        // "for(int l = 0; l < NUM_POINT_LIGHTS; l++){",
        // "vec3 lDirection = vPos - pointLights[0].position;",
        // "vec3 lVector = normalize( lDirection.xyz );",
        // "diffuse += dot( normal,-lVector );",
        "diffuse += dot( normal,directionalLights[0].direction );",
        // "};",
        "if ( diffuse > 0.99 ) { finalColor = vec3(1.0) * colorInt * 3.; }", "else if ( diffuse > 0.5 ) { finalColor = fColor; }", "else if ( diffuse > -0.1 ) { finalColor = clamp(fColor,0.,1.) * (shadowColor + .5); }", "else { finalColor = clamp(fColor,0.,1.) * shadowColor; }", "gl_FragColor = vec4( finalColor*clamp(getShadowMask(),0.3,1.0),1.0);", "}"].join("\n");

        if (normalMap) {
            _this.fragmentShader = "#define USE_NORMALMAP \n" + _this.fragmentShader;
        }
        return _this;
    }

    return shaderToon;
}(THREE.ShaderMaterial);
