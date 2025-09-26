class PlayScene extends Phaser.Scene {
    constructor(){
        super('play');
    }

    preload(){
        this.load.path = "assets/";
        this.load.image('background', 'background.png');
        this.load.image('player', 'player.png');
        this.load.image('enemy', 'enemy.png');
        this.load.image('player-0', 'player-0.png');
        this.load.image('player-1', 'player-1.png')
        this.load.image('enemy-0', 'enemy-0.png');
        this.load.image('enemy-1', 'enemy-1.png');
        this.load.image('projectile', 'projectile.png');
        this.load.image('powerup-projectile', 'powerup-1.png');
        this.load.image('powerup-slay', 'powerup-2.png');
    }

    create(){
        this.create_map();
        this.create_projectile();
        this.create_animations();
        this.create_player();
        this.create_enemies();
        this.create_powerups();
        this.create_collisions();
        this.create_hud();

        this.input.keyboard.on('keydown-ESC', () => {this.scene.start('title');});
    }

    create_map(){
        this.background = this.add.tileSprite(640/2, 480/2, 640, 480, 'background');
    }

    create_projectile(){
        this.player_projectiles = [];
        this.enemy_projectiles = [];
    }

    create_animations(scene){
        if (!this.anims.exists('player-move')){
            const anim_player_move = new Object();
            anim_player_move.key = 'player-move';                               // key to register player-move into phaser
            anim_player_move.frames = [{key: 'player-0'}, {key: 'player-1'}];   // list of frames for player-move
            anim_player_move.frameRate = 6;
            anim_player_move.repeat = -1;                                       // infinitely loop

            this.anims.create(anim_player_move);
        }

        if (!this.anims.exists('enemy-move')){
            const anim_enemy_move = new Object();
            anim_enemy_move.key = 'enemy-move';                                 // key to register player-move into phaser
            anim_enemy_move.frames = [{key: 'enemy-0'}, {key: 'enemy-1'}];      // list of frames for player-move
            anim_enemy_move.frameRate = 6;
            anim_enemy_move.repeat = -1;                                        // infinitely loop

            this.anims.create(anim_enemy_move);
        }
    }

    create_player(){
        this.player = new Player(this);
    }

    create_enemies(){
        this.enemies = [];

        const event = new Object();
        event.delay = 200;
        event.callback = this.spawn_enemy;
        event.callbackScope = this;
        event.loop = true;

        this.time.addEvent(event, this);
    }

    create_powerups() { 
        this.powerups = []; 
    
        const event = new Object(); 
        event.delay = 3000; 
        event.callback = this.spawn_powerup; 
        event.callbackScope = this; 
        event.loop = true; 
                    
        this.time.addEvent(event, this); 
    }

    create_collisions(){
        this.physics.add.overlap(this.player, this.enemies, this.game_over, null, this);
        this.physics.add.overlap(this.player_projectiles, this.enemies, this.slay_enemy, null, this);
        this.physics.add.overlap(this.enemy_projectiles,this.player,this.game_over,null,this);
        this.physics.add.overlap(this.player, this.powerups, this.collect_powerup, null, this);
    }

    create_hud(){
        this.score = 0;
        this.score_text = this.add.text(32, 32, "");
        this.score_text.depth = 3;
        this.score_text.setColor = ('rgb(255, 255, 255)');

        this.top_score_text = this.add.text(600, 32, "");
        this.top_score_text.depth = 3;
        this.top_score_text.setOrigin(1, 0);
    }

    spawn_enemy(){
        const config = {};
        config.x = 640 + 32;
        config.y = Phaser.Math.Between(0, 480);

        const monster = new Enemy(this, config);
        this.enemies.push(monster);
        this.score += 1;
    }

    slay_enemy(projectile, enemy){
        enemy.destroy();
        projectile.destroy();
    }

    spawn_powerup(){
        this.powerup_types = [ProjectilePowerUp, SlayPowerUp];
        if (Phaser.Math.Between(0, 4) !== 0) return;

        // 1. Pick up a PowerUp CLASS
        const PowerUpClass = Phaser.Utils.Array.GetRandom(this.powerup_types);

        // 2. Define the spawn position
        const position = {
            x: 640 + 32,
            y: Phaser.Math.Between(50, 430)
        };

        // 3. Instantiate the chose class and add it to a SINGLE group/array
        const powerup = new PowerUpClass(this, position.x, position.y);
        this.powerups.push(powerup);
    }

    collect_powerup(player, powerup){
        // Tell the power-up to do its thing. The scene doesn't care what it is.
        powerup.applyEffect(player);
        powerup.destroy();
    }

    update(time){
        this.update_player(time);
        this.update_enemy(time);
        this.update_background();
        this.update_score();
    }

    update_player(time){
        this.player.move();
        this.player.attack(time);
    }

    update_enemy(time){
        this.enemies.forEach(enemy => enemy.attack(time));
    }

    update_background(){
        this.background.tilePositionX += 3;
    }

    update_score(){
        this.score_text.setText("Score: " + this.score);
        const {winner, top_score} = this.registry.values;
        this.top_score_text.setText(`${winner}: ${top_score}`);
    }

    game_over(){
        const {top_score, winner} = this.registry.values;
        if (this.score >= top_score){
            this.registry.set('top_score', this.score);
            this.physics.pause();
            const winner = prompt(`Winner! Enter your name: `);
            this.registry.set('winner', winner || 'Top Score');
            this.input.keyboard.keys = [];
        }

        this.cameras.main.flash();
        this.scene.restart();
    }
}