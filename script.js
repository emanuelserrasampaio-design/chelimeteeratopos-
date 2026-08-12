// --- CONFIGURAÇÕES E BANCO DE LUTADORES ---
const CHARACTERS = {
    ninja:     { name: "Kage",     speed: 8, power: 14, hp: 100, color: "#2277ff" },
    ciborgue:  { name: "VX-9",     speed: 5, power: 20, hp: 130, color: "#888888" },
    monca:     { name: "Mei",      speed: 9, power: 12, hp: 90,  color: "#ffaa00" },
    esqueleto: { name: "Skell",    speed: 7, power: 16, hp: 100, color: "#eeeeee" },
    demonio:   { name: "Ignis",    speed: 6, power: 18, hp: 115, color: "#ff2222" }
};

let canvas, ctx;
let player1, player2;
let gameLoopId;
let gameTime = 99;
let timerInterval;
const GRAVITY = 0.7;

// --- SISTEMA DE LIKES (LOCAL STORAGE) ---
let likes = parseInt(localStorage.getItem('pixelKombatLikes')) || 0;

function updateLikeUI() {
    const countEl = document.getElementById('like-count');
    if (countEl) countEl.innerText = likes;
}

window.addLike = function() {
    likes++;
    localStorage.setItem('pixelKombatLikes', likes);
    updateLikeUI();
};

// --- FUNÇÃO DE SELEÇÃO GLOBAL ---
window.selectCharacter = function(charKey) {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 576;

    const p1Stats = CHARACTERS[charKey];
    if (!p1Stats) return;

    // Seleciona oponente aleatório
    const keysArr = Object.keys(CHARACTERS);
    const p2Key = keysArr[Math.floor(Math.random() * keysArr.length)];
    const p2Stats = CHARACTERS[p2Key];

    player1 = new Fighter({
        position: { x: 200, y: 0 },
        stats: p1Stats
    });

    player2 = new Fighter({
        position: { x: 750, y: 0 },
        stats: p2Stats,
        isAI: true,
        facingLeft: true
    });

    document.getElementById('p1-name').innerText = p1Stats.name;
    document.getElementById('p2-name').innerText = `${p2Stats.name} (CPU HARD)`;

    document.getElementById('selection-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    startTimer();
    animate();
};

// --- CLASSE DO LUTADOR ---
class Fighter {
    constructor({ position, stats, isAI = false, facingLeft = false }) {
        this.position = position;
        this.velocity = { x: 0, y: 0 };
        this.width = 60;
        this.height = 140;
        this.stats = stats;
        this.health = stats.hp;
        this.maxHealth = stats.hp;
        this.isGrounded = false;
        this.isAttacking = false;
        this.attackType = null;
        this.facingLeft = facingLeft;
        this.isAI = isAI;

        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            width: 90,
            height: 50
        };
    }

    draw() {
        // Corpo em Pixel Art simples
        const x = this.position.x;
        const y = this.position.y;
        const pSize = 12;

        const pixelMatrix = [
            [0, 1, 1, 1, 0],
            [0, 1, 2, 1, 0],
            [0, 1, 1, 1, 0],
            [1, 1, 3, 1, 1],
            [1, 1, 1, 1, 1],
            [0, 3, 3, 3, 0],
            [0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0],
            [1, 1, 0, 1, 1]
        ];

        ctx.save();
        for (let r = 0; r < pixelMatrix.length; r++) {
            for (let c = 0; c < pixelMatrix[r].length; c++) {
                const val = pixelMatrix[r][c];
                if (val === 0) continue;

                if (val === 1) ctx.fillStyle = this.stats.color;
                if (val === 2) ctx.fillStyle = '#ffffff';
                if (val === 3) ctx.fillStyle = '#000000';

                let drawX = this.facingLeft 
                    ? x + (pixelMatrix[0].length - 1 - c) * pSize
                    : x + c * pSize;

                ctx.fillRect(drawX, y + r * pSize * 1.2, pSize, pSize * 1.2);
            }
        }

        // Ataque
        if (this.isAttacking) {
            ctx.fillStyle = this.attackType === 'heavy' ? '#ff2222' : '#ffcc00';
            const atkX = this.facingLeft ? x - this.attackBox.width : x + this.width;
            ctx.fillRect(atkX, y + 40, this.attackBox.width, this.attackBox.height);
        }

        ctx.restore();
    }

    update(target) {
        if (target) {
            this.facingLeft = this.position.x > target.position.x;
        }

        this.attackBox.position.x = this.facingLeft 
            ? this.position.x - this.attackBox.width 
            : this.position.x + this.width;
        this.attackBox.position.y = this.position.y + 30;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        if (this.position.x < 0) this.position.x = 0;
        if (this.position.x + this.width > canvas.width) this.position.x = canvas.width - this.width;

        if (this.position.y + this.height + this.velocity.y >= canvas.height - 60) {
            this.velocity.y = 0;
            this.position.y = canvas.height - 60 - this.height;
            this.isGrounded = true;
        } else {
            this.velocity.y += GRAVITY;
            this.isGrounded = false;
        }

        if (this.isAI && target) this.updateAI(target);

        this.draw();
    }

    attack(type = 'light') {
        if (this.isAttacking) return;
        this.isAttacking = true;
        this.attackType = type;

        const duration = type === 'heavy' ? 200 : 120;
        setTimeout(() => {
            this.isAttacking = false;
        }, duration);
    }

    // --- INTELIGÊNCIA ARTIFICIAL MODO DIFÍCIL ---
    updateAI(target) {
        const dist = target.position.x - this.position.x;
        const absDist = Math.abs(dist);

        // Perseguição rápida e sem hesitação
        if (absDist > 70) {
            this.velocity.x = dist > 0 ? this.stats.speed * 0.95 : -this.stats.speed * 0.95;
        } else {
            this.velocity.x = 0;
            // Alta taxa de ataque quando próximo (80% de chance por frame próximo)
            if (Math.random() < 0.15) {
                this.attack(Math.random() > 0.4 ? 'heavy' : 'light');
            }
        }

        // Tenta desviar pulando se o jogador atacar
        if (target.isAttacking && absDist < 120 && this.isGrounded && Math.random() < 0.4) {
            this.velocity.y = -15;
        }

        // Pulos aleatórios agressivos para encurralar
        if (Math.random() < 0.02 && this.isGrounded) {
            this.velocity.y = -14;
        }
    }
}

