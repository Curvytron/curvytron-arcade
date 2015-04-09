/**
 * Game Controller
 *
 * @param {Object} $scope
 * @param {Object} $routeParams
 * @param {SocketClient} client
 * @param {RoomRepository} repository
 * @param {Radio} radio
 * @param {SoundManager} sound
 * @param {killLog} killLog
 */
function GameController($scope, $routeParams, $location, client, repository, radio, sound, killLog)
{
    this.$scope         = $scope;
    this.$location      = $location;
    this.client         = client;
    this.repository     = repository;
    this.radio          = radio;
    this.killLog        = killLog;
    this.sound          = sound;
    this.room           = null;
    this.game           = null;
    this.warmupInterval = null;
    this.assetsLoaded   = false;
    this.setup          = false;
    this.compressor     = new Compressor();

    // Binding
    this.onLatency       = this.onLatency.bind(this);
    this.onGameStart     = this.onGameStart.bind(this);
    this.onGameStop      = this.onGameStop.bind(this);
    this.onReady         = this.onReady.bind(this);
    this.onAssetsLoaded  = this.onAssetsLoaded.bind(this);
    this.onMove          = this.onMove.bind(this);
    this.onBonusPop      = this.onBonusPop.bind(this);
    this.onBonusClear    = this.onBonusClear.bind(this);
    this.onBonusStack    = this.onBonusStack.bind(this);
    this.onPosition      = this.onPosition.bind(this);
    this.onPoint         = this.onPoint.bind(this);
    this.onDie           = this.onDie.bind(this);
    this.onProperty      = this.onProperty.bind(this);
    this.onWarmup        = this.onWarmup.bind(this);
    this.endWarmup       = this.endWarmup.bind(this);
    this.onRoundNew      = this.onRoundNew.bind(this);
    this.onRoundEnd      = this.onRoundEnd.bind(this);
    this.onRoundWinner   = this.onRoundWinner.bind(this);
    this.onClear         = this.onClear.bind(this);
    this.onEnd           = this.onEnd.bind(this);
    this.onExit          = this.onExit.bind(this);
    this.updateBorders   = this.updateBorders.bind(this);
    this.onGamepadButton = this.onGamepadButton.bind(this);

    // Hydrate scope:
    this.$scope.sortorder   = '-score';
    this.$scope.warmup      = false;
    this.$scope.phase       = 'round';
    this.$scope.end         = false;
    this.$scope.tieBreak    = false;
    this.$scope.borderless  = false;
    this.$scope.roundWinner = null;
    this.$scope.gameWinner  = null;
    this.$scope.latency     = 0;

    this.repository.start();
    this.loadGame(this.repository.room);
}

/**
 * Attach socket Events
 */
GameController.prototype.attachSocketEvents = function()
{
    this.client.on('latency', this.onLatency);
    this.client.on('game:start', this.onGameStart);
    this.client.on('game:stop', this.onGameStop);
    this.client.on('ready', this.onReady);
    this.client.on('property', this.onProperty);
    this.client.on('position', this.onPosition);
    this.client.on('point', this.onPoint);
    this.client.on('die', this.onDie);
    this.client.on('bonus:pop', this.onBonusPop);
    this.client.on('bonus:clear', this.onBonusClear);
    this.client.on('bonus:stack', this.onBonusStack);
    this.client.on('round:new', this.onRoundNew);
    this.client.on('round:end', this.onRoundEnd);
    this.client.on('round:winner', this.onRoundWinner);
    this.client.on('clear', this.onClear);
    this.client.on('end', this.onEnd);
};

/**
 * Attach socket Events
 */
GameController.prototype.detachSocketEvents = function()
{
    this.client.off('latency', this.onLatency);
    this.client.off('game:start', this.onGameStart);
    this.client.off('game:stop', this.onGameStop);
    this.client.off('ready', this.onReady);
    this.client.off('property', this.onProperty);
    this.client.off('position', this.onPosition);
    this.client.off('point', this.onPoint);
    this.client.off('die', this.onDie);
    this.client.off('bonus:pop', this.onBonusPop);
    this.client.off('bonus:clear', this.onBonusClear);
    this.client.off('bonus:stack', this.onBonusStack);
    this.client.off('round:new', this.onRoundNew);
    this.client.off('round:end', this.onRoundEnd);
    this.client.off('round:winner', this.onRoundWinner);
    this.client.off('clear', this.onClear);
    this.client.off('end', this.onEnd);
};

