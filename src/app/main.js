document.addEventListener('DOMContentLoaded', () => {

    const CACHE = new Cache();
    const APP = new App();

    CACHE.onAll = function(lib){
        APP.init(lib);
    };

    CACHE.loadJSONList('build/imports.json');

})
