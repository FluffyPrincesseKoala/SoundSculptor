import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { lerp } from "three/src/math/MathUtils.js";

var noise = new SimplexNoise();

const mouvementValue = 1
const zmin = -1200
const base = 400

function loadSpaceship(scene) {
    // Instantiate a loader
    const loader = new GLTFLoader();

    // Optional: Provide a DRACOLoader instance to decode compressed mesh data
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    var spaceship = new THREE.Object3D();
    // Load a glTF resource
    loader.load(
        // resource URL
        'scene.gltf',
        // called when the resource is loaded
        function (gltf) {
            gltf.scene.scale.set(1, 1, 1);
            gltf.scene.position.set(10, -10, 10);
            gltf.scene.rotation.set(
                0,
                Math.PI,
                0
            )

            // change the color of the spaceship
            gltf.scene.traverse(function (child) {
                if (child.isMesh) {
                    // child.material.color.set(0xe2825c);
                    child.material.emissive.set(0x5551a1);
                    child.material.emissiveIntensity = 0.25;
                }
            });
            spaceship.add(gltf.scene);
        },
        // called while loading is progressing
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // called when loading has errors
        function (error) {
            console.log('An error happened');
        }
    );


    //

    scene.add(spaceship);

    return spaceship
}

function makeWireBall(scene, group) {
    // create a wireframe spaceship

    var spaceship = loadSpaceship(scene);

    var planeGeometry = new THREE.PlaneGeometry(245, 400, 20, 20);
    var planeMaterial = new THREE.MeshLambertMaterial({
        color: 0x6904ce,
        side: THREE.DoubleSide,
        wireframe: true,
    });

    var planes = [];

    for (let i = 0; i < 12; i++) {
        var plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -0.5 * Math.PI;

        if (i % 2 === 0) {
            plane.position.y = -60;
            plane.baseY = -60;
        } else {
            plane.position.y = 60;
            plane.baseY = 60;
        }


        if (i < 2) {
            plane.position.z = zmin
            plane.baseZ = zmin
        } else if (i < 4 && i >= 2) {
            plane.position.z = -base
            plane.baseZ = -base
        } else if (i < 6 && i >= 4) {
            plane.position.z = 0
            plane.baseZ = 0
        } else if (i < 8 && i >= 6) {
            plane.position.z = base * 2
            plane.baseZ = base * 2
        } else if (i < 10 && i >= 8) {
            plane.position.z = base * 3
            plane.baseZ = base * 3
        } else {
            plane.position.z = base * 4
            plane.baseZ = base * 4
        }

        group.add(plane); // add to the group
    }


    var icosahedronGeometry = new THREE.IcosahedronGeometry(10, 4);
    var lambertMaterial = new THREE.MeshLambertMaterial({
        color: "rgb(255, 1, 1)",
        wireframe: true,
    });
    var normalMaterial = new THREE.MeshNormalMaterial({ wireframe: true });

    // néon mesh
    var neonMaterial = new THREE.MeshStandardMaterial({
        color: 0xff00ee,
        emissive: 0xff00ee,
        emissiveIntensity: 0.8,
        wireframe: true,
    });

    var ball = new THREE.Mesh(icosahedronGeometry, lambertMaterial);
    ball.position.set(0, 0, 0);
    group.add(ball);

    const saveOriginalVerticesTmp = [];
    for (let i = 0; i < ball.geometry.attributes.position.array.length; i++) {
        saveOriginalVerticesTmp[i] = ball.geometry.attributes.position.array[i];
    }

    var ambientLight = new THREE.AmbientLight(0xaaaaaa);
    scene.add(ambientLight);

    // add stars background
    var starsGeometry = new THREE.BufferGeometry();
    var starsMaterial = new THREE.PointsMaterial({
        color: 0x888888,
        size: 0.1,
    });

    var starsVertices = [];

    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 1) / window.innerWidth * 1;
        const y = (Math.random() - 1) / window.innerHeight * 1;
        const z = -100;
        // const z = (Math.random() - 0.5) * 2000;

        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    var stars = new THREE.Points(starsGeometry, starsMaterial);

    scene.add(stars);

    scene.add(group);
    return {
        planeGeometry,
        planeMaterial,
        planes,
        icosahedronGeometry,
        lambertMaterial,
        normalMaterial,
        ball,
        ambientLight,
        saveOriginalVerticesTmp,
        neonMaterial,
        spaceship
    }
}


