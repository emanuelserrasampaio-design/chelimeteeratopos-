// --- DADOS DOS PERSONAGENS ---
const CHARACTERS = {
    ninja:     { name: "Kage",     speed: 7, power: 12, hp: 100, color: "#2277ff" },
    ciborgue:  { name: "VX-9",     speed: 4, power: 18, hp: 120, color: "#888888" },
    monca:     { name: "Mei",      speed: 8, power: 10, hp: 90,  color: "#ffaa00" },
    esqueleto: { name: "Skell",    speed: 6, power: 14, hp: 95,  color: "#eeeeee" },
    demonio:   { name: "Ignis",    speed: 5, power: 16, hp: 110, color: "#ff2222" }
};

let canvas, ctx;
let player1, player2;
let gameLoopId;
let gameTime = 99;
let timerInterval;
const GRAVITY = 0.7;

// --- FUNÇÃO DE SELEÇÃO GLOBAL ---
window.selectCharacter = function(charKey) {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 576;

    const p1Stats = CHARACTERS[charKey];
    if (!p1Stats) {
        alert("Personagem não encontrado!");
        return;
    }

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
    document.getElementById('p2-name').innerText = `${p2Stats.name} (CPU)`;

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
        ctx.fillStyle = this.stats.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        ctx.fillStyle = "#000";
        const eyeX = this.facingLeft ? this.position.x + 10 : this.position.x + 40;
        ctx.fillRect(eyeX, this.position.y + 20, 10, 10);

        if (this.isAttacking) {
            ctx.fillStyle = this.attackType === 'heavy' ? 'orange' : 'yellow';
            ctx.fillRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height
            );
        }
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

        const duration = type === 'heavy' ? 250 : 150;
        setTimeout(() => {
            this.isAttacking = false;
        }, duration);
    }

    updateAI(target) {
        const dist = target.position.x - this.position.x;

        if (Math.abs(dist) > 80) {
            this.velocity.x = dist > 0 ? this.stats.speed * 0.6 : -this.stats.speed * 0.6;
        } else {
            this.velocity.x = 0;
            if (Math.random() < 0.03) {
                this.attack(Math.random() > 0.5 ? 'light' : 'heavy');
            }
        }

        if (Math.random() < 0.005 && this.isGrounded) {
            this.velocity.y = -14;
        }
    }
}

// --- CONTROLES ---
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

// --- SISTEMA DE DANO E HUD ---
function checkHit(attacker, defender) {
    if (!attacker.isAttacking) return false;

    const hit = (
        attacker.attackBox.position.x < defender.position.x + defender.width &&
        attacker.attackBox.position.x + attacker.attackBox.width > defender.position.x &&
        attacker.attackBox.position.y < defender.position.y + defender.height &&
        attacker.attackBox.position.y + attacker.attackBox.height > defender.position.y
    );

    if (hit) {
        attacker.isAttacking = false;
        const baseDamage = attacker.attackType === 'heavy' ? attacker.stats.power * 1.5 : attacker.stats.power;
        defender.health -= baseDamage;
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

// --- LOOP DA ANIMAÇÃO ---
function animate() {
    gameLoopId = requestAnimationFrame(animate);

    ctx.fillStyle = '#1a0f1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#331122';
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
