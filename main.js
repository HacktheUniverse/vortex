var camera, scene, renderer, projector, light;
var objects = [], objectsControls = [], cameraControls;
var coords1, coords2, coords3;
var lastControlsIndex = -1, controlsIndex = -1, index = -1;
var planetsToExplode = [];
//////////////settings/////////
var dirs = [];
var movementSpeed = 80;
var totalObjects = 1000;
var objectSize = 10;
var sizeRandomness = 4000;
var colors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];
/////////////////////////////////

function init() {
  // is webgl supported?
  if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
    return false;
  };

  // renderer
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize($(window).width(), $(window).height());
  renderer.setClearColor(0x00000000, 1);
  $("#container").append(renderer.domElement);

  // camera
  camera = new THREE.PerspectiveCamera(50, $(window).width()/$(window).height(), 0.1, 10000);
  camera.position.x = 500;
  camera.position.y = 500;
  camera.position.z = 500;
  var origin = new THREE.Vector3(0, 0, 0);
  camera.lookAt(origin);

  // leap camera controls
  cameraControls = new THREE.LeapCameraControls(camera);

  cameraControls.rotateEnabled  = true;
  cameraControls.rotateSpeed    = 3;
  cameraControls.rotateHands    = 1;
  cameraControls.rotateFingers  = [2, 3];
  
  cameraControls.zoomEnabled    = true;
  cameraControls.zoomSpeed      = 6;
  cameraControls.zoomHands      = 1;
  cameraControls.zoomFingers    = [4, 5];
  cameraControls.zoomMin        = 50;
  cameraControls.zoomMax        = 2000;
  
  cameraControls.panEnabled     = true;
  cameraControls.panSpeed       = 2;
  cameraControls.panHands       = 2;
  cameraControls.panFingers     = [6, 12];
  cameraControls.panRightHanded = false; // for left-handed person

  // world
  scene = new THREE.Scene(); 

  // projector
  projector = new THREE.Projector();       

  // camera target coordinate system
  coords1 = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 75, 0xcccccc);
  coords2 = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 75, 0xcccccc);
  coords3 = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 75, 0xcccccc);
  scene.add(coords1);
  scene.add(coords2);
  scene.add(coords3);

  // world coordinate system (thin dashed helping lines)
  var lineGeometry = new THREE.Geometry();
  var vertArray = lineGeometry.vertices;
  vertArray.push(new THREE.Vector3(1000, 0, 0), origin, new THREE.Vector3(0, 1000, 0), origin, new THREE.Vector3(0, 0, 1000));
  lineGeometry.computeLineDistances();
  var lineMaterial = new THREE.LineDashedMaterial({color: 0xcccccc, dashSize: 1, gapSize: 2});
  var coords = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(coords);

  // light
  light = new THREE.PointLight(0xefefef);
  light.position = camera.position;
  scene.add(light);

  // listen to resize event
  window.addEventListener('resize', onWindowResize, false);
  window.addEventListener('keypress', detonate, false );

	addStars();
	addPlanets(20);

  // render (if no leap motion controller is detected, then this call is needed in order to see the plot)
  render();
};

function changeControlsIndex() {
  if (lastControlsIndex == controlsIndex) {
    if (index != controlsIndex && controlsIndex > -2) {
      // new object or camera to control
      if (controlsIndex > -2) {
        if (index > -1) objects[index].material.color.setHex(0xefefef);
        index = controlsIndex;
        if (index > -1) objects[index].material.color.setHex(0xff0000);
      }
    };
  }; 
  lastControlsIndex = controlsIndex;
};

function transform(tipPosition, w, h) {
  var width = 150;
  var height = 150;
  var minHeight = 100;

  var ftx = tipPosition[0];
  var fty = tipPosition[1];
  ftx = (ftx > width ? width - 1 : (ftx < -width ? -width + 1 : ftx));
  fty = (fty > 2*height ? 2*height - 1 : (fty < minHeight ? minHeight + 1 : fty));
  var x = THREE.Math.mapLinear(ftx, -width, width, 0, w);
  var y = THREE.Math.mapLinear(fty, 2*height, minHeight, 0, h);
  return [x, y];
};