function animateWireBall(frequencyData, group, rotatePlane, spaceship) {
    const children = group.children;
    const ball = children[children.length - 1];
    const planes = children.slice(0, children.length - 1);

    var lowerHalfArray = frequencyData.slice(0, (frequencyData.length / 2) - 1);
    var upperHalfArray = frequencyData.slice(
        (frequencyData.length / 2) - 1,
        frequencyData.length - 1
    );

    const overallAvg = avg(frequencyData);
    const lowerMax = max(lowerHalfArray);
    const lowerAvg = avg(lowerHalfArray);
    const upperMax = max(upperHalfArray);
    const upperAvg = avg(upperHalfArray);

    const lowerMaxFr = lowerMax / lowerHalfArray.length;
    const lowerAvgFr = lowerAvg / lowerHalfArray.length;
    const upperMaxFr = upperMax / upperHalfArray.length;
    const upperAvgFr = upperAvg / upperHalfArray.length;

    // get highest number from the frequency array
    const highestFr = Math.max(...frequencyData);

    const debug = document.getElementById("debug");
    debug.innerHTML = `
    overallAvg: ${Math.floor(overallAvg)}<br>
    lowerMax: ${Math.floor(lowerMax)}<br>
    lowerAvg: ${Math.floor(lowerAvg)}<br>
    upperMax: ${Math.floor(upperMax)}<br>
    upperAvg: ${Math.floor(upperAvg)}<br>
    highestFr: ${Math.floor(highestFr)}<br>
    `;
    makeRoughBall(
        ball,
        modulate(lowerAvgFr, 0, 1, 0, 8),
        modulate(upperMaxFr, 0, 1, 0, 4),
    );


    // rotate the ball each time the bass frequency is higher than 140 (to the right)
    if (lowerMax > 50) {
        ball.rotation.x += 0.01;
    }
    if (upperMax > 50) {
        ball.rotation.y += 0.01;
    }
    if (overallAvg > 10) {
        ball.rotation.z += 0.01;
    }

    for (let i = 0; i < planes.length; i++) {
        const plane = planes[i];

        if (i % 2 === 0) {
            makeRoughGround(plane, modulate(upperAvgFr, 0, 1, 0.5, 4));
        } else {
            makeRoughGround(plane, modulate(lowerMaxFr, 0, 1, 0.5, 4));
        }
        const campledColor = modulate(overallAvg, 0, 255, 0, 1);
        plane.material.color.setHSL(campledColor, 0.5, 0.5);

        plane.position.z -= mouvementValue

        if (plane.position.z <= zmin) {
            plane.position.z = base
        }

        if (rotatePlane.active === true) {
            if (rotatePlane.direction === "left") {
                plane.rotation.y -= rotatePlane.speed;
            } else {
                plane.rotation.y += rotatePlane.speed
            }
        }
        if (rotatePlane.reset) {
            plane.rotation.y = 0;
        }

    }
    if (rotatePlane.reset) {
        rotatePlane.reset = false;
    }

    // rotation
    const xwing = rotatePlane.spaceship
    if (rotatePlane.active === true) {
        if (
            planes[0].rotation.y <= -Math.PI * rotatePlane.nbRotate ||
            planes[0].rotation.y >= Math.PI * rotatePlane.nbRotate
        ) {
            rotatePlane.active = false;
            if (rotatePlane.direction === "left") {
                rotatePlane.direction = "right"
                xwing.direction = "right"
            } else {
                rotatePlane.direction = "left"
                xwing.direction = "left"
            }
        }
    }
    updateSpaceship(spaceship, rotatePlane)
}

function updateSpaceship(spaceship, rotatePlane) {
    const xwing = rotatePlane.spaceship
    if (spaceship && xwing.active === true) {
        if (rotatePlane.active === false) {
            if (xwing.timer.play === null) {
                xwing.timer.play = setInterval(() => {
                    if (xwing.active === false) {
                        xwing.active = true
                    } else {
                        clearInterval(xwing.timer.play)
                        xwing.active = false
                        xwing.timer.play = null
                    }
                }, 1000 * 15);
            } else if (xwing.timer.stop === null) {
                xwing.timer.stop = setInterval(() => {
                    if (xwing.active === true) {
                        xwing.active = false
                    } else {
                        clearInterval(xwing.timer.stop)
                        xwing.active = true
                        xwing.timer.stop = null
                    }
                }, 1000 * 10);
            }
        }

        if (xwing.direction === "left") {
            spaceship.rotation.z -= 0.02;
        } else {
            spaceship.rotation.z += 0.02;
        }


    }

    if (xwing.active === false) {
        hoverSpaceship(spaceship, rotatePlane)
    }

    if (xwing.doABarrelRoll === true) {
        const spaceshipOrigin = spaceship.children[0]
        if (xwing.direction === "left") {
            spaceshipOrigin.rotation.z -= 0.1;
        } else {
            spaceshipOrigin.rotation.z += 0.1;
        }
        // stop in 1 second
        xwing.timer.stopBarellRoll = setTimeout(() => {
            xwing.doABarrelRoll = false
            clearInterval(xwing.timer.barellRoll)
        }, 1000);
    }

    if (xwing.doABarrelRoll === false) {
        xwing.timer.barellRoll = setTimeout(() => {
            xwing.doABarrelRoll = true
            clearInterval(xwing.timer.stopBarellRoll)
        }, 2000);
    }

    if (xwing.reset) {
        spaceship.position.set(10, -10, 10)
        xwing.active = false
        xwing.reset = false
    }
}

