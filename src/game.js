FBInstant.loading.complete();
var state = new Kiwi.State('Play');
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


state.preload = function () {

  this.addImage( 'grid', './assets/img/background/background_1.png' );
  this.addImage( 'player', './assets/img/logo/rocket.png' );
  this.addImage( 'missile', './assets/img/anime/missile.png');

  this.score = new Kiwi.HUD.Widget.BasicScore( this.game, 50, 50, 0 );
  this.game.huds.defaultHUD.addWidget( this.score );

  this.score.style.color = 'black';
};

state.create = function () {

  this.background = new Kiwi.GameObjects.StaticImage( this, this.textures.grid, 0, 0 );
  this.addChild(this.background);

  this.step = 3;

  this.upKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.UP, true );
  this.downKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.DOWN, true );
  this.rightKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.RIGHT, true );
  this.leftKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.LEFT, true );

  this.player = new Kiwi.GameObjects.Sprite( this, this.textures.player, 350, 540 );
  this.addChild( this.player );
  this.playerrect = new Kiwi.Geom.Rectangle( this.player.x, this.player.y, this.player.width, this.player.height );

  this.missile = new Kiwi.GameObjects.Sprite( this, this.textures.missile, 500, 400);
  this.addChild( this.missile );
  this.missilerect = new Kiwi.Geom.Rectangle( this.missile.x, this.missile.y, this.missile.width, this.missile.height );

  this.scoreText = new Kiwi.GameObjects.Textfield(this, 'Score:', 10, 10, '#000');
  this.addChild( this.scoreText );

  this.collisionState = false;
  // this.score
  // this.score = new Kiwi.GameObjects.Textfield(this, '10', 120, 10, '#000');
  // this.addChild( this.score );

}


state.update = function () {
  Kiwi.State.prototype.update.call( this );
  this.missile.x -= 5;
  this.missilerect.x -= 5;
  if(this.missile.x < -this.missile.width ) {
   this.collisionState = false;
	 this.missile.x = 800;
    this.missilerect.x = 800;
    this.missile.y = getRandomInt(0, 500);
    this.missilerect.y = this.missile.y;
  }

  this.checkCollisions();
}

state.checkCollisions = function () {
  if (Kiwi.Geom.Intersect.rectangleToRectangle(this.playerrect, this.missilerect).result) {
    console.log('yay');
    FBInstant.game.setScore(5);
    FBInstant.game.asyncYieldControl();
    if (!this.collisionState) {
      this.addScore();
      this.collisionState = true;
    }
  }
}

state.addScore = function () {
	this.score.counter.current += 10;
}

var gameOptions = {
  width: 800,
  height: 800
};

var game = new Kiwi.Game('game-container', 'Basic Follow', state, gameOptions);
