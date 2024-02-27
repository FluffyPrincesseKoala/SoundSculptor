<script>
    import { onMount } from "svelte";
    import * as THREE from "three";

    let scene, camera, renderer, sphere;

    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    let canvas;
    onMount(() => {
        // Create the scene
        scene = new THREE.Scene();

        // Create the camera
        camera = new THREE.PerspectiveCamera(
            75,
            sizes.width / sizes.height,
            0.1,
            1000,
        );
        camera.position.z = 5;

        // Create the renderer
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
        });
        renderer.setSize(sizes.width, sizes.height);
        document.body.appendChild(renderer.domElement);

        // Create the sphere
        const geometry = new THREE.SphereGeometry(1, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            sphere.rotation.x += 0.01;
            sphere.rotation.y += 0.01;
            renderer.render(scene, camera);
        }

        animate();
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
    });
</script>

<canvas bind:this={canvas}></canvas>

<style>
    canvas {
        display: block;
    }
</style>