/**
 * Rooms action
 *
 * @return {Array}
 */
GameController.prototype.loadGame = function(room)
{
    this.offDestroy = this.$scope.$on('$destroy', this.onExit);

    this.room = room;
    this.game = room.newGame();

    this.game.bonusManager.on('load', this.onAssetsLoaded);

    var avatar;

    for (var i = this.game.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.game.avatars.items[i];

        avatar.bonusStack.on('change', this.updateBorders);

        if (avatar.local) {
            avatar.input.on('move', this.onMove);
        }
    }

    this.game.fps.setElement(document.getElementById('fps'));
    this.radio.setActive(true);

    // Hydrate scope:
    this.$scope.curvytron.bodyClass = 'game-mode';
    this.$scope.game                = this.game;
    this.$scope.avatars             = this.game.avatars.items;

    this.attachSocketEvents();

    this.setup = true;
    this.checkReady();
};

/**
 * On assets loaded
 */
GameController.prototype.onAssetsLoaded = function()
{
    this.assetsLoaded = true;
    this.game.bonusManager.off('load', this.onAssetsLoaded);
    this.checkReady();
};

/**
 * Check loading is done
 */
GameController.prototype.checkReady = function()
{
    if (this.assetsLoaded && this.setup) {
        this.client.addEvent('ready');
    }
};

/**
 * On avatar ready (client loaded)
 *
 * @param {Event} e
 */
GameController.prototype.onReady = function(e)
{
    var data = e.detail,
        avatar = this.game.avatars.getById(data.avatar);

    if (avatar) {
        avatar.ready = true;
        this.applyScope();
    }
};

/**
 * Start warmup
 */
GameController.prototype.displayWarmup = function(time)
{
    var controller = this;

    this.$scope.count  = time/1000;
    this.$scope.warmup = true;
    this.applyScope();

    this.warmupInterval = setInterval(this.onWarmup, 1000);

    setTimeout(this.endWarmup, time);
};

/**
 * On warmup
 */
GameController.prototype.onWarmup = function()
{
    this.$scope.count--;
    this.applyScope();
};

/**
 * End warmup
 */
GameController.prototype.endWarmup = function(interval)
{
    this.clearWarmup();
    this.$scope.warmup = false;
    this.applyScope();
};

/**
 * Clear warmup interval
 */
GameController.prototype.clearWarmup = function()
{
    if (this.warmupInterval) {
        clearInterval(this.warmupInterval);
        this.warmupInterval = null;
    }
};

/**
 * On move
 *
 * @param {Event} e
 */
GameController.prototype.onMove = function(e)
{
    this.client.addEvent('player:move', {avatar: e.detail.avatar.id, move: e.detail.move ? e.detail.move : 0});
};

/**
 * On property
 *
 * @param {Event} e
 */
GameController.prototype.onProperty = function(e)
{
    var data = e.detail,
        avatar = this.game.avatars.getById(data.avatar);

    if (avatar) {
        avatar.set(data.property, data.value);

        if (!this.game.frame) {
            this.game.draw();
        }

        if (data.property === 'score' || data.property === 'roundScore') {
            this.applyScope();
        }
    }
};

/**
 * On bonus stack
 *
 *
 * @param {Event} e
 */
GameController.prototype.onBonusStack = function(e)
{
    var data = e.detail,
        avatar = this.game.avatars.getById(data.avatar),
        bonus = new Bonus(data.bonus.id, data.bonus.position, data.bonus.type, data.bonus.affect, data.bonus.radius, data.bonus.duration);

    if (avatar && avatar.local) {
        avatar.bonusStack[data.method](bonus);
    }
};

/**
 * On bonus pop
 *
 * @param {Event} e
 */
GameController.prototype.onBonusPop = function(e)
{
    var data = e.detail,
        bonus = new Bonus(data.id, data.position, data.type, data.affect, data.radius, data.duration);

    this.game.bonusManager.add(bonus);
    this.sound.play('bonus-pop');
};

/**
 * On bonus clear
 *
 * @param {Event} e
 */
GameController.prototype.onBonusClear = function(e)
{
    var data = e.detail,
        bonus = this.game.bonusManager.bonuses.getById(data.bonus);

    this.game.bonusManager.remove(bonus);
    this.sound.play('bonus-clear');
};

/**
 * On position
 *
 * @param {Event} e
 */
