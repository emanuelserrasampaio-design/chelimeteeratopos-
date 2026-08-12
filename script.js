// Configuração do Motor de Jogo
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 450,
    parent: 'game-container',
    pixelArt: true, // Garante visual Pixel Art nítido
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 900 },
            debug: false
        }
    },
    scene: [MenuScene, SelectScene, FightScene]
};

const game = new Phaser.Game(config);

// Dados dos 5 Personagens
const CHARACTERS = [
    { id: 'ninja', name: 'SHADOW', color: 0x0000ff, speed: 200, damage: 15 },
    { id: 'cyborg', name: 'CYREX', color: 0xff0000, speed: 150, damage: 25 },
    { id: 'monk', name: 'ZIN', color: 0xffff00, speed: 220, damage: 12 },
    { id: 'demon', name: 'AKUMA', color: 0x880000, speed: 160, damage: 22 },
    { id: 'valkyrie', name: 'FREYA', color: 0x00ffff, speed: 190, damage: 18 }
];

let player1Selection = 0;
let player2Selection = 1;

// ==========================================
// TELA 1: MENU PRINCIPAL
// ==========================================
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }

    create() {
        this.add.text(400, 150, 'KOMBATE PIXEL', { fontSize: '32px', fill: '#ff0000' }).setOrigin(0.5);
        this.add.text(400, 250, 'PRESSIONE ESPAÇO PARA JOGAR', { fontSize: '16px', fill: '#ffffff' }).setOrigin(0.5);
        
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('SelectScene');
        });
    }
}

// ==========================================
// TELA 2: SELEÇÃO DE PERSONAGENS (5 LUTADORES)
// ==========================================
class SelectScene extends Phaser.Scene {
    constructor() { super('SelectScene'); }

    create() {
        this.add.text(400, 50, 'SELEÇÃO DE LUTADORES', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        // Lista dos 5 Personagens na tela
        CHARACTERS.forEach((char, index) => {
            let x = 150 + (index * 125);
            let box = this.add.rectangle(x, 200, 100, 150, char.color);
            this.add.text(x, 290, char.name, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        });

        this.infoText = this.add.text(400, 370, 'P1: A/D (Escolher) - W (Confirmar)\nP2: Setas (Escolher) - Cima (Confirmar)', { fontSize: '12px', fill: '#aaa', align: 'center' }).setOrigin(0.5);

        this.setupControls();
    }

    setupControls() {
        this.input.keyboard.on('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A') player1Selection = (player1Selection - 1 + 5) % 5;
            if (e.key === 'd' || e.key === 'D') player1Selection = (player1Selection + 1) % 5;
            if (e.key === 'ArrowLeft') player2Selection = (player2Selection - 1 + 5) % 5;
            if (e.key === 'ArrowRight') player2Selection = (player2Selection + 1) % 5;
            
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                this.scene.start('FightScene');
            }
        });
    }
}

// ==========================================
// TELA 3: A LUTA (CENÁRIO, COMBATE E HUD)
// ==========================================
class FightScene extends Phaser.Scene {
    constructor() { super('FightScene'); }

    preload() {
        // AQUI ENTRARÃO SUAS ARTES EM PIXEL ART!
        // Exemplo de como carregar as Spritesheets (Animações):
        // this.load.spritesheet('ninja', 'assets/ninja.png', { frameWidth: 64, frameHeight: 64 });
        // this.load.image('bg_arena', 'assets/arena.png');
    }

    create() {
        // 1. Cenário
        this.add.rectangle(400, 225, 800, 450, 0x1a1a2e); // Fundo da Arena
        const ground = this.add.rectangle(400, 430, 800, 40, 0x16213e); // Chão
        this.physics.add.existing(ground, true);

        // 2. Criar Jogadores
        const p1Data = CHARACTERS[player1Selection];
        const p2Data = CHARACTERS[player2Selection];

        this.p1 = this.createFighter(200, 300, p1Data);
        this.p2 = this.createFighter(600, 300, p2Data);

        // Colisões com chão e limites
        this.physics.add.collider(this.p1, ground);
        this.physics.add.collider(this.p2, ground);

        // 3. Interface (Barras de Vida)
        this.p1Health = 100;
        this.p2Health = 100;

        this.p1Bar = this.add.rectangle(200, 40, 300, 20, 0x00ff00);
        this.p2Bar = this.add.rectangle(600, 40, 300, 20, 0x00ff00);
        this.add.text(200, 20, p1Data.name, { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(600, 20, p2Data.name, { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);

        // 4. Controles
        this.keys = this.input.keyboard.addKeys({
            p1Left: 'A', p1Right: 'D', p1Jump: 'W', p1Attack: 'SPACE',
            p2Left: 'LEFT', p2Right: 'RIGHT', p2Jump: 'UP', p2Attack: 'ENTER'
        });
    }

    createFighter(x, y, data) {
        const fighter = this.add.rectangle(x, y, 40, 80, data.color);
        this.physics.add.existing(fighter);
        fighter.body.setCollideWorldBounds(true);
        fighter.stats = data;
        fighter.canAttack = true;
        return fighter;
    }

    update() {
        // Movimentação P1
        if (this.keys.p1Left.isDown) this.p1.body.setVelocityX(-this.p1.stats.speed);
        else if (this.keys.p1Right.isDown) this.p1.body.setVelocityX(this.p1.stats.speed);
        else this.p1.body.setVelocityX(0);

        if (this.keys.p1Jump.isDown && this.p1.body.touching.down) this.p1.body.setVelocityY(-500);

        // Movimentação P2
        if (this.keys.p2Left.isDown) this.p2.body.setVelocityX(-this.p2.stats.speed);
        else if (this.keys.p2Right.isDown) this.p2.body.setVelocityX(this.p2.stats.speed);
        else this.p2.body.setVelocityX(0);

        if (this.keys.p2Jump.isDown && this.p2.body.touching.down) this.p2.body.setVelocityY(-500);

        // Ataque P1
        if (Phaser.Input.Keyboard.JustDown(this.keys.p1Attack)) {
            this.executeAttack(this.p1, this.p2, true);
        }

        // Ataque P2
        if (Phaser.Input.Keyboard.JustDown(this.keys.p2Attack)) {
            this.executeAttack(this.p2, this.p1, false);
        }
    }

    executeAttack(attacker, defender, isP1) {
        if (!attacker.canAttack) return;

        attacker.canAttack = false;

        // Efeito visual do Ataque (Hitbox temporária)
        const hitX = isP1 ? attacker.x + 40 : attacker.x - 40;
        const hitbox = this.add.rectangle(hitX, attacker.y, 40, 40, 0xffffff);
        this.physics.add.existing(hitbox);

        // Checa se acertou o inimigo
        if (Phaser.Geom.Intersects.RectangleToRectangle(hitbox.getBounds(), defender.getBounds())) {
            if (isP1) {
                this.p2Health = Math.max(0, this.p2Health - attacker.stats.damage);
                this.p2Bar.width = (this.p2Health / 100) * 300;
            } else {
                this.p1Health = Math.max(0, this.p1Health - attacker.stats.damage);
                this.p1Bar.width = (this.p1Health / 100) * 300;
            }

            // Efeito visual de Dano (Piscar vermelho)
            defender.fillColor = 0xffffff;
            this.time.delayedCall(100, () => defender.fillColor = defender.stats.color);
        }

        // Remove hitbox do ataque
        this.time.delayedCall(150, () => {
            hitbox.destroy();
            attacker.canAttack = true;
        });
    }
}
