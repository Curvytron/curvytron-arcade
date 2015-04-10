/**
 * RoomRepository
 *
 * @param {SocketCLient} client
 */
function RoomRepository(client)
{
    EventEmitter.call(this);

    this.client = client;
    this.room   = new Room('Arcade');

    this.start           = this.start.bind(this);
    this.onJoinRoom      = this.onJoinRoom.bind(this);
    this.onLeaveRoom     = this.onLeaveRoom.bind(this);
    this.onGameStart     = this.onGameStart.bind(this);
    this.onGameEnd       = this.onGameEnd.bind(this);
    this.onPlayerReady   = this.onPlayerReady.bind(this);
    this.onPlayerProfile = this.onPlayerProfile.bind(this);
}

RoomRepository.prototype = Object.create(EventEmitter.prototype);
RoomRepository.prototype.constructor = RoomRepository;

/**
 * Attach events
 */
RoomRepository.prototype.attachEvents = function()
{
    this.client.on('room:join', this.onJoinRoom);
    this.client.on('room:leave', this.onLeaveRoom);
    this.client.on('room:game:start', this.onGameStart);
    this.client.on('room:game:end', this.onGameEnd);
    this.client.on('player:ready', this.onPlayerReady);
    this.client.on('player:profile', this.onPlayerProfile);
};

/**
 * Detach events
 */
RoomRepository.prototype.detachEvents = function()
{
    this.client.off('room:join', this.onJoinRoom);
    this.client.off('room:leave', this.onLeaveRoom);
    this.client.off('room:game:start', this.onGameStart);
    this.client.off('room:game:end', this.onGameEnd);
    this.client.off('player:ready', this.onPlayerReady);
    this.client.off('player:profile', this.onPlayerProfile);
};

/**
 * Add player
 *
 * @param {String} name
 * @param {Function} callback
 */
RoomRepository.prototype.addPlayer = function(name, color, callback)
{
    var repository = this;

    this.client.addEvent('player:add', {
        name: name.substr(0, Player.prototype.maxLength),
        color: color ? color.substr(0, Player.prototype.colorMaxLength) : null
    }, function (result) {
        if (result.success) {
            var player = repository.room.players.getById(result.player);

            if (player) {
                player.setLocal(true);
                callback({success: true, player: player});
            } else {
                callback({success: false, error: 'Could not add player to the room'});
            }
        } else {
            callback(result);
        }
    });
};

/**
 * Remove player
 *
 * @param {Player} player
 * @param {Function} callback
 */
RoomRepository.prototype.removePlayer = function(player, callback)
{
    this.client.addEvent('player:remove', {player: player.id}, callback);
};

/**
 * Set ready
 *
 * @param {Room} room
 * @param {Number} player
 * @param {Function} callback
 */
RoomRepository.prototype.setReady = function(player, callback)
{
    this.client.addEvent('room:ready', {player: player}, callback);
};

/**
 * Set name and color
 *
 * @param {Player} player
 * @param {String} name
 * @param {String} color
 * @param {Function} callback
 */
RoomRepository.prototype.setProfile = function(player, name, color, callback)
{
    this.client.addEvent('room:profile', {
        player: player.id,
        name: name.substr(0, Player.prototype.nameMaxLength).trim(),
        color: color.substr(0, Player.prototype.colorMaxLength)
    }, function (result) {
        if (typeof(result.name) !== 'undefined') {
            player.setName(result.name);
        }
        if (typeof(result.color) !== 'undefined') {
            player.setColor(result.color);
        }

        if (typeof(callback) === 'function') {
            callback(result);
        }
    });
};

// EVENTS:

/**
 * On join room
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomRepository.prototype.onJoinRoom = function(e)
{
    var data = e.detail,
        player = new Player(
            data.player.id,
            data.player.client,
            data.player.name,
            data.player.color,
            data.player.ready
        );

    if (this.room.addPlayer(player)) {
        this.emit('player:join', {player: player});
    }
};

/**
 * On leave room
 *
 * @param {Event} e
 *
 * @return {Boolean}
 */
RoomRepository.prototype.onLeaveRoom = function(e)
{
    var data = e.detail,
        player = this.room.players.getById(data.player);

    if (player && this.room.removePlayer(player)) {
        this.emit('player:leave', {player: player});
    }
};

/**
 * On player toggle ready
 *
 * @param {Event} e
 */
RoomRepository.prototype.onPlayerReady = function(e)
{
    var data = e.detail,
        player = this.room.players.getById(data.player);

    if (player) {
        player.toggleReady(data.ready);
        this.emit('player:ready', {player: player});
    }
};

/**
 * On player profile
 *
 * @param {Event} e
 */
RoomRepository.prototype.onPlayerProfile = function(e)
{
    var data = e.detail,
        player = this.room.players.getById(data.player);

    if (player) {
        player.setName(data.name);
        player.setColor(data.color);
        this.emit('player:profile', {player: player});
    }
};

/**
 * On room game start
 *
 * @param {Event} e
 */
RoomRepository.prototype.onGameStart = function(e)
{
    this.emit('room:game:start');
};

/**
 * On room game end
 *
 * @param {Event} e
 */
RoomRepository.prototype.onGameEnd = function(e)
{
    this.emit('room:game:end');
};

/**
 * Leave
 *
 * @param {Function} callback
 */
RoomRepository.prototype.leave = function()
{
    this.client.addEvent('room:leave');
    this.stop();
    this.emit('room:leave');
};

/**
 * Start
 */
RoomRepository.prototype.start = function()
{
    if (this.client.connected) {
        this.attachEvents();
    } else {
        this.client.on('connected', this.start);
    }
};

/**
 * Pause
 */
RoomRepository.prototype.stop = function()
{
    this.detachEvents();
};
