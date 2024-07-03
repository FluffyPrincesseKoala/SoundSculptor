<script>
    import { onMount, onDestroy } from "svelte";
    import * as THREE from "three";

    import Stats from "three/examples/jsm/libs/stats.module.js";

    import { makeWireBall, animateWireBall } from "./wireBall.js";
    import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
    import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
    import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
    import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

    var stats = Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    let camera, renderer, saveBall, group, canvas, composer;
    var saveOriginalVertices = [];
    var rotatePlane = {};

    let audioContext;

    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
    };

    group = new THREE.Group();

    const scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(
        75,
        sizes.width / sizes.height,
        0.1,
        1200,
    );
    camera.position.z = 125;

    onMount(async () => {
        // Create the renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
        });
        renderer.setSize(sizes.width, sizes.height);
        document.body.appendChild(renderer.domElement);

        var controls = new OrbitControls(camera, renderer.domElement);

        // Create the geometry
        let {
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
            spaceship,
        } = makeWireBall(scene, group);
        saveOriginalVertices = saveOriginalVerticesTmp;
        saveBall = ball;

        if (audioContext === false) {
            return;
        }
        // sample audio from mic
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(
            await navigator.mediaDevices.getUserMedia({ audio: true }),
        );
        analyser.fftSize = 256;
        source.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        var frequencyData = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(frequencyData);
        //reset the ball to its original state every 5 seconds
        const resetBall = () => {
            for (
                let i = 0;
                i < saveBall.geometry.attributes.position.array.length;
                i++
            ) {
                saveBall.geometry.attributes.position.array[i] =
                    saveOriginalVertices[i];
            }
            saveBall.geometry.attributes.position.needsUpdate = true;
            saveBall.geometry.computeVertexNormals();
        };

        // effect composer
        const randerScene = new RenderPass(scene, camera);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1,
            0.5,
            0.1,
        );
        bloomPass.threshold = 0;
        // Calculate the distance between the camera and the ball
        // const distanceToBall = camera.position.distanceTo(saveBall.position);
        // Adjust the bloom strength based on the distance
        bloomPass.strength = bloomPass.radius = -0.5;
        const outputPass = new OutputPass();

        composer = new EffectComposer(renderer);
        composer.addPass(randerScene);
        composer.addPass(bloomPass);
        composer.addPass(outputPass);

        /**
         * animate the scene
         **/
        let destroySphere = 0;
        rotatePlane = {
            active: false,
            // active: false,
            speed: 0.005,
            // 10 seconds
            interval: 1000 * 10,
            time: 0,
            reset: false,
            nbRotate: 1,
            spaceship: {
                active: false,
                direction: "right",
                speed: 0.005,
                interval: 1000 * 10,
                time: 0,
                reset: false,
                nbRotate: 1,
                doABarrelRoll: false,
                timer: {
                    play: null,
                    stop: null,
                    barellRoll: null,
                    stopBarellRoll: null,
                },
                rotationZ: 1,
            },
        };
        let lastTime = 0;
        async function animate() {
            const time = performance.now();
            stats.begin();
            requestAnimationFrame(animate);

            controls.update();

            destroySphere++;

            analyser.getByteFrequencyData(frequencyData);
            // if all frequencyData is 0, reset the audio context
            animateWireBall(frequencyData, group, rotatePlane, spaceship);

            if (destroySphere % (60 * 10) === 0) {
                resetBall();
                destroySphere = 0;
            }

            renderer.render(scene, camera);
            composer.render();
            stats.end();
        }

        await animate();

        /**
         * Event listeners
         * TODO map them to the svelte component and not the window
         */
        window.addEventListener("resize", () => {
            // Update sizes
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;

            // Update camera
            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();

            // Update renderer
            renderer.setSize(sizes.width, sizes.height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });

        window.addEventListener("keydown", (event) => {
            if (event.key === "0") {
                // 0 key
                saveBall.material = normalMaterial;
            }
            if (event.key === "1") {
                // 1 key
                saveBall.material = neonMaterial;
            }
            if (event.key === "2") {
                // 2 key
                saveBall.material = lambertMaterial;
            }
            if (event.key === "r") {
                // reset the camera
                camera.position.z = 125;
                camera.position.x = 0;
                camera.position.y = 0;
                camera.lookAt(0, 0, 0);

                // reset the ball
                resetBall();
                saveBall.material = lambertMaterial;

                // reset the plane
                rotatePlane.active = false;
                rotatePlane.reset = true;

                // reset the spaceship
                rotatePlane.spaceship.active = false;
                rotatePlane.spaceship.reset = true;
            }
            if (event.key === "ArrowRight") {
                // right arrow key
                rotatePlane.active = true;
                rotatePlane.direction = "right";
                rotatePlane.spaceship.active = true;
                rotatePlane.spaceship.direction = "right";
            }
            if (event.key === "ArrowLeft") {
                // left arrow key
                rotatePlane.active = true;
                rotatePlane.direction = "left";
                rotatePlane.spaceship.active = true;
                rotatePlane.spaceship.direction = "left";
            }
            if (event.key === "ArrowUp") {
                // up arrow key
                rotatePlane.speed += 0.005;
            }
            if (event.key === "ArrowDown") {
                // down arrow key
                rotatePlane.speed -= 0.005;
            }
            if (event.key === " ") {
                rotatePlane.active = !rotatePlane.active;
                rotatePlane.spaceship.active = !rotatePlane.spaceship.active;
            }
        });

        setInterval(resetBall, 1000);
    });

    onDestroy(() => {
        window.removeEventListener("resize", () => {});
        window.removeEventListener("keydown", () => {});
    });
</script>

<canvas bind:this={canvas}> </canvas>

<style>
    canvas {
        display: block;
    }
</style>
