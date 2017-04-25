class Inputs {
    constructor(){
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

        window.addEventListener('keydown',function(e){
                if(e.keyCode == '38') {
                    if(!this.upActive){
                        this.upActive = true;
                        this.upPressed = true;
                    }else{
                        this.upPressed = false;
                    }
                }

                if(e.keyCode == '40') {
                    if(!this.downActive){
                        this.downActive = true;
                        this.downPressed = true;
                    }else{
                        this.downPressed = false;
                    }
                }

                if(e.keyCode == '37') {
                    if(!this.leftActive){
                        this.leftActive = true;
                        this.leftPressed = true;
                    }else{
                        this.leftPressed = false;
                    }
                }

                if(e.keyCode == '39') {
                    if(!this.rightActive){
                        this.rightActive = true;
                        this.rightPressed = true;
                    }else{
                        this.rightPressed = false;
                    }
                }

                if(e.keyCode == '16') {
                    if(!this.shiftActive){
                        this.shiftActive = true;
                        this.shiftPressed = true;
                    }else{
                        this.shiftPressed = false;
                    }
                }

                if(e.keyCode == '77'){
                    if(!this.mActive){
                        this.mActive = true;
                        this.mPressed = true;
                    }else{
                        this.mPressed = false;
                    }
                }

                if(e.keyCode == '32'){
                    if(!this.spaceActive){
                        this.spaceActive = true;
                        this.spacePressed = true;
                    }else{
                        this.spacePressed = false;
                    }
                }

                if(e.keyCode == '27'){
                    if(!this.escapeActive){
                        this.escapeActive = true;
                        this.escapePressed = true;
                    }else{
                        this.escapePressed = false;
                    }
                }

                if(e.keyCode == '71'){
                    if(!this.gActive){
                        this.gActive = true;
                        this.gPressed = true;
                    }else{
                        this.gPressed = false;
                    }
                }

        }.bind(this))

        window.addEventListener('keyup',function(e){

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

        }.bind(this))

        this.mouse = new THREE.Vector2();
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
        this.click = false;
        this.clickActive = false;
        this.mousedown = false;
        window.addEventListener('mousemove',function(event){
            const x = this.mouse.x;
            const y = this.mouse.y;

            this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;

            this.mouse.deltaX = x - this.mouse.x;
            this.mouse.deltaY = y - this.mouse.y;
        }.bind(this))


        const canvas = document.querySelector('canvas');
        canvas.addEventListener('mousedown',function(event){
                if(!this.clickActive){
                    this.clickActive = true;
                    this.click = true;
                }else{
                    this.click = false;
                }

                event.preventDefault();
        }.bind(this))
        canvas.addEventListener('mouseup',function(event){
            this.click = false;
            this.clickActive = false;
            this.clickUp = true;
        }.bind(this))
    }

    resetPressed(){
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

    onFocus(fn){
        window.addEventListener('focus',fn);
    }

    onResize(fn){
        window.addEventListener('resize',fn);
    }
}
