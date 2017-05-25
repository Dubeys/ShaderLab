"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var shaderPostLut = function (_THREE$ShaderMaterial) {
    _inherits(shaderPostLut, _THREE$ShaderMaterial);

    function shaderPostLut() {
        _classCallCheck(this, shaderPostLut);

        var _this = _possibleConstructorReturn(this, (shaderPostLut.__proto__ || Object.getPrototypeOf(shaderPostLut)).call(this));

        _this.uniforms = {
            render: { value: null },
            lut: { value: null }
        };

        _this.vertexShader = "\n            varying vec2 vUv;\n\n            void main(){\n                vUv = uv;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n            }\n        ";

        _this.fragmentShader = "\n            uniform sampler2D render;\n            uniform sampler2D lut;\n\n            varying vec2 vUv;\n\n            // Ref: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#No_3D_Texture_support\n            vec4 sampleAs3DTexture( sampler2D tex, vec3 texCoord, float size ) {\n              float sliceSize = 1.0 / size;                         // space of 1 slice\n              float slicePixelSize = sliceSize / size;              // space of 1 pixel\n              float sliceInnerSize = slicePixelSize * (size - 1.0); // space of size pixels\n              float zSlice0 = min(floor(texCoord.z * size), size - 1.0);\n              float zSlice1 = min(zSlice0 + 1.0, size - 1.0);\n              float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;\n              float s0 = xOffset + (zSlice0 * sliceSize);\n              float s1 = xOffset + (zSlice1 * sliceSize);\n              vec4 slice0Color = texture2D(tex, vec2(s0, texCoord.y));\n              vec4 slice1Color = texture2D(tex, vec2(s1, texCoord.y));\n              float zOffset = mod(texCoord.z * size, 1.0);\n              return mix(slice0Color, slice1Color, zOffset);\n            }\n\n            void main(){\n                vec4 image = texture2D(render,vUv);\n                image.y = 1. - image.y;\n                vec4 colorCorect = sampleAs3DTexture(lut,image.xyz,16.);\n                gl_FragColor = colorCorect;\n            }\n        ";

        return _this;
    }

    _createClass(shaderPostLut, [{
        key: "lut",
        set: function set(img) {
            this.uniforms.lut.value = img;
        }
    }, {
        key: "render",
        set: function set(img) {
            this.uniforms.render.value = img;
        }
    }]);

    return shaderPostLut;
}(THREE.ShaderMaterial);
