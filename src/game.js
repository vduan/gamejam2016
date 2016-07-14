var state = new Kiwi.State('Play');

state.preload = function () {

  this.addImage( 'grid', './assets/img/background/background_1.png' );
  this.addSpriteSheet('player', './assets/img/fox/spritesheet_small.png', 100, 95 );
  this.addImage( 'missile', './assets/img/anime/myspace.jpg');
  this.addImage( 'sprite', './assets/img/anime/sprite.png');
  this.addImage( 'obstacle', './assets/img/anime/sprite.png');

  this.addSpriteSheet( 'sloth', './assets/img/anime/obstacle_peer_review.png', 100, 100 );

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
  this.NUMBER_OF_OBSTACLES = 3;

  this.background = new Kiwi.GameObjects.StaticImage( this, this.textures.grid, 0, 0 );
  this.addChild(this.background);

  this.step = 3;

  this.upKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.UP, true );
  this.spaceKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.SPACEBAR, true );
  this.downKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.DOWN, true );

  // Enable physics on the player
  this.player = new Kiwi.GameObjects.Sprite( this, this.textures.player, 100, 500 );
  this.player.animation.add( 'run', [ 2, 0, 1 ], 0.07, true, true );

  this.player.physics = this.player.components.add(new Kiwi.Components.ArcadePhysics(this.player, this.player.box));
  this.player.physics.acceleration.y = this.GRAVITY;
  this.player.physics.maxVelocity = this.MAX_SPEED;
  this.player.physics.drag.x = this.DRAG;
  this.addChild( this.player );

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

  this.missile = new Kiwi.GameObjects.Sprite( this, this.textures.missile, 500, 540);
  this.missile.physics = this.missile.components.add(new Kiwi.Components.ArcadePhysics(this.missile, this.missile.box));
  this.addChild( this.missile );

  this.sloth = new Kiwi.GameObjects.Sprite( this, this.textures.sloth, 500, 400);
  this.sloth.animation.add( 'move', [0, 1], 1, true);
  this.sloth.animation.play('move');
  this.sloth.physics = this.sloth.components.add(new Kiwi.Components.ArcadePhysics(this.sloth, this.sloth.box));
  this.sloth.physics.velocity.x = -30;
  this.addChild( this.sloth );

  this.scoreText = new Kiwi.GameObjects.Textfield(this, 'Score:', 10, 10, '#000');
  this.addChild( this.scoreText );

  this.collisionState = false;

  // Set the pivot point to the center of the gun
  this.player.anchorPointX = this.player.width * 0.5;
  this.player.anchorPointY = this.player.height * 0.5;

  // Create an object pool of bullets
  this.bulletPool = [];
  for( var i = 0; i < this.NUMBER_OF_BULLETS; i++ ) {
      // Create each bullet and add it to the group.
      var bullet = new Kiwi.GameObjects.Sprite( this, this.textures.poke, -100, -100 );
      bullet.physics = bullet.components.add(new Kiwi.Components.ArcadePhysics(bullet, bullet.box));
      this.bulletPool.push( bullet );

      // Set the pivot point to the center of the bullet
      bullet.anchorPointX = this.player.width * 0.5;
      bullet.anchorPointY = this.player.height * 0.5;

      // Enable physics on the bullet
      bullet.physics = bullet.components.add(new Kiwi.Components.ArcadePhysics(bullet, bullet.box));

      // Set its initial state to "dead".
      bullet.alive = false;
  }

  this.obstaclePool = new Kiwi.Group( this );
  this.addChild( this.obstaclePool );
  this.obstaclesArray = new Array();
  for ( var i = 0; i < this.NUMBER_OF_OBSTACLES; i++ ) {
    var obstacle = new Kiwi.GameObjects.Sprite( this, this.textures.obstacle, 500, 400);
    this.obstaclePool.addChild( obstacle);
    var obstacleRect = new Kiwi.Geom.Rectangle( obstacle.x, obstacle.y, obstacle.width, obstacle.height );
    var speed = getRandomInt(6, 9);
    var y = getRandomInt(1, 10);
    obstacle.y = obstacle.y - (y * 30);
    this.obstaclesArray.push({obstacle: obstacle, obstacleRect: obstacleRect, speed: speed, y:y});
  }

  this.running = true;

  FBInstant.loading.complete();
}

