/**
 * Room Controller
 *
 * @param {Object} $scope
 * @param {Object} $routeParams
 * @param {Object} $location
 * @param {SocketClient} SocketClient
 * @param {RoomRepository} repository
 */
function RoomController($scope, $routeParams, $location, client, repository)
{
    this.$scope     = $scope;
    this.$location  = $location;
    this.client     = client;
    this.repository = repository;
    this.players    = {0: null, 1: null, 2: null, 3: null};

    // Binding:
    this.onGamepadConnected    = this.onGamepadConnected.bind(this);
    this.onGamepadDisconnected = this.onGamepadDisconnected.bind(this);
    this.onGamepadButton       = this.onGamepadButton.bind(this);
    this.onJoin                = this.onJoin.bind(this);
    this.applyScope            = this.applyScope.bind(this);
    this.launch                = this.launch.bind(this);
    this.start                 = this.start.bind(this);

    // Hydrating scope:
    this.$scope.curvytron.bodyClass = null;

    this.repository.start();
    this.launch();
}

/**
 * Gamepads controls for players
 *
 * @type {Array}
 */
RoomController.prototype.controls = ['button:4', 'button:5'];

/**
 * Launche the room
 */
RoomController.prototype.launch = function()
{
    if (!this.client.connected) {
        return this.client.on('connected', this.launch);
    }

    this.room        = this.repository.room;
    this.$scope.room = this.room;

    this.attachEvents();

    var gamepads = gamepadListener.getGamepads();

    for (var i = 0; i < 4; i++) {
        if (typeof(gamepads[i]) !== 'undefined') {
            this.addPlayer(i, gamepads[i]);
        }
    };
};

/**
 * Attach Events
 *
 * @param {String} name
 */
RoomController.prototype.attachEvents = function(name)
{
    gamepadListener.on('gamepad:connected', this.onGamepadConnected);
    gamepadListener.on('gamepad:disconnected', this.onGamepadDisconnected);
    gamepadListener.on('gamepad:button', this.onGamepadButton);
    gamepadListener.on('gamepad:axis', this.onGamepadButton);
    this.repository.on('player:join', this.onJoin);
    this.repository.on('player:leave', this.applyScope);
    this.repository.on('player:ready', this.applyScope);
    this.repository.on('room:game:start', this.start);
};

/**
 * Attach Events
 *
 * @param {String} name
 */
RoomController.prototype.detachEvents = function(name)
{
    gamepadListener.off('gamepad:connected', this.onGamepadConnected);
    gamepadListener.off('gamepad:disconnected', this.onGamepadDisconnected);
    gamepadListener.off('gamepad:button', this.onGamepadButton);
    gamepadListener.off('gamepad:axis', this.onGamepadButton);
    this.repository.off('player:join', this.onJoin);
    this.repository.off('player:leave', this.applyScope);
    this.repository.off('player:ready', this.applyScope);
    this.repository.off('room:game:start', this.start);
};



/**
 * On gamepad connected
 *
 * @param {Event} e
 */
RoomController.prototype.onGamepadConnected = function(e)
{
    this.addPlayer(e.detail.index, e.detail.gamepad);
};

/**
 * On gamepad disconnected
 *
 * @param {Event} e
 */
RoomController.prototype.onGamepadDisconnected = function(e)
{
    this.removePlayer(e.detail.index);
};

/**
 * On gamepad button pressed
 *
 * @param {Event} e
 */
RoomController.prototype.onGamepadButton = function(e)
{
    this.setReady(e.detail.index);
};

/**
 * Add player
 *
 * @param {Number} index
 * @param {Gamepad} gamepad
 */
RoomController.prototype.addPlayer = function(index, gamepad)
{
    var controller = this;

    this.repository.addPlayer(
        'Player ' + index,
        null,
        function (result) {
            console.log('addPlayer callback:', result);
            if (result.success) {
                controller.assignPlayer(index, result.player);
            } else {
                var error = typeof(result.error) !== 'undefined' ? result.error : 'Unknown error';
                console.error('Could not add player %s: %s', name, error);
            }
        }
    );
};

/**
 * Remove player
 *
 * @param {Number} index
 */
RoomController.prototype.removePlayer = function(index)
{
    if (typeof(this.players[index]) === 'undefined' || !this.players[index]) {
        return;
    }

    var controller = this;

    this.repository.removePlayer(
        this.players[index],
        function (result) {
            if (result.success) {
                controller.players[index] = null;
            } else {
                console.error('Could not remove player %s', player.name);
            }
        }
    );
};

/**
 * Assign player to a specific index and bind controls
 *
 * @param {Number} index
 * @param {Player} player
 */
RoomController.prototype.assignPlayer = function(index, player)
{
    console.log('assignPlayer', player);
    this.players[index] = player;

    for (var i = player.controls.length - 1; i >= 0; i--) {
        player.controls[i].loadMapping({
            mapper: 'gamepad',
            value: 'gamepad:' + index + ':' + this.controls[i]
        });
    }
};

/**
 * Set player ready
 *
 * @return {Array}
 */
RoomController.prototype.setReady = function(index)
{
    if (typeof(this.players[index]) === 'undefined' || !this.players[index]) {
        return;
    }

    this.repository.setReady(
        this.players[index].id,
        function (result) {
            if (!result.success) {
                console.error('Could not set player %s ready', player.name);
            }
        }
    );
};

/**
 * On join
 *
 * @param {Event} e
 */
RoomController.prototype.onJoin = function(e)
{
    var player = e.detail.player;

    if (player.client === this.client.id) {
        player.setLocal(true);
    }

    this.applyScope();
};

/**
 * Start Game
 *
 * @param {Event} e
 */
RoomController.prototype.start = function(e)
{
    this.$location.path('/play');
    this.applyScope();
};

/**
 * Apply scope
 */
RoomController.prototype.applyScope = CurvytronController.prototype.applyScope;
