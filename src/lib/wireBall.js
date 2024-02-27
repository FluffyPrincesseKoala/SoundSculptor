import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
var noise = new SimplexNoise();

const mouvementValue = 1
const zmin = -1200
const base = 400

function makeWireBall(scene, group, saveOriginalVertices) {

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

    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-10, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;
    scene.add(spotLight);
    //light helper
    var spotLightHelper = new THREE.SpotLightHelper(spotLight);
    scene.add(spotLightHelper);


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
        spotLight,
        saveOriginalVerticesTmp,
        neonMaterial,
    }
}


function animateWireBall(frequencyData, group, rotatePlane) {
    const children = group.children;
    const ball = children[children.length - 1];
    const planes = children.slice(0, children.length - 1);

    var lowerHalfArray = frequencyData.slice(10, frequencyData.length / 2 - 10);
    var upperHalfArray = frequencyData.slice(
        frequencyData.length / 2 - 10,
        frequencyData.length - 10,
    );

    var lowerMax = max(lowerHalfArray);
    var lowerAvg = avg(lowerHalfArray);
    var upperAvg = avg(upperHalfArray);

    var lowerMaxFr = lowerMax / lowerHalfArray.length;
    var upperAvgFr = upperAvg / upperHalfArray.length;

    for (let i = 0; i < planes.length; i++) {
        const plane = planes[i];
        if (i % 2 === 0) {
            makeRoughGround(plane, modulate(upperAvg, 0, 1, 0.5, upperAvgFr));
        } else {
            makeRoughGround(plane, modulate(lowerMaxFr, 0, 1, 0.5, lowerMaxFr));
        }
        plane.material.color.setHSL(0.5, 0.5, 0.5);

        plane.position.z -= mouvementValue

        if (plane.position.z <= zmin) {
            plane.position.z = base
        }

        if (rotatePlane.active === true) {
            if (rotatePlane.direction === "left") {
                plane.rotation.y += 0.01;
            } else {
                plane.rotation.y -= 0.01;
            }
        }
        if (rotatePlane.reset) {
            plane.rotation.y = 0;
        }

    }
    if (rotatePlane.reset) {
        rotatePlane.reset = false;
    }

    // every 100 seconds, start the plane rotation
    // if (rotatePlane.active === false) {
    //     if (rotatePlane.time === 0) {
    //         rotatePlane.time = Date.now();
    //     } else if (Date.now() - rotatePlane.time > 1000) {
    //         rotatePlane.active = true;
    //         rotatePlane.time = 0;
    //     }
    // }

    // if plane did a full rotation, stop the rotation
    if (rotatePlane.active === true) {
        console.log(planes[0].rotation.y);
        if (planes[0].rotation.y >= Math.PI || planes[0].rotation.y <= -Math.PI) {
            rotatePlane.active = false;
            rotatePlane.reset = true;

            setTimeout(() => {
                rotatePlane.active = true
                if (rotatePlane.direction === "left") {
                    rotatePlane.direction = "right"
                } else {
                    rotatePlane.direction = "left"
                }
            }, 10000);
        }
    }

    makeRoughBall(
        ball,
        modulate(Math.pow(lowerMaxFr, 0.8), 0, 1, 0, 8),
        modulate(upperAvgFr, 0, 1, 0, 4),
    );
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
        var offset = mesh.geometry.parameters.radius;
        var amp = 2.5;
        var time = window.performance.now();
        vertex.normalize();
        var rf = 0.00001;
        var distance =
            offset +
            bassFr +
            noise.noise3d(
                vertex.x + time * rf * 7,
                vertex.y + time * rf * 8,
                vertex.z + time * rf * 9,
            ) *
            amp *
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
        var amp = 1;
        var time = Date.now();
        var distance =
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
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + fr * delta;
}

function avg(arr) {
    var total = arr.reduce(function (sum, b) {
        return sum + b;
    });
    return total / arr.length;
}

function max(arr) {
    return arr.reduce(function (a, b) {
        return Math.max(a, b);
    });
}

export { makeWireBall, animateWireBall, resetPlanePosition };