GameController.prototype.onPosition = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        avatar.setPosition(this.compressor.decompressPosition(e.detail[1][0], e.detail[1][1]));
    }
};

/**
 * On point
 *
 * @param {Event} e
 */
GameController.prototype.onPoint = function(e)
{
    var avatar = this.game.avatars.getById(e.detail[0]);

    if (avatar) {
        avatar.addPoint(this.compressor.decompressPosition(e.detail[1][0], e.detail[1][1]));
    }
};

/**
 * On die
 *
 * @param {Event} e
 */
GameController.prototype.onDie = function(e)
{
    var data = e.detail,
        avatar = this.game.avatars.getById(data.avatar),
        killer = data.killer ? this.game.avatars.getById(data.killer) : null;

    if (avatar) {
        avatar.setAngle(data.angle);
        avatar.die();
        this.killLog.logDeath(avatar, killer);
        this.applyScope();
        this.sound.play('death');
    }
};

/**
 * On game start
 *
 * @param {Event} e
 */
GameController.prototype.onGameStart = function(e)
{
    this.endWarmup();
    this.game.start();
};

/**
 * On game stop
 *
 * @param {Event} e
 */
GameController.prototype.onGameStop = function(e)
{
    this.game.stop();
};

/**
 * On round new
 *
 * @param {Event} e
 */
GameController.prototype.onRoundNew = function(e)
{
    this.$scope.end      = false;
    this.$scope.tieBreak = this.game.isTieBreak();

    this.displayWarmup(this.game.warmupTime);
    this.game.newRound();
    this.killLog.clear();
    this.updateBorders();
};

/**
 * On round new
 *
 * @param {Event} e
 */
GameController.prototype.onRoundEnd = function(e)
{
    this.game.endRound();
};

/**
 * On clear
 *
 * @param {Event} e
 */
GameController.prototype.onClear = function(e)
{
    this.game.clearTrails();
};

/**
 * On end
 *
 * @param {Event} e
 */
GameController.prototype.onEnd = function(e)
{
    this.$scope.gameWinner = this.game.sortAvatars().getFirst();
    this.$scope.end        = true;
    this.$scope.phase      = 'game';

    gamepadListener.on('gamepad:button', this.onGamepadButton);

    this.applyScope();
    this.close();
};

/**
 * On round winner
 *
 * @param {Event} e
 */
GameController.prototype.onRoundWinner = function(e)
{
    var data = e.detail,
        avatar = this.game.avatars.getById(data.winner);

    if (avatar) {
        this.$scope.roundWinner = avatar;
        this.applyScope();

        this.$scope.end = true;
    }
};

/**
 * On leave
 *
 * @param {Event} e
 */
GameController.prototype.onLeave = function(e)
{
    var data = e.detail,
        avatar = this.game.avatars.getById(data.avatar);

    if (avatar) {
        avatar.bonusStack.off('change', this.updateBorders);
        this.game.removeAvatar(avatar);
        this.applyScope();
    }
};

/**
 * Update map border
 */
GameController.prototype.updateBorders = function()
{
    this.$scope.borderless = this.game.isBorderless();
    this.applyScope();
};

/**
 * Leave room
 */
GameController.prototype.onExit = function()
{
    this.killLog.clear();

    this.radio.setActive(false);
    this.sound.stop('win');
    this.close();
};

/**
 * Close game
 */
GameController.prototype.close = function()
{
    this.clearWarmup();

    if (this.game) {
        this.detachSocketEvents();
        this.game.end();

        avatars = this.game.avatars.filter(function () { return this.input; }).items;

        for (var i = avatars.length - 1; i >= 0; i--) {
            avatars[i].input.off('move', this.onMove);
        }

        this.room.closeGame();

        delete this.game;
    }
};

/**
 * Set latency
 *
 * @param {Event} event
 */
GameController.prototype.onLatency = function(event)
{
    this.$scope.latency = event.detail[0];
    this.applyScope();
};

/**
 * On gamepad button pressed
 *
 * @param {Event} e
 */
GameController.prototype.onGamepadButton = function(e)
{
    if (this.$scope.end && e.detail.value) {
        gamepadListener.off('gamepad:button', this.onGamepadButton);
        this.backToRoom();
    }
};

/**
 * Go back to the room
 */
GameController.prototype.backToRoom = function()
{
    this.$location.path(this.room.url);
    this.applyScope();
};

/**
 * Apply scope
 */
GameController.prototype.applyScope = CurvytronController.prototype.applyScope;
