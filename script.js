const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const gravity = 0.7;

// Classe base para os lutadores
class Fighter {
    constructor({ position, velocity, color, offset }) {
        this.position = position;
        this.velocity = velocity;
        this.width = 50;
        this.height = 150;
        this.color = color;
        this.lastKey = '';
        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            offset: offset,
            width: 100,
            height: 50
        };
        this.isAttacking = false;
        this.health = 100;
    }

    draw() {
        // Corpo do personagem (Substitua por sua imagem de Pixel Art depois!)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Desenhar hitbox do ataque se estiver atacando
        if (this.isAttacking) {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
        }
    }

    update() {
        this.draw();
        
        // Atualiza a posição da caixa de ataque com base na posição do jogador
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x;
        this.attackBox.position.y = this.position.y;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        // Gravidade e chão
        if (this.position.y + this.height + this.velocity.y >= canvas.height - 50) {
            this.velocity.y = 0;
            this.position.y = canvas.height - this.height - 50; // Chão
        } else {
            this.velocity.y += gravity;
        }
    }

    attack() {
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false;
        }, 100); // O ataque dura 100 milissegundos
    }
}

// Criando o Jogador 1 (Ex: O Ninja)
const player = new Fighter({
    position: { x: 200, y: 0 },
    velocity: { x: 0, y: 0 },
    color: 'blue',
    offset: { x: 0, y: 0 }
});

// Criando o Jogador 2 (Ex: O Cyborg)
const enemy = new Fighter({
    position: { x: 700, y: 0 },
    velocity: { x: 0, y: 0 },
    color: 'red',
    offset: { x: -50, y: 0 }
});

// Teclas pressionadas
const keys = {
    a: { pressed: false },
    d: { pressed: false },
    ArrowRight: { pressed: false },
    ArrowLeft: { pressed: false }
};

// Sistema de Colisão simples
function rectCollision({ rect1, rect2 }) {
    return (
        rect1.attackBox.position.x < rect2.position.x + rect2.width &&
        rect1.attackBox.position.x + rect1.attackBox.width > rect2.position.x &&
        rect1.attackBox.position.y < rect2.position.y + rect2.height &&
        rect1.attackBox.position.y + rect1.attackBox.height > rect2.position.y
    );
}

// Loop principal do jogo
function animate() {
    window.requestAnimationFrame(animate);
    
    // Fundo da fase (Substitua por uma imagem do cenário depois!)
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar o "chão"
    ctx.fillStyle = '#444';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    player.update();
    enemy.update();

    // Movimentação Jogador 1
    player.velocity.x = 0;
    if (keys.a.pressed && player.lastKey === 'a') {
        player.velocity.x = -5;
    } else if (keys.d.pressed && player.lastKey === 'd') {
        player.velocity.x = 5;
    }

    // Movimentação Jogador 2
    enemy.velocity.x = 0;
    if (keys.ArrowLeft.pressed && enemy.lastKey === 'ArrowLeft') {
        enemy.velocity.x = -5;
    } else if (keys.ArrowRight.pressed && enemy.lastKey === 'ArrowRight') {
        enemy.velocity.x = 5;
    }

    // Detectar acerto do Jogador 1
    if (rectCollision({ rect1: player, rect2: enemy }) && player.isAttacking) {
        player.isAttacking = false;
        enemy.health -= 10;
        document.querySelector('#enemyHealth').style.width = enemy.health + '%';
    }

    // Detectar acerto do Jogador 2
    if (rectCollision({ rect1: enemy, rect2: player }) && enemy.isAttacking) {
        enemy.isAttacking = false;
        player.health -= 10;
        document.querySelector('#playerHealth').style.width = player.health + '%';
    }
}

animate();

// Comandos Fáceis
window.addEventListener('keydown', (event) => {
    switch (event.key) {
        // Jogador 1 (W A S D + Espaço para bater)
        case 'd': keys.d.pressed = true; player.lastKey = 'd'; break;
        case 'a': keys.a.pressed = true; player.lastKey = 'a'; break;
        case 'w': if(player.velocity.y === 0) player.velocity.y = -15; break; // Pulo
        case ' ': player.attack(); break; // Ataque

        // Jogador 2 (Setas + Enter para bater)
        case 'ArrowRight': keys.ArrowRight.pressed = true; enemy.lastKey = 'ArrowRight'; break;
        case 'ArrowLeft': keys.ArrowLeft.pressed = true; enemy.lastKey = 'ArrowLeft'; break;
        case 'ArrowUp': if(enemy.velocity.y === 0) enemy.velocity.y = -15; break; // Pulo
        case 'Enter': enemy.attack(); break; // Ataque
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd': keys.d.pressed = false; break;
        case 'a': keys.a.pressed = false; break;
        case 'ArrowRight': keys.ArrowRight.pressed = false; break;
        case 'ArrowLeft': keys.ArrowLeft.pressed = false; break;
    }
});