function showCursor(frame) {
  var hl = frame.hands.length;
  var fl = frame.pointables.length;

  if (hl == 1 && fl == 1) {
    var f = frame.pointables[0];
    var cont = $(renderer.domElement);
    var offset = cont.offset();
    var coords = transform(f.tipPosition, cont.width(), cont.height());
    $("#cursor").css('left', offset.left + coords[0] - (($("#cursor").width() - 1)/2 + 1));
    $("#cursor").css('top', offset.top + coords[1] - (($("#cursor").height() - 1)/2 + 1));
  } else {
    $("#cursor").css('left', -1000);
    $("#cursor").css('top', -1000);
  };
};

function addStars() {
	var FAR  = 10000;
	var color = new THREE.Color(1, 1, 1);
	var geometry, material, particleSystem;
	var x, y, z;
	
	for(var i=0; i<10; i++) {
		geometry = new THREE.Geometry();
		material = new THREE.ParticleBasicMaterial({
			color:0xFFFFFF,
			size:2,
			map: THREE.ImageUtils.loadTexture("assets/img/particle.png"),
			blending: THREE.AdditiveBlending,
		  transparent: true
		});
		
		for(var j=0; j<3000; j++) {
      x = (Math.random() - .5 ) * FAR/8;
      y = (Math.random() - .5 ) * FAR/8;
      z = (Math.random() - .5 ) * FAR/8;
      geometry.vertices.push( new THREE.Vector3( x , y , z ) );
		}
		
		particleSystem = new THREE.ParticleSystem(geometry, material);

		scene.add(particleSystem);
	}	
}


function getPlanetMaterialParams(planetName) {
	var params = {};
	switch(planetName) {
		case 'earth':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/earthmap.jpg");
			params['bumpMap'] = THREE.ImageUtils.loadTexture("assets/img/planets/earthmap.jpg");
			params['bumpScale'] = 0.05;
			break;
		case 'jupiter':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/jupitermap.jpg");
			break;
		case 'mars':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/marsmap1k.jpg");
			break;
		case 'mercury': 
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/mercurymap.jpg");
			params['bumpMap'] = THREE.ImageUtils.loadTexture("assets/img/planets/mercurybump.jpg");
			params['bumpScale'] = 0.00;
			break;
		case 'neptune':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/neptunemap.jpg");
			params['bumpMap'] = THREE.ImageUtils.loadTexture("assets/img/planets/neptunemap.jpg");
			params['bumpScale'] = 0.02;
			break;
		case 'pluto':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/plutomap1k.jpg");
			params['bumpMap'] = THREE.ImageUtils.loadTexture("assets/img/planets/plutobump1k.jpg");
			params['bumpScale'] = 0.00;
			break;
		case 'saturn':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/saturnmap.jpg");
			break;
		case 'uranus':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/uranusmap.jpg");
			break;
		case 'venus':
			params['map'] = THREE.ImageUtils.loadTexture("assets/img/planets/venusmap.jpg");
			params['bumpMap'] = THREE.ImageUtils.loadTexture("assets/img/planets/venusbump.jpg");
			params['bumpScale'] = 0.02;
			break;
	}
	
	return params;
};


function getRandomPlanetName(){
	var planetNames = ['earth', 'jupiter', 'mars', 
										 'mercury', 'neptune', 'pluto', 
										 'saturn', 'uranus', 'venus'];
	var randNum = Math.floor(Math.random() * planetNames.length);
	return planetNames[randNum];
}


