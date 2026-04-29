/**
 * plague.js — Efecto de partículas de plaga necrótica
 * Estética Naxxramas: burbujas verdes flotando continuamente
 */

const container = document.getElementById("plague-container");

function createParticle() {
    const particle = document.createElement("div");
    particle.classList.add("plague-particle");

    // Tamaño aleatorio
    const size = Math.random() * 8 + 4;
    particle.style.width  = size + "px";
    particle.style.height = size + "px";

    // Posición horizontal aleatoria
    particle.style.left = Math.random() * 100 + "vw";

    // Duración aleatoria
    const duration = Math.random() * 10 + 10;
    particle.style.animationDuration = duration + "s";

    // Delay para que no salgan todas a la vez
    particle.style.animationDelay = Math.random() * 5 + "s";

    container.appendChild(particle);

    // Eliminar después de que termine la animación
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

// Generador continuo: 3 partículas cada 800ms
setInterval(() => {
    for (let i = 0; i < 3; i++) {
        createParticle();
    }
}, 800);
