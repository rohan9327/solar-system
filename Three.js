import * as THREE from "https://cdn.skypack.dev/three@0.129.0";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";

let scene, camera, renderer, controls, raycaster, mouse;
let tooltip = document.getElementById("tooltip");

const orbitRadii = {
  mercury: 50,
  venus: 60,
  earth: 70,
  mars: 80,
  jupiter: 100,
  saturn: 120,
  uranus: 140,
  neptune: 160,
};

const revolutionSpeeds = {
  mercury: 2,
  venus: 1.5,
  earth: 1,
  mars: 0.8,
  jupiter: 0.7,
  saturn: 0.6,
  uranus: 0.5,
  neptune: 0.4,
};

const planets = {};

function createSkybox() {
  const paths = [
    "images/skybox/space_ft.png",
    "images/skybox/space_bk.png",
    "images/skybox/space_up.png",
    "images/skybox/space_dn.png",
    "images/skybox/space_rt.png",
    "images/skybox/space_lf.png",
  ];
  const materials = paths.map(
    (path) =>
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(path),
        side: THREE.BackSide,
      })
  );
  const geometry = new THREE.BoxGeometry(1000, 1000, 1000);
  return new THREE.Mesh(geometry, materials);
}

function loadPlanet(name, texture, radius, segments, type = "standard") {
  const geometry = new THREE.SphereGeometry(radius, segments, segments);
  const map = new THREE.TextureLoader().load(texture);
  const material =
    type === "basic"
      ? new THREE.MeshBasicMaterial({ map })
      : new THREE.MeshStandardMaterial({ map });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  planets[name.toLowerCase()] = mesh;
  return mesh;
}

function createOrbitRing(radius) {
  const geometry = new THREE.RingGeometry(radius - 0.1, radius, 100);
  const material = new THREE.MeshBasicMaterial({
    color: "#ffffff",
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);
}

function revolvePlanet(time, speed, planet, radius) {
  const angle = time * 0.001 * speed;
  planet.position.x = planets.sun.position.x + radius * Math.cos(angle);
  planet.position.z = planets.sun.position.z + radius * Math.sin(angle);
}

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    85,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 100;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);

  // Skybox
  const skybox = createSkybox();
  scene.add(skybox);

  // Planets
  planets.sun = loadPlanet("Sun", "images/sun.jpg", 20, 100, "basic");
  planets.mercury = loadPlanet("Mercury", "images/mercury.jpg", 2, 100);
  planets.venus = loadPlanet("Venus", "images/venus.jpg", 3, 100);
  planets.earth = loadPlanet("Earth", "images/earth.jpg", 4, 100);
  planets.mars = loadPlanet("Mars", "images/mars.jpg", 3.5, 100);
  planets.jupiter = loadPlanet("Jupiter", "images/jupiter.jpg", 10, 100);
  planets.saturn = loadPlanet("Saturn", "images/saturn.jpg", 8, 100);
  planets.uranus = loadPlanet("Uranus", "images/uranus.jpg", 6, 100);
  planets.neptune = loadPlanet("Neptune", "images/neptune.jpg", 5, 100);

  // Add to scene
  Object.values(planets).forEach((planet) => scene.add(planet));

  // Orbit rings
  Object.values(orbitRadii).forEach(createOrbitRing);

  // Light
  const sunlight = new THREE.PointLight(0xffffff, 1);
  sunlight.position.copy(planets.sun.position);
  scene.add(sunlight);

  // Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousemove", onMouseMove);
}

function animate(time) {
  requestAnimationFrame(animate);

  if (!isPaused) {
    const rotSpeed = 0.005;
    Object.values(planets).forEach((planet) => {
      planet.rotation.y += rotSpeed;
    });

    // Revolution
    revolvePlanet(time, revolutionSpeeds.mercury, planets.mercury, orbitRadii.mercury);
    revolvePlanet(time, revolutionSpeeds.venus, planets.venus, orbitRadii.venus);
    revolvePlanet(time, revolutionSpeeds.earth, planets.earth, orbitRadii.earth);
    revolvePlanet(time, revolutionSpeeds.mars, planets.mars, orbitRadii.mars);
    revolvePlanet(time, revolutionSpeeds.jupiter, planets.jupiter, orbitRadii.jupiter);
    revolvePlanet(time, revolutionSpeeds.saturn, planets.saturn, orbitRadii.saturn);
    revolvePlanet(time, revolutionSpeeds.uranus, planets.uranus, orbitRadii.uranus);
    revolvePlanet(time, revolutionSpeeds.neptune, planets.neptune, orbitRadii.neptune);
  }

  controls.update(); // keep this outside pause block
  renderer.render(scene, camera);
}


function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(Object.values(planets));

  if (intersects.length > 0) {
    tooltip.style.display = "block";
    tooltip.innerText = intersects[0].object.name;
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
  } else {
    tooltip.style.display = "none";
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Sliders -> update revolutionSpeeds in real-time
function setupSpeedControls() {
  Object.keys(revolutionSpeeds).forEach((planet) => {
    const slider = document.getElementById(`speed_${planet}`);
    if (slider) {
      slider.addEventListener("input", () => {
        revolutionSpeeds[planet] = parseFloat(slider.value);
      });
    }
  });
}


// Pause / Resume Animation
let isPaused = false;
document.getElementById("toggleAnimation").addEventListener("click", function () {
  isPaused = !isPaused;
  this.innerText = isPaused ? "▶ Resume" : "⏸ Pause";
});


// Initialize
init();
setupSpeedControls();
animate(0);
