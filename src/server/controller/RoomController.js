/**
 * Room Controller
 */
function RoomController()
{
    EventEmitter.call(this);

    var controller = this;

    this.room        = new Room('Arcade', this);
    this.clients     = new Collection();
    this.socketGroup = new SocketGroup(this.clients);

    this.onPlayerJoin  = this.onPlayerJoin.bind(this);
    this.onPlayerLeave = this.onPlayerLeave.bind(this);
    this.onGame        = this.onGame.bind(this);

    this.callbacks = {
        onPlayerAdd: function (data) { controller.onPlayerAdd(this, data[0], data[1]); },
        onPlayerRemove: function (data) { controller.onPlayerRemove(this, data[0], data[1]); },
        onReady: function (data) { controller.onReady(this, data[0], data[1]); },
        onLeave: function () { controller.onLeave(this); }
    };

    this.room.on('player:join', this.onPlayerJoin);
    this.room.on('player:leave', this.onPlayerLeave);
    this.room.on('game:new', this.onGame);
}

RoomController.prototype = Object.create(EventEmitter.prototype);
RoomController.prototype.constructor = RoomController;

/**
 * Attach events
 *
 * @param {SocketClient} client
 */
RoomController.prototype.attach = function(client)
{
    if (this.clients.add(client)) {
        this.attachEvents(client);
        this.onClientAdd(client);
        this.emit('client:add', { room: this.room, client: client});
    }
};

/**
 * Attach events
 *
 * @param {SocketClient} client
 */
RoomController.prototype.detach = function(client)
{
    if (this.clients.remove(client)) {
        this.detachEvents(client);
        this.onClientRemove(client);
        this.emit('client:remove', { room: this.room, client: client});
    }
};

/**
 * Detach events
 *
 * @param {SocketClient} client
 */
RoomController.prototype.attachEvents = function(client)
{
    client.on('close', this.callbacks.onLeave);
    client.on('room:leave', this.callbacks.onLeave);
    client.on('player:add', this.callbacks.onPlayerAdd);
    client.on('player:remove', this.callbacks.onPlayerRemove);
    client.on('room:ready', this.callbacks.onReady);
};

/**
 * Detach events
 *
 * @param {SocketClient} client
 */
RoomController.prototype.detachEvents = function(client)
{
    client.removeListener('close', this.callbacks.onLeave);
    client.removeListener('room:leave', this.callbacks.onLeave);
    client.removeListener('player:add', this.callbacks.onPlayerAdd);
    client.removeListener('player:remove', this.callbacks.onPlayerRemove);
    client.removeListener('room:ready', this.callbacks.onReady);
};

/**
 * Remove player
 *
 * @param {Player} player
 */
RoomController.prototype.removePlayer = function(player)
{
    var client = player.client;

    if (this.room.removePlayer(player) && client) {
        client.players.remove(player);
    }
};

/**
 * Initialise a new client
 *
 * @param {SocketClient} client
 */
RoomController.prototype.onClientAdd = function(client)
{
    client.players.clear();
};

/**
 * On leave room
 *
 * @param {SocketClient} client
 */
RoomController.prototype.onClientRemove = function(client)
{
    if (this.room.game) {
        this.room.game.controller.detach(client);
    }

    for (var i = client.players.items.length - 1; i >= 0; i--) {
        this.room.removePlayer(client.players.items[i]);
    }

    client.players.clear();
};

// Events:

/**
 * On client leave
 *
 * @param {SocketClient} client
 */
RoomController.prototype.onLeave = function(client)
{
    this.detach(client);
};

/**
 * On add player to room
 *
 * @param {SocketClient} client
 * @param {Object} data
 * @param {Function} callback
 */
RoomController.prototype.onPlayerAdd = function(client, data, callback)
{
    var name = data.name.substr(0, Player.prototype.maxLength).trim(),
        color = typeof(data.color) !== 'undefined' ? data.color : null;

    if (!name.length) {
        return callback({success: false, error: 'Invalid name.'});
    }

    if (this.room.game) {
        return callback({success: false, error: 'Game already started.'});
    }

    if (!this.room.isNameAvailable(name)) {
        return callback({success: false, error: 'This username is already used.'});
    }

    var player = new Player(client, name, color);

    if (this.room.addPlayer(player)) {
        client.players.add(player);
        callback({success: true, player: player.id});
        this.emit('player:add', { room: this.room, player: player});
    }
};

/**
 * On remove player from room
 *
 * @param {SocketClient} client
 * @param {Object} data
 * @param {Function} callback
 */
RoomController.prototype.onPlayerRemove = function(client, data, callback)
{
    var player = client.players.getById(data.player);

    if (player) {
        this.removePlayer(player);
        this.emit('player:remove', { room: this.room, player: player});
    }

    callback({success: player ? true : false});
};

/**
 * On player ready
 *
 * @param {SocketClient} client
 * @param {Object} data
 * @param {Function} callback
 */
RoomController.prototype.onReady = function(client, data, callback)
{
    var player = client.players.getById(data.player);

    if (player) {
        player.toggleReady();

        callback({success: true, ready: player.ready});
        this.socketGroup.addEvent('player:ready', { player: player.id, ready: player.ready });

        if (this.room.isReady()) {
            this.room.newGame();
        }
    } else {
        callback({success: false, error: 'Player with id "' + data.player + '" not found'});
    }
};

/**
 * On player join
 *
 * @param {Object} data
 */
RoomController.prototype.onPlayerJoin = function(data)
{
    this.socketGroup.addEvent('room:join', {player: data.player.serialize()});
};

/**
 * On player leave
 *
 * @param {Object} data
 */
RoomController.prototype.onPlayerLeave = function(data)
{
    this.socketGroup.addEvent('room:leave', {player: data.player.id});

    if (this.room.isReady()) {
        this.room.newGame();
    }
};

/**
 * Warmup room
 *
 * @param {Room} room
 */
RoomController.prototype.onGame = function()
{
    this.socketGroup.addEvent('room:game:start');
};
