FBInstant.loading.complete();
var state = new Kiwi.State('Play');
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


state.preload = function () {

  this.addImage( 'grid', './assets/img/background/background_1.png' );
  this.addSpriteSheet('player', './assets/img/fox/spritesheet_small.png', 100, 95 );
  this.addImage( 'missile', './assets/img/anime/missile.png');
  this.addImage( 'sprite', './assets/img/anime/sprite.png');

  this.score = new Kiwi.HUD.Widget.BasicScore( this.game, 50, 50, 0 );
  this.game.huds.defaultHUD.addWidget( this.score );

  this.score.style.color = 'black';
  this.addImage( 'poke', './assets/img/pokeb.png' );
  this.addSpriteSheet('ground', './assets/img/shapes/square.png', 70, 70 );
};

state.create = function () {

  // Define movement constants
  this.MAX_SPEED = 75; // pixels/second
  this.ACCERATION = 100;
  this.DRAG = 50;
  this.GRAVITY = 150;
  this.JUMP_SPEED = -200;

  this.SHOT_DELAY = 100; // milliseconds (10 bullets/second)
  this.BULLET_SPEED = 100; // pixels/second
  this.NUMBER_OF_BULLETS = 20;

  this.background = new Kiwi.GameObjects.StaticImage( this, this.textures.grid, 0, 0 );
  this.addChild(this.background);

  this.step = 3;

  this.upKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.UP, true );
  this.downKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.DOWN, true );
  this.rightKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.RIGHT, true );
  this.leftKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.LEFT, true );
  this.spacebar = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.SPACEBAR, true);

  // Enable physics on the player
  this.player = new Kiwi.GameObjects.Sprite( this, this.textures.player, 100, 95 );
  this.player.animation.add( 'run', [ 0, 1 ], 0.1, true );
  this.player.animation.add( 'jump' [  1  ], 0.1, true );
  this.player.animation.play( 'run' );

  this.player.physics = this.player.components.add(new Kiwi.Components.ArcadePhysics(this.player, this.player.box));
  this.player.physics.acceleration.y = this.GRAVITY;
  this.player.physics.maxVelocity = this.MAX_SPEED;
  this.player.physics.drag.x = this.DRAG;
  this.addChild( this.player );
  this.playerrect = new Kiwi.Geom.Rectangle( this.player.x, this.player.y, this.player.width, this.player.height );

  // Create some ground for the player to walk on
  this.ground = new Kiwi.Group( this );
  this.addChild( this.ground );
  for(var x = 0; x < this.game.stage.width; x += 70) {
      // Add the ground blocks, enable physics on each, make them immovable
      var groundBlock = new Kiwi.GameObjects.Sprite(this, this.textures.ground, x, 600 );
      groundBlock.alpha = 0;
      groundBlock.physics = groundBlock.components.add(new Kiwi.Components.ArcadePhysics(groundBlock, groundBlock.box));
      groundBlock.physics.immovable = true;
      this.ground.addChild( groundBlock );
  }

  this.missile = new Kiwi.GameObjects.Sprite( this, this.textures.missile, 500, 400);
  this.addChild( this.missile );
  this.missilerect = new Kiwi.Geom.Rectangle( this.missile.x, this.missile.y, this.missile.width, this.missile.height );

  this.sprite = new Kiwi.GameObjects.Sprite( this, this.textures.sprite, 500, 400);
  this.addChild( this.sprite );
  this.spriterect = new Kiwi.Geom.Rectangle( this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height );

  this.scoreText = new Kiwi.GameObjects.Textfield(this, 'Score:', 10, 10, '#000');
  this.addChild( this.scoreText );

  this.collisionState = false;

  // Set the pivot point to the center of the gun
  this.player.anchorPointX = this.player.width * 0.5;
  this.player.anchorPointY = this.player.height * 0.5;

  // Create an object pool of bullets
  this.bulletPool = new Kiwi.Group( this );
  this.addChild ( this.bulletPool );
  for( var i = 0; i < this.NUMBER_OF_BULLETS; i++ ) {
      // Create each bullet and add it to the group.
      var bullet = new Kiwi.GameObjects.Sprite( this, this.textures.poke, -100, -100 );
      this.bulletPool.addChild( bullet );

      // Set the pivot point to the center of the bullet
      bullet.anchorPointX = this.player.width * 0.5;
      bullet.anchorPointY = this.player.height * 0.5;

      // Enable physics on the bullet
      bullet.physics = bullet.components.add(new Kiwi.Components.ArcadePhysics(bullet, bullet.box));

      // Set its initial state to "dead".
      bullet.alive = false;
  }

  this.running = true;
}

