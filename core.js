/* System constant */
const SCENE             = document.querySelector("a-scene");
const GLOBAL_CAMERA     = document.querySelector("a-camera");
const LEFT_CONTROLLER   = document.querySelector("#leftController");
const RIGHT_CONTROLLER  = document.querySelector("#rightController");

/* System variables */
var _isFirefox            = (!!navigator.mozGetUserMedia) ? true : false;
var _constructionMode     = false;
var _changeEnvironment    = false;
var _videoSelected        = false;
var _environments         = ["env0.jpg","env1.jpeg"];

function onConnect () {
   NAF.entities.createAvatar('#avatar-template', "scene", '0 1.6 0', '0 0 0');
}

/* System core */
window.addEventListener("load", function(){
  //#####################//
  /** RIGHT CONTROLLER **/
  //###################//

  RIGHT_CONTROLLER.addEventListener('gripdown', function(evt) {
    toggleConstructionMode();
  });

  RIGHT_CONTROLLER.addEventListener("mousedown", function(evt) {
    if(evt.detail.intersectedEl === null || evt.detail.intersectedEl === undefined) return;
  
    if(evt.detail.intersectedEl.id != "video") return;
    _videoSelected    = evt.detail.intersectedEl;

    // Adjust position
    _adjustedPosition = { x: 0, y: 0, z: -5 }
    _videoSelected.setAttribute('rotation'  , "0 0 0")
    _videoSelected.setAttribute("position"  , AFRAME.utils.coordinates.stringify(_adjustedPosition)) 

    SCENE.removeChild(_videoSelected);
    RIGHT_CONTROLLER.appendChild(_videoSelected);
  })

  RIGHT_CONTROLLER.addEventListener("mouseup", function(evt) {
    if(evt.detail.intersectedEl === null || evt.detail.intersectedEl === undefined) return;

    if(!_videoSelected) return;

    RIGHT_CONTROLLER.removeChild(_videoSelected);
    SCENE.appendChild(_videoSelected);

    _videoSelected.setAttribute("position", evt.detail.intersection.point);
    _videoSelected.setAttribute("rotation", AFRAME.utils.coordinates.stringify(RIGHT_CONTROLLER.components.rotation.data));
    _videoSelected = false;
  });

  // We listen for 'click' event that comes when "construction mode" is active
  RIGHT_CONTROLLER.addEventListener("click", function(evt) {
    // Will be extended for closing other windows as well
    if(evt.detail.intersectedEl.id == "closeBtn") {
      // GLOBAL_CAMERA will have to be SCENE as well
      GLOBAL_CAMERA.removeChild(evt.detail.intersectedEl.parentEl);
    }

    if(evt.detail.intersectedEl.id != "creationBox") return;

    // We create a video container
    var newScreenId = generateId(14);
    var newScreen = document.createElement("a-video");
    newScreen.setAttribute("src"          , "");
    newScreen.setAttribute("position"     , evt.detail.intersection.point);
    newScreen.setAttribute("width"        , "6");
    newScreen.setAttribute("height"       , "3");
    newScreen.setAttribute("id"           , "video")
    newScreen.setAttribute("class"        , newScreenId)
    newScreen.setAttribute("fit-texture"  , "")
    newScreen.setAttribute("rotation"     , AFRAME.utils.coordinates.stringify(RIGHT_CONTROLLER.components.rotation.data));
    SCENE.appendChild(newScreen);

    toggleConstructionMode();

    // We verify if its Firefox or not for the screen sharing
    (_isFirefox) ? shareScreen(newScreenId) : window.postMessage({ name: 'webVrStartCasting', newScreenId: newScreenId }, '*');
  });

  //####################//
  /** LEFT CONTROLLER **/
  //##################//

  LEFT_CONTROLLER.addEventListener("Xdown", function(evt) {
    if(!_videoSelected && _changeEnvironment === false) return;

    if(_videoSelected) {
      _videoSelected.setAttribute("height"  ,   Number(_videoSelected.getAttribute("height")) + 0.5);
      _videoSelected.setAttribute("width"   ,   Number(_videoSelected.getAttribute("width"))  + 0.5);
      _videoSelected.components["fit-texture"].update();
    }

    if(_changeEnvironment !== false) {
      _changeEnvironment = (_environments[_changeEnvironment+1] === undefined) ? 0 : _changeEnvironment + 1;
      document.querySelector("a-sphere").setAttribute("src", "assets/images/" + _environments[_changeEnvironment]);
    }
  })

  LEFT_CONTROLLER.addEventListener("Ydown", function(evt) {
    if(!_videoSelected && _changeEnvironment === false) return;

    if(_videoSelected) {
      _videoSelected.setAttribute("height"  ,   Number(_videoSelected.getAttribute("height")) - 0.5);
      _videoSelected.setAttribute("width"   ,   Number(_videoSelected.getAttribute("width"))  - 0.5);
      _videoSelected.components["fit-texture"].update();
    }

    if(_changeEnvironment !== false) {
      _changeEnvironment = (_environments[_changeEnvironment-1] === undefined) ? _environments.length-1 : _changeEnvironment - 1;
      document.querySelector("a-sphere").setAttribute("src", "assets/images/" + _environments[_changeEnvironment]);
    }
    
  })

  LEFT_CONTROLLER.addEventListener("triggerdown", function(evt) {
    if(_videoSelected) return; // Preventing multi actions from the user 

    if(_changeEnvironment === false) {
      var sphereEnvironment = document.createElement("a-sphere");
      sphereEnvironment.setAttribute("src", "assets/images/" + _environments[0]);
      sphereEnvironment.setAttribute("radius", "0.4");
      sphereEnvironment.setAttribute("position", "0 0 -0.7");
      sphereEnvironment.setAttribute("opacity", "0.5");
      LEFT_CONTROLLER.appendChild(sphereEnvironment);

      _changeEnvironment = 0;
    } else {
      document.querySelector("a-sky").setAttribute("src", "assets/images/" + _environments[_changeEnvironment]);
      LEFT_CONTROLLER.removeChild(document.querySelector("a-sphere"));
      _changeEnvironment = false;
    }
  })

  // FUNCTIONS
  function toggleConstructionMode() {
    if(_videoSelected) return; // If the user is moving a screen
    if(_changeEnvironment) return; // If the user is changing environment

    // If the player is not in "construction mode"
    if(!_constructionMode) {
      // We build the blue wireframe
      var wireframe = document.createElement("a-box");
      wireframe.setAttribute('position' , '0 0 -5');
      wireframe.setAttribute('wireframe', 'true');
      wireframe.setAttribute('scale'    , '6 3 0');
      wireframe.setAttribute('color'    , 'blue');
      wireframe.setAttribute('id'       , 'creationBox');
      RIGHT_CONTROLLER.appendChild(wireframe);
      RIGHT_CONTROLLER.updateComponentProperty("raycaster", "initialized", false);
    } else { // If the player is already in "construction mode"
      // We remove the blue wireframe and the raycaster
      RIGHT_CONTROLLER.removeChild(document.querySelector("#creationBox"));
      RIGHT_CONTROLLER.components.raycaster.initialized = false;
    }

    _constructionMode = !_constructionMode; // We toggle the construction mode
  }

  function generateId(length) {
    var chars   = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result  = 'a';
    for (var i  = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  }
});

// Launching the webcam before the screens
navigator.mediaDevices.getUserMedia({video: true}).then(function(stream) {
  // And we transfrom the stream to a blob that we apply as a source on the selected screen
  document.querySelector(".webcam").setAttribute("src", URL.createObjectURL(stream));

  (_isFirefox) ? shareScreen("desktop") : window.postMessage({ name: 'webVrStartCasting', newScreenId: "desktop" }, '*');
}).catch(function(err) {
  SCENE.removeChild(document.querySelector(".webcam"));

  (_isFirefox) ? shareScreen("desktop") : window.postMessage({ name: 'webVrStartCasting', newScreenId: "desktop" }, '*');
});

// Function that handle the different browser cases for screen sharing
function shareScreen(screenId, eventId) {
  var constraints, mediaToCapture;

  // We check whether its Chrome or Firefox to apply different constraints
  if(_isFirefox) { // If its Firefox
    // This "trick" allow us to capture two streams from Firefox
    mediaToCapture = (screenId == "desktop") ? "screen" : "window";

    constraints = {
      audio: false,
      video: {
        mozMediaSource: mediaToCapture,
        mediaSource: mediaToCapture
      }
    }
  } else { // If its Chrome
    mediaToCapture = "desktop";

    constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: mediaToCapture,
          chromeMediaSourceId: eventId,
          maxWidth: window.screen.width,
          maxHeight: window.screen.height
        }
      }
    }
  }

  // We call getUserMedia to get a stream
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    // And we transfrom the stream to a blob that we apply as a source on the selected screen
    document.querySelector("." + screenId).setAttribute("src", URL.createObjectURL(stream));
  }).catch(function(err) {
    console.log(err);
  });
}

// The application wait for the WebScreenVR extension to send a message
window.addEventListener("message", function(event) {
  var _eventName = event.data.name;

  // We only accept messages from ourselves
  if (event.source != window) return;

  switch(_eventName) {
    case "webVrCasting": // If a web cast has been approved, we add the stream to a screen
      shareScreen(event.data.newScreenId, event.data.id);
      break;
    case "webVrExtensionDetected": // If the extension is detected, we initiate the first screen
      window.postMessage({ name: 'webVrStartCasting', newScreenId: "desktop" }, '*')
      break;
  }
});