function resetPlanePosition(planes) {
    for (let i = 0; i < planes.length; i++) {
        const plane = planes[i];
        plane.position.z = plane.baseZ
        plane.rotation.x = -0.5 * Math.PI;
    }
}

function makeRoughBall(mesh, bassFr, treFr) {
    const vertices = mesh.geometry.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = new THREE.Vector3(
            vertices[i],
            vertices[i + 1],
            vertices[i + 2],
        );
        var amp = 2.5;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance =
            mesh.geometry.parameters.radius + // offset
            bassFr +
            noise.noise3d(
                vertex.x + time * rf * 7.0,
                vertex.y + time * rf * 8.0,
                vertex.z + time * rf * 9.0,
            ) *
            amp * // amplify
            treFr;
        vertex.multiplyScalar(distance);

        vertices[i] = vertex.x;
        vertices[i + 1] = vertex.y;
        vertices[i + 2] = vertex.z;
    }

    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

function makeRoughGround(mesh, distortionFr) {
    const vertices = mesh.geometry.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
        const vertex = new THREE.Vector3(
            vertices[i],
            vertices[i + 1],
            vertices[i + 2],
        );
        const amp = 1;
        const time = Date.now();
        const distance =
            (noise.noise(vertex.x + time * 0.0003, vertex.y + time * 0.0001) + 0) *
            distortionFr *
            amp;
        vertex.z = distance;
        vertices[i + 2] = vertex.z;
    }

    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
}

function fractionate(val, minVal, maxVal) {
    return (val - minVal) / (maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    const fr = fractionate(val, minVal, maxVal);
    const delta = outMax - outMin;
    return outMin + fr * delta;
}

function avg(arr) {
    return arr.reduce((a, b) => a + b) / arr.length;

}

function max(arr) {
    return arr.reduce(function (a, b) {
        return Math.max(a, b);
    });
}

const hoverSpaceship = (spaceship, rotatePlane) => {
    const time = window.performance.now();
    const t = Math.sin(time * 0.00001); // Smooth transition parameter
    // Interpolate smoothly with current position
    const normalizedY = (spaceship.position.y) / 2000;
    const normalizedZ = (spaceship.position.z) / 2000;
    const normalizedX = (spaceship.position.x) / 2000;
    let newY, newZ, newX;

    if (rotatePlane.spaceship.direction === "left" && spaceship.position > 0) {
        // interpolate the position
        // const newY = normalizedY
        newY = -lerp(normalizedY, spaceship.position.y, t);
        newZ = -lerp(normalizedZ, spaceship.position.z, t);
        newX = lerp(normalizedX, spaceship.position.x, t);
    } else if (rotatePlane.spaceship.direction === "right" && spaceship.position > 0) {
        newY = lerp(normalizedY, spaceship.position.y, t);
        newZ = -lerp(normalizedZ, spaceship.position.z, t);
        newX = -lerp(normalizedX, spaceship.position.x, t);
    } else if (rotatePlane.spaceship.direction === "left" && spaceship.position < 0) {
        newY = lerp(normalizedY, spaceship.position.y, t);
        newZ = -lerp(normalizedZ, spaceship.position.z, t);
        newX = -lerp(normalizedX, spaceship.position.x, t);
    } else if (rotatePlane.spaceship.direction === "right" && spaceship.position < 0) {
        newY = -lerp(normalizedY, spaceship.position.y, t);
        newZ = -lerp(normalizedZ, spaceship.position.z, t);
        newX = lerp(normalizedX, spaceship.position.x, t);
    } else {
        newY = Math.sin(time * 0.001) * 10;
        newZ = lerp(normalizedZ, spaceship.position.z, t);
        newX = Math.cos(time * 0.001) * 10;
    }

    // set the new position
    spaceship.position.y = newY || spaceship.position.y;
    spaceship.position.z = newZ || spaceship.position.z;
    spaceship.position.x = newX || spaceship.position.x;

}

export { makeWireBall, animateWireBall, resetPlanePosition };