// --- CONTROLES (TECLADO) ---
const keys = { a: false, d: false };

window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = true;
    if (e.key === 'd' || e.key === 'D') keys.d = true;
    if ((e.key === 'w' || e.key === 'W') && player1?.isGrounded) player1.velocity.y = -15;
    if (e.key === 'j' || e.key === 'J') player1?.attack('light');
    if (e.key === 'k' || e.key === 'K') player1?.attack('heavy');
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A') keys.a = false;
    if (e.key === 'd' || e.key === 'D') keys.d = false;
});

// --- COLISÕES E DANO ---
function checkHit(attacker, defender) {
    if (!attacker.isAttacking) return;

    const hit = (
        attacker.attackBox.position.x < defender.position.x + defender.width &&
        attacker.attackBox.position.x + attacker.attackBox.width > defender.position.x &&
        attacker.attackBox.position.y < defender.position.y + defender.height &&
        attacker.attackBox.position.y + attacker.attackBox.height > defender.position.y
    );

    if (hit) {
        attacker.isAttacking = false;
        const damage = attacker.attackType === 'heavy' ? attacker.stats.power * 1.5 : attacker.stats.power;
        defender.health -= damage;
        if (defender.health < 0) defender.health = 0;
        updateHUD();
    }
}

function updateHUD() {
    const p1Pct = (player1.health / player1.maxHealth) * 100;
    const p2Pct = (player2.health / player2.maxHealth) * 100;

    document.getElementById('p1-health').style.width = `${p1Pct}%`;
    document.getElementById('p2-health').style.width = `${p2Pct}%`;
}

function startTimer() {
    timerInterval = setInterval(() => {
        if (gameTime > 0) {
            gameTime--;
            document.getElementById('timer').innerText = gameTime;
        }
    }, 1000);
}

// --- LOOP DE ANIMAÇÃO ---
function animate() {
    gameLoopId = requestAnimationFrame(animate);

    ctx.fillStyle = '#110a18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#2b1020';
    ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

    player1.velocity.x = 0;
    if (keys.a) player1.velocity.x = -player1.stats.speed;
    if (keys.d) player1.velocity.x = player1.stats.speed;

    player1.update(player2);
    player2.update(player1);

    checkHit(player1, player2);
    checkHit(player2, player1);

    if (player1.health <= 0 || player2.health <= 0 || gameTime === 0) {
        cancelAnimationFrame(gameLoopId);
        clearInterval(timerInterval);

        let winner = "EMPATE";
        if (player1.health > player2.health) winner = `${player1.stats.name} VENCEU!`;
        if (player2.health > player1.health) winner = `${player2.stats.name} VENCEU!`;

        setTimeout(() => alert(`FIM DE JOGO: ${winner}`), 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateLikeUI();
});
