FBInstant.loading.complete();
var state = new Kiwi.State('Play');
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


state.preload = function () {

  this.addImage( 'grid', './assets/img/grids/large-debug.png' );
  this.addImage( 'player', './assets/img/logo/rocket.png' );
  this.addImage( 'missile', './assets/img/anime/missile.png');
};

state.create = function () {

  this.background = new Kiwi.GameObjects.StaticImage( this, this.textures.grid, 0, 0 );
  this.addChild(this.background);

  this.step = 3;

  this.upKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.UP, true );
  this.downKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.DOWN, true );
  this.rightKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.RIGHT, true );
  this.leftKey = this.game.input.keyboard.addKey( Kiwi.Input.Keycodes.LEFT, true );

  this.player = new Kiwi.GameObjects.Sprite( this, this.textures.player, 500, 400 );
  this.addChild( this.player );
  this.missile = new Kiwi.GameObjects.Sprite( this, this.textures.missile, 500, 400);
  this.addChild( this.missile );

}


state.update = function () {
  Kiwi.State.prototype.update.call( this );
  this.missile.x -= 5;
  if( this.missile.x == 0 ) {
		this.missile.x = this.game.stage.width;
    this.missile.y = getRandomInt(0, 800);
	}
  // Move the player with the arrow keys.
  if( this.leftKey.isDown ){
    this.player.x -= this.step;
  }
  if( this.rightKey.isDown ){
    this.player.x += this.step;
  }
  if( this.upKey.isDown ){
    this.player.y -= this.step;
  }
  if( this.downKey.isDown ){
    this.player.y += this.step;
  }

  var playerOffsetX = this.player.width * 0.5;
  var playerOffsetY = this.player.height * 0.5;


  // Set the cameras position to that of the player.
  this.game.cameras.defaultCamera.transform.x = -1 * this.player.x + this.game.stage.width * 0.5 - playerOffsetX;
  this.game.cameras.defaultCamera.transform.y = -1 * this.player.y + this.game.stage.height * 0.5 - playerOffsetY;

}

var gameOptions = {
  width: 800,
  height: 800
};

var game = new Kiwi.Game('game-container', 'Basic Follow', state, gameOptions);