state.reset = function() {
  this.running = true;
  this.missile.x = 800;
  this.missile.y = 540;
  this.sloth.x = 800;
  this.sloth.y = getRandomInt(0, 500);
  this.score.counter.current = 0;
  this.player.physics.acceleration.y = this.GRAVITY;
  this.sloth.physics.velocity.x = -30;

  this.sloth.animation.play('move');
  this.player.animation.play('run');
  FBInstant.loading.complete();
};

state.update = function () {
  Kiwi.State.prototype.update.call( this );

  // Collide the player with the ground
  this.player.physics.overlapsGroup(this.ground, true);

  if (this.downKey.isDown) {
    this.reset();
  }

  if (this.running) {
    this.addScore(1);

    this.missile.x -= 5;
    if(this.missile.x < -this.missile.width ) {
      this.missile.x = 800;
      this.missile.y = 540;
    }

    this.bulletPool.forEach(this.checkBulletPosition, this);

    var onTheGround = this.player.physics.isTouching( Kiwi.Components.ArcadePhysics.DOWN );
    if (!onTheGround) {
	     this.player.animation.switchTo(2);
    }

    if(this.sloth.x < -this.sloth.width ) {
        this.sloth.x = 800;
        this.sloth.y = getRandomInt(0, 500);
    }

    for (var i = 0; i < this.obstaclesArray.length; i++) {
      var obstacleObj = this.obstaclesArray[i];
      var obstacle = obstacleObj.obstacle;
      var obstacleRect = obstacleObj.obstacleRect;

      //obstacle.y = obstacle.y - obstacleObj.y;
      obstacle.x -= obstacleObj.speed;
      obstacleRect.x -= obstacleObj.speed;
      if (obstacle.x < -obstacle.width ) {
        obstacle.x = 800;
        obstacleRect.x = 800;
        obstacle.y = getRandomInt(0, 500);
        obstacleRect.y = obstacle.y;
      }
    }

    if (this.spaceKey.isDown) {
      this.shootBullet();
    }

    if (this.upKey.isDown && this.player.y > 50 ) {
        this.player.physics.velocity.y = this.JUMP_SPEED;
      this.player.animation.switchTo(2);
    }

    this.checkCollisions();
  }
}

state.checkCollisions = function () {
  if (this.player.physics.overlaps(this.missile) ||
      this.player.physics.overlaps(this.sloth)) {
    this.running = false;
    this.player.physics.acceleration.y = 0;
    this.player.physics.velocity.y = 0;
    this.sloth.physics.velocity.x = 0;

    this.sloth.animation.stop('move');
    this.player.animation.stop('run');

    FBInstant.game.setScore(this.score.counter.current);
    var promise = FBInstant.game.asyncYieldControl();
    promise.then(function() {
      state.reset();
    });
  }

  this.bulletPool.forEach(this.checkBulletCollision, this);
  this.obstaclePool.forEach(this, this.checkObstacleCollision);
}

state.addScore = function (value) {
	this.score.counter.current += value;
}

state.shootBullet = function() {
  // Enforce a short delay between shots by recording
  // the time that each bullet is shot and testing if
  // the amount of time since the last shot is more than
  // the required delay.
  if (!this.running) return;
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

  this.addChild(bullet);
};

state.getFirstDeadBullet = function () {
  for (var i = this.bulletPool.length - 1; i >= 0; i--) {
    if ( !this.bulletPool[i].alive ) {
        return this.bulletPool[i];
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
    this.removeChild(bullet);
  }
}

state.checkBulletCollision = function (bullet) {
  if (this.sloth.physics.overlaps(bullet)) {
    bullet.alive = false;
    this.removeChild(bullet);

    this.sloth.x = 800;
    this.sloth.y = getRandomInt(0, 500);

    this.addScore(100);
  }
};

state.checkObstacleCollision = function (obstacle) {
  if (this.player.physics.overlaps(obstacle)) {
    obstacle.x = 800;
    obstacle.y = getRandomInt(0, 500);

    this.addScore(100);
  }
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var gameOptions = {
  width: 800,
  height: 800
};

var game = new Kiwi.Game('game-container', 'Basic Follow', state, gameOptions);
