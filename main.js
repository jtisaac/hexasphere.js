$(window).load(function(){

    var width = $(window).innerWidth();
    var height = $(window).innerHeight()-10;

    var renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( width, height);

    var cameraDistance = 65;
    var camera = new THREE.PerspectiveCamera( cameraDistance, width / height, 1, 200);
    camera.position.z = -cameraDistance;

    //var controls = new THREE.OrbitControls( camera, renderer.domElement );
    // var controls = new THREE.OrbitControls(camera, renderer.domElement);

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, cameraDistance*.4, cameraDistance * 1.2);

    var img = document.getElementById("projection");
    var projectionCanvas = document.createElement('canvas');
    var projectionContext = projectionCanvas.getContext('2d');

    projectionCanvas.width = img.width;
    projectionCanvas.height = img.height;
    projectionContext.drawImage(img, 0, 0, img.width, img.height);

    var landuse_img = document.getElementById("landuse");
    var landuseProjectionCanvas = document.createElement('canvas');
    var landuseProjectionContext = landuseProjectionCanvas.getContext('2d');

    landuseProjectionCanvas.width = landuse_img.width;
    landuseProjectionCanvas.height = landuse_img.height;
    landuseProjectionContext.drawImage(landuse_img, 0, 0, landuse_img.width, landuse_img.height);

    var elevation_img = document.getElementById("elevation");
    var elevationProjectionCanvas = document.createElement('canvas');
    var elevationProjectionContext = elevationProjectionCanvas.getContext('2d');

    elevationProjectionCanvas.width = elevation_img.width;
    elevationProjectionCanvas.height = elevation_img.height;
    elevationProjectionContext.drawImage(elevation_img, 0, 0, elevation_img.width, elevation_img.height);
    

    var pixelData = null;
    var landuseData = null;
    var elevationData = null;

    var greatest_elevation = -1;
    greatest_elevation = 217;
    var smallest_elevation = 256;
    var smallest_elevation = 8;

    var maxLat = -100;
    var maxLon = 0;
    var minLat = 0;
    var minLon = 0;

    var controls = new THREE.OrbitControls( camera, renderer.domElement );

    var projector, mouse = { x: 0, y: 0 };
    projector = new THREE.Projector();
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );

    var isLand = function(lat, lon){

        var x = parseInt(img.width * (lon + 180) / 360);
        var y = parseInt(img.height * (lat+90) / 180);

        if(pixelData == null){
            pixelData = projectionContext.getImageData(0,0,img.width, img.height);
        }
        console.log(pixelData);
        return pixelData.data[(y * pixelData.width + x) * 4] === 0;
    };

    var getLandCover = function(lat, lon){
        var x = parseInt(landuse_img.width * (lon + 180) / 360);
        var y = parseInt(landuse_img.height * (lat + 90) / 180);

        if(landuseData == null){
            landuseData = landuseProjectionContext.getImageData(0,0,landuse_img.width, landuse_img.height);
        }
        //console.log(landuseData);
        var r = landuseData.data[(y * landuseData.width + x) * 4];
        var g = landuseData.data[(y * landuseData.width + x) * 4 + 1];
        var b = landuseData.data[(y * landuseData.width + x) * 4 + 2];
        var a = landuseData.data[(y * landuseData.width + x) * 4 + 3];
        //console.log(r);
        //console.log(g);
        //console.log(b);
        //console.log(a);
        return [r, g, b];

    }

    var getShading = function(colors) {
        function componentToHex(c) {
          var hex = c.toString(16);
          return hex.length == 1 ? "0" + hex : hex;
        }

        function rgbToHex(r, g, b) {
          return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }
        var mat = new THREE.MeshBasicMaterial({color: rgbToHex(colors[0],colors[1],colors[2]), transparent: true});
        //mat.color.setRGB(r, g, b);
        //mesh.geometry.colorsNeedUpdate = true;
        return mat;
    }

    var getElevation = function(lat, lon) {
        var x = parseInt(elevation_img.width * (lon + 180) / 360);
        var y = parseInt(elevation_img.height * (lat + 90) / 180);

        if(elevationData == null){
            elevationData = elevationProjectionContext.getImageData(0,0,elevation_img.width, elevation_img.height);
        }
        //console.log(landuseData);
        var r = elevationData.data[(y * elevationData.width + x) * 4];
        var g = elevationData.data[(y * elevationData.width + x) * 4 + 1];
        var b = elevationData.data[(y * elevationData.width + x) * 4 + 2];
        //var a = elevationData.data[(y * elevationData.width + x) * 4 + 3];

        /*if (r > greatest_elevation) {
            greatest_elevation = r;
        }
        if (r < smallest_elevation) {
            smallest_elevation = r;
        }*/
        //console.log(r);
        //console.log(g);
        //console.log(b);
        // console.log(a);
        return r;

    }

    var getTerrainType = function(lat, lon, elevation_threshold) {
        var elevation = getElevation(lat, lon);
        var land_cover = getLandCover(lat, lon);
        var r = land_cover[0];
        var g = land_cover[1];
        var b = land_cover[2];

        var diff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));


        var type = "UNKNOWN";

        if (elevation > elevation_threshold * greatest_elevation) {
            type = "ORE";
        } else if (r < 50 && g < 30 && b > 80) {
            type = "WATER";
        } else if (diff < 40) {
            type = "DESERT"
        } else if (g - r > 35 && g - b > 15) {
            type = "FOREST";
        } else if (r - b > 75 && g - b > 75) {
            type = "WHEAT";
        } else if (r - b > 40 && g - b > 40) {
            type = "SHEEP";
        } else if (r > g - 50 && r > b - 50) {
            type = "BRICK";
        }
        if (type.localeCompare("UNKNOWN") == 0) {
            console.log(r.toString() + " " + g.toString() + " " + b.toString());
        }
        return type;
    }

    var getTerrainColor = function(type) {
        var tile_color = 0xa52a2a;
        if (type.localeCompare("ORE") == 0) {
            tile_color = 0x696969;
        } else if (type.localeCompare("WATER") == 0) {
            tile_color = 0x0000cd;
        } else if (type.localeCompare("DESERT") == 0) {
            tile_color = 0xeee8aa;
        } else if (type.localeCompare("FOREST") == 0) {
            tile_color = 0x008000;
        } else if (type.localeCompare("WHEAT") == 0) {
            tile_color = 0xffff00;
        } else if (type.localeCompare("SHEEP") == 0) {
            tile_color = 0x7fff00;
        } else if (type.localeCompare("BRICK") == 0) {
            tile_color = 0x8b4513;
        }
        return new THREE.MeshBasicMaterial({color: tile_color, transparent: true});
    }


    var meshMaterials = [];
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x7cfc00, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x397d02, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x77ee00, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x61b329, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x83f52c, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x83f52c, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x4cbb17, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x00ee00, transparent: true}));
    meshMaterials.push(new THREE.MeshBasicMaterial({color: 0x00aa11, transparent: true}));

    var oceanMaterial = []
    oceanMaterial.push(new THREE.MeshBasicMaterial({color: 0x0f2342, transparent: true}));
    oceanMaterial.push(new THREE.MeshBasicMaterial({color: 0x0f1e38, transparent: true}));

    var introTick = 0;
    var seenTiles = {};
    var currentTiles = [];

    var createScene = function(radius, divisions, tileSize){
        introTick = -1;
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }
        var hexasphere = new Hexasphere(radius, divisions, tileSize);
        for(var i = 0; i< hexasphere.tiles.length; i++){
            var t = hexasphere.tiles[i];
            var latLon = t.getLatLon(hexasphere.radius);

            var geometry = new THREE.Geometry();


            for(var j = 0; j< t.boundary.length; j++){
                var bp = t.boundary[j];
                geometry.vertices.push(new THREE.Vector3(bp.x, bp.y, bp.z));
            }
            geometry.faces.push(new THREE.Face3(0,1,2));
            geometry.faces.push(new THREE.Face3(0,2,3));
            geometry.faces.push(new THREE.Face3(0,3,4));
            if(geometry.vertices.length > 5){
                geometry.faces.push(new THREE.Face3(0,4,5));
            }

            /*if(isLand(latLon.lat, latLon.lon)){
                material = meshMaterials[Math.floor(Math.random() * meshMaterials.length)]
            } else {
                material = oceanMaterial[Math.floor(Math.random() * oceanMaterial.length)]
            }*/
            //getElevation(latLon.lat, latLon.lon);
            //material = getShading(getLandCover(latLon.lat, latLon.lon));
            t.terrain_type = getTerrainType(latLon.lat, latLon.lon, 0.45);
            material = getTerrainColor(t.terrain_type);

            material.opacity = 0.3;
            var mesh = new THREE.Mesh(geometry, material.clone());
            //mesh.geometry.colorsNeedUpdate = true;
            scene.add(mesh);
            hexasphere.tiles[i].mesh = mesh;

        }
        console.log(greatest_elevation);
        console.log(smallest_elevation);

        seenTiles = {};
        
        currentTiles = hexasphere.tiles.slice().splice(0,12);
        currentTiles.forEach(function(item){
            seenTiles[item.toString()] = 1;
            item.mesh.material.opacity = 1;
        });

        window.hexasphere = hexasphere;
        introTick = 0;
    };

    createScene(30, 25, .95);

    var startTime = Date.now();
    var lastTime = Date.now();
    var cameraAngle = -Math.PI/1.5;

    var tick = function(){

        var dt = Date.now() - lastTime;

        var rotateCameraBy = (2 * Math.PI)/(200000/dt);
        cameraAngle += rotateCameraBy;

        lastTime = Date.now();

        /*camera.position.x = cameraDistance * Math.cos(cameraAngle);
        camera.position.y = Math.sin(cameraAngle)* 10;
        camera.position.z = cameraDistance * Math.sin(cameraAngle);
        camera.lookAt( scene.position );*/

        renderer.render( scene, camera );

        var nextTiles = [];

        currentTiles.forEach(function(item){
            item.neighbors.forEach(function(neighbor){
                if(!seenTiles[neighbor.toString()]){
                    neighbor.mesh.material.opacity = 1;
                    nextTiles.push(neighbor);
                    seenTiles[neighbor] = 1;
                }
            });
        });

        currentTiles = nextTiles;
        controls.update();
        requestAnimationFrame(tick);

    }

    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    function clamp(val, min, max){
        return Math.min(Math.max(min, val), max);
    }

    $('.generateButton').click(function(){

        var radius = $('#radius').val();
        var subdivisions = $('#subdivisions').val();
        var tileSize = $('#tileSize').val();

        if ($.isNumeric(radius) && $.isNumeric(subdivisions) && $.isNumeric(tileSize)){
            $('#generateError').hide();
            radius = parseInt(clamp(radius, .1, 10000));
            subdivisions = parseInt(clamp(subdivisions, 1, 100));
            tileSize = parseFloat(clamp(tileSize, 0.0001, 1))

            $('#radius').val(radius);
            $('#subdivisions').val(subdivisions);
            $('#tileSize').val(tileSize);

            createScene(radius, subdivisions, tileSize);

            if($(this).prop('id') === 'generateObj'){
                var blob = new Blob([hexasphere.toObj()], {type: "text/plain;charset=utf-8"});
                saveAs(blob, 'hexasphere.obj')
            } else if($(this).prop('id') === 'generateJson'){
                var blob = new Blob([hexasphere.toJson()], {type: "application/json;charset=utf-8"});
                saveAs(blob, 'hexasphere.json')
            }
        } else {
            $('#generateError').show();
        }


    });

    window.addEventListener( 'resize', onWindowResize, false );

    $("#container").append(renderer.domElement);
    requestAnimationFrame(tick);
    window.scene = scene;
    window.createScene = createScene;

    function onDocumentMouseDown( event ) 
    {
        // the following line would stop any other event handler from firing
        // (such as the mouse's TrackballControls)
        // event.preventDefault();
        
        console.log("Click.");
        
        // update the mouse variable
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
        
        // find intersections

        // create a Ray with origin at the mouse position
        //   and direction into the scene (camera direction)
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        projector.unprojectVector( vector, camera );
        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    }

});
