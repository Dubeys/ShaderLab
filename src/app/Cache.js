class Cache {
    constructor(){
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

    add(info){
        this.toLoad.push(info);
        this.toLoadCount++;
        this.progressEach[info.name];
    }

    loadJSONList(url){
        const loader = new THREE.FileLoader()
	    .load(
    		url
         ,
        function(data){
            let parsed = JSON.parse(data);
            this.addList(parsed);
        }.bind(this)
        )
    }

    addList(list){
        if(list.length > 0){

            for (let i in list){
                this.add(list[i]);
            }

            this.loadAll();
        }else{
            this.onAll();
        }

    }

    changeSource(libAssetName,newUrl){
        if(this.toLoad === 0){
            let info = this.lib[libAssetName];
            this.load(info);
            this.toLoadSingle = true;
        }else{
            console.warn('wait for assets to load first');
        }
    }

    load(info){
        switch (info.type) {
            case 'sound':
                Cache.loadSound.call(this,info);
            break;

            case 'texture':
                Cache.loadMap.call(this,info);
            break;

            case 'box':
                Cache.loadCube.call(this,info);
            break;

            case 'jsonObj':
                Cache.loadJsonObj.call(this,info);
            break;

            case 'level':
                Cache.loadLevel.call(this,info);
            break;


        }
    }

    loadAll(){
        for(let i in this.toLoad){
            let info = this.toLoad[i];
            this.load(info);
        }
    }

    static loaded(){

        if(!this.toLoadSingle){
            this.toLoad.pop();
            if(this.toLoad.length === 0){
                this.onAll(this.lib);
            }
        }else{
            this.onSingle(this.lib);
        }
    }

    static loadSound(info){
        let request = new XMLHttpRequest();
        request.open('GET',info.url,true);
        request.responseType = 'arraybuffer';
        request.onload = function(){
            info.raw = request.response;
            this.audioContext.decodeAudioData(info.raw,function(buffer){
                info.raw = buffer;
                this.lib[info.name] = info;
                Cache.progress.call(this,info.name,100);
                Cache.loaded.call(this);
            }.bind(this));
        }.bind(this);

        request.addEventListener('progress',function(name,e){
            Cache.progress.call(this,name,(e.loaded/e.total)*100);
        }.bind(this,info.name))

        request.send();
    }

    static loadMap(info){
        let loader = new THREE.TextureLoader();
        loader.load(
            info.url,
            function(texture){
                info.raw = texture;
                this.lib[info.name] = info;
                Cache.progress.call(this,info.name,100);
                Cache.loaded.call(this);
            }.bind(this),
            function(name,xhr){
                Cache.progress.call(this,name,(xhr.loaded/xhr.total)*100);
            }.bind(this,info.name))
    }

    static loadCube(info){
        let loader = new THREE.CubeTextureLoader()
        .setPath( info.dir )
	    .load( [
    		info.commonName + 'l.jpg',
    		info.commonName + 'r.jpg',
    		info.commonName + 'u.jpg',
    		info.commonName + 'd.jpg',
    		info.commonName + 'f.jpg',
    		info.commonName + 'b.jpg',
        ] ,
        function(texture){
            info.raw = texture;
            this.lib[info.name] = info;
            Cache.progress.call(this,info.name,100);
            Cache.loaded.call(this);
        }.bind(this),
        function(name,xhr){
            Cache.progress.call(this,name,(xhr.loaded/xhr.total)*100);
        }.bind(this,info.name));
    }

    static loadJsonObj(info){
        let loader = new THREE.JSONLoader()
	    .load(
    		info.url
         ,
        function(object){
            object.computeFaceNormals();
            info.raw = object;
            this.lib.geometries[info.name] = info;
            Cache.progress.call(this,info.name,100);
            Cache.loaded.call(this);
        }.bind(this),
        function(name,xhr){
            Cache.progress.call(this,name,(xhr.loaded/xhr.total)*100);
        }.bind(this,info.name));
    }

    static loadLevel(info){
        let loader = new THREE.FileLoader()
	    .load(
    		info.url
         ,
        function(data){
            let parsed = JSON.parse(data);
            info = parsed;
            this.lib[info.name] = info;
            Cache.progress.call(this,info.name,100);
            Cache.loaded.call(this);
        }.bind(this),
        function(name,xhr){
            Cache.progress.call(this,name,(xhr.loaded/xhr.total)*100);
        }.bind(this,info.name));
    }

    static progress(name,value){
        this.progressEach[name] = value;

        this.progressAll = 0;

        for( let prog in this.progressEach){
            this.progressAll += this.progressEach[prog];
        }

        this.progressAll /= this.toLoadCount;
        this.onProgress(this.progressAll);
    }

}