state.update = function () {
  Kiwi.State.prototype.update.call( this );

  this.playerrect.x = this.player.x;
  this.playerrect.y = this.player.y;
  this.playerrect.width = this.player.width;
  this.playerrect.height = this.player.height;

  // Collide the player with the ground
  this.player.physics.overlapsGroup(this.ground, true);

  if (this.running) {
    this.missile.x -= 5;
    this.missilerect.x -= 5;
    if(this.missile.x < -this.missile.width ) {
  	 this.missile.x = 800;
      this.missilerect.x = 800;
      this.missile.y = 500;
      this.missilerect.y = this.missile.y;
    }

    this.missile.x -= 5;
    this.missilerect.x -= 5;
    if(this.missile.x < -this.missile.width ) {
        this.collisionState = false;
        this.missile.x = 800;
        this.missilerect.x = 800;
        this.missile.y = getRandomInt(0, 500);
        this.missilerect.y = this.missile.y;
    }

    // Shoot bullets
    if (this.spacebar.isDown) {
        this.shootBullet();
    }
    this.bulletPool.forEach( this, this.checkBulletPosition );

    var onTheGround = this.player.physics.isTouching( Kiwi.Components.ArcadePhysics.DOWN );
    if (!onTheGround) {
        this.player.animation.play( 'jump' );
    }

    this.sprite.x -= 10;
    this.spriterect.x -= 10;
    if(this.sprite.x < -this.sprite.width ) {
        this.sprite.x = 800;
        this.spriterect.x = 800;
        this.sprite.y = getRandomInt(0, 500);
        this.spriterect.y = this.sprite.y;
    }

    if ( this.upKey.isDown && this.player.y > 50 ) {
        this.player.physics.velocity.y = this.JUMP_SPEED;
    }

    this.checkCollisions();
  }
}

state.checkCollisions = function () {
  if (Kiwi.Geom.Intersect.rectangleToRectangle(this.playerrect, this.missilerect).result) {
    console.log('yay');
    this.running = false;

    FBInstant.game.setScore(5);
    var promise = FBInstant.game.asyncYieldControl();
    promise.then(function() {
      this.running = true;
    });
  }
}

state.addScore = function () {
	this.score.counter.current += 10;
}

state.shootBullet = function() {
    // Enforce a short delay between shots by recording
    // the time that each bullet is shot and testing if
    // the amount of time since the last shot is more than
    // the required delay.
    if (this.lastBulletShotAt === undefined) this.lastBulletShotAt = 0;
    if (this.game.time.now() - this.lastBulletShotAt < this.SHOT_DELAY) return;
    this.lastBulletShotAt = this.game.time.now();

    // Get a dead bullet from the pool
    var bullet = this.getFirstDeadBullet();

    // If there aren't any bullets available then don't shoot
    if (bullet === null || bullet === undefined) return;

    // Revive the bullet
    // This makes the bullet "alive"
    this.revive( bullet );

    // Set the bullet position to the gun position.
    bullet.x = this.player.x + (0.5 * this.player.width);
    bullet.y = this.player.y + (0.5 * this.player.height);

    // Shoot it
    bullet.physics.velocity.x = this.BULLET_SPEED;
    bullet.physics.velocity.y = 0;
};

state.getFirstDeadBullet = function () {
    var bullets = this.bulletPool.members;

    for (var i = bullets.length - 1; i >= 0; i--) {
        if ( !bullets[i].alive ) {
            return bullets[i];
        }
    };
    return null;
}

state.revive   = function ( bullet ){
    bullet.alive = true;
}
state.checkBulletPosition = function ( bullet ) {

    if( bullet.x > this.game.stage.width || bullet.x < 0 ||
        bullet.y > this.game.stage.height || bullet.y < 0 ){
        bullet.alive = false;
    }
}

var gameOptions = {
  width: 800,
  height: 800
};

var game = new Kiwi.Game('game-container', 'Basic Follow', state, gameOptions);
