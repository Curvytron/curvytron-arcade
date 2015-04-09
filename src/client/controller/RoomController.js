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
    this.$scope.players             = this.players;

    this.repository.start();
    this.launch();
}

/**
 * Start button index
 *
 * @type {Number}
 */
RoomController.prototype.startButton = 9;

/**
 * Player profiles
 *
 * @type {Array}
 */
RoomController.prototype.profiles = [
    {name: 'PHP', color: '#6664A7'},
    {name: 'Python', color: '#F9CF25'},
    {name: 'Ruby', color: '#840A16'},
    {name: 'Javascript', color: '#80bd01'},
    {name: 'Go', color: '#63CEE0'},
    {name: 'Java', color: '#DA5D00'},
    {name: 'Perl', color: '#1189BD'},
    {name: 'Sass', color: '#c6538c'},
    {name: 'Rust', color: '#B87038'},
    {name: 'COBOL', color: '#000000'}
];

/**
 * Launche the room
 */
RoomController.prototype.launch = function()
{
    if (!this.client.connected) {
        return this.client.on('connected', this.launch);
    }

    this.$scope.room = this.repository.room;

    this.attachEvents();

    for (var player, i = this.repository.room.players.items.length - 1; i >= 0; i--) {
        player = this.repository.room.players.items[i];
        if (typeof(player.index) !== 'undefined') {
            this.assignPlayer(player.index, player);
        }
    }
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
    if (e.detail.value) {
        if (e.detail.index === this.startButton) {
            this.togglePlayer(e.detail.gamepad.index);
        } else {
            this.toggleReady(e.detail.gamepad.index);
        }
    }
};

/**
 * Toogle player
 *
 * @param {Number} index
 */
RoomController.prototype.togglePlayer = function(index)
{
    if (this.players[index]) {
        this.removePlayer(index);
    } else {
        var gamepads = gamepadListener.getGamepads();

        this.addPlayer(index, gamepads[index]);
    }
};

/**
 * Add player
 *
 * @param {Number} index
 * @param {Gamepad} gamepad
 */
RoomController.prototype.addPlayer = function(index, gamepad)
{
    var controller = this,
        profile = this.getRandomProfile();

    this.repository.addPlayer(
        profile.name,
        profile.color,
        function (result) {
            if (result.success) {
                controller.assignPlayer(index, result.player);
                controller.applyScope();
            } else {
                var error = typeof(result.error) !== 'undefined' ? result.error : 'Unknown error';
                console.error('Could not add player %s: %s', index, error);
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
                controller.applyScope();
            } else {
                console.error('Could not remove player %s', index);
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
    this.players[index] = player;
    player.index        = index;
};

/**
 * Set player ready
 *
 * @return {Array}
 */
RoomController.prototype.toggleReady = function(index)
{
    if (typeof(this.players[index]) === 'undefined' || !this.players[index]) {
        return;
    }

    this.repository.setReady(
        this.players[index].id,
        function (result) {
            if (!result.success) {
                console.error('Could not set player %s ready', index);
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
 * Get random profile
 *
 * @return {Object}
 */
RoomController.prototype.getRandomProfile = function()
{
    var profile = this.profiles[Math.floor(Math.random() * this.profiles.length)];

    while (!this.repository.room.isNameAvailable(profile.name)) {
        profile = this.profiles[Math.floor(Math.random() * this.profiles.length)];
    }

    return profile;
};

/**
 * Start Game
 *
 * @param {Event} e
 */
RoomController.prototype.start = function(e)
{
    this.detachEvents();
    this.$location.path('/play');
    this.applyScope();
};

/**
 * Apply scope
 */
RoomController.prototype.applyScope = CurvytronController.prototype.applyScope;