function addPlanets(n) {
	var randPlanetName, materialParams, geometry, material, sphere, controls;

	for(var i=0; i < n; i++ ) {
		randPlanetName = getRandomPlanetName();
		materialParams = getPlanetMaterialParams(randPlanetName);
		
		geometry = new THREE.SphereGeometry(Math.floor(Math.random()*10) + 16, 32, 32);
		material = new THREE.MeshPhongMaterial(materialParams);
		
		sphere = new THREE.Mesh(geometry, material);
    sphere.position.x = Math.floor((Math.random() * 40 - Math.random() * 40) * i) * 4 + 40;
    sphere.position.y = Math.floor((Math.random() * 40 - Math.random() * 40) * i)  * 4 + 40;
    sphere.position.z = Math.floor((Math.random() * 40 - Math.random() * 40) * i)  * 4 + 40;
		
		sphere.receiveShadow = true;
		
		
    // leap object controls
		controls = new THREE.LeapObjectControls(camera, sphere);

    controls.rotateEnabled  = true;
    controls.rotateSpeed    = 3;
    controls.rotateHands    = 1;
    controls.rotateFingers  = [2, 3];
    
    controls.scaleEnabled   = true;
    controls.scaleSpeed     = 3;
    controls.scaleHands     = 1;
    controls.scaleFingers   = [4, 5];
    
    controls.panEnabled     = true;
    controls.panSpeed       = 3;
    controls.panHands       = 2;
    controls.panFingers     = [6, 12];
    controls.panRightHanded = false; // for left-handed person
		
    objects.push(sphere);
    objectsControls.push(controls);
		scene.add(sphere);
	}
}

function focusObject(frame) {
  var hl = frame.hands.length;
  var fl = frame.pointables.length;

  if (hl == 1 && fl == 1) {
    var f = frame.pointables[0];
    var cont = $(renderer.domElement);
    var coords = transform(f.tipPosition, cont.width(), cont.height());
    var vpx = (coords[0]/cont.width())*2 - 1;
    var vpy = -(coords[1]/cont.height())*2 + 1;
    var vector = new THREE.Vector3(vpx, vpy, 0.5);
    projector.unprojectVector(vector, camera);
    var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObjects(objects);
    if (intersects.length > 0) { 
      var i = 0;
      while(!intersects[i].object.visible) i++;
      var intersected = intersects[i];
      return objects.indexOf(intersected.object);
    } else {
      return -1;
    };
  };

  return -2;
};

function render() {   
  renderer.render(scene, camera);
};

function ExplodeAnimation(meshPlanet)
{
  var geometry = new THREE.Geometry();
  
  for (i = 0; i < totalObjects; i ++) 
  { 
    var vertex = new THREE.Vector3();
    vertex.x = meshPlanet.position.x;
    vertex.y = meshPlanet.position.y;
    vertex.z = meshPlanet.position.z;
  
    geometry.vertices.push( vertex );
    dirs.push({x:(Math.random() * movementSpeed)-(movementSpeed/2),y:(Math.random() * movementSpeed)-(movementSpeed/2),z:(Math.random() * movementSpeed)-(movementSpeed/2)});
  }
  var material = new THREE.ParticleBasicMaterial( { size: objectSize,  color: colors[Math.round(Math.random() * colors.length)] });
  var particles = new THREE.ParticleSystem( geometry, material );
  
  this.object = particles;
  this.status = true;
  
  this.xDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  this.yDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  this.zDir = (Math.random() * movementSpeed)-(movementSpeed/2);
  
  scene.add( this.object  ); 
  
  this.update = function(){
    if (this.status == true){
      var pCount = totalObjects;
      while(pCount--) {
        var particle =  this.object.geometry.vertices[pCount]
        particle.y += dirs[pCount].y;
        particle.x += dirs[pCount].x;
        particle.z += dirs[pCount].z;
      }
      this.object.geometry.verticesNeedUpdate = true;
    }
  }
  
};


function onWindowResize() {
  camera.aspect = $(window).width()/$(window).height();
  camera.updateProjectionMatrix();
  renderer.setSize($(window).width(), $(window).height());
  render();
};

function detonate(){
  var pCount = planetsToExplode.length;
    while(pCount--) {
      planetsToExplode[pCount].update();
    };
};

$(function(){
  init();

  // leap loop
  Leap.loop(function(frame) {
    // show cursor
    showCursor(frame);

    // set correct camera control
    controlsIndex = focusObject(frame);
    if (index == -1) {
      cameraControls.update(frame);
    } else {
      // planetsToExplode.push(new ExplodeAnimation(objectsControls[index]));
      objectsControls[index].update(frame);
    };

    // custom modifications (here: show coordinate system always on target and light movement)
    coords1.position = cameraControls.target;
    coords2.position = cameraControls.target;
    coords3.position = cameraControls.target;
    light.position   = camera.position;


    render();
  });

  // detect controls change
  setInterval(changeControlsIndex, 250);
});