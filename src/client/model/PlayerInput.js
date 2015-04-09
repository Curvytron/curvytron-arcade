/**
 * Player input
 */
function PlayerInput(avatar, index)
{
    EventEmitter.call(this);

    this.avatar = avatar;
    this.key    = false;
    this.active = [false, false];
    this.move   = 0;
    this.width  = 0;
    this.index  = index;

    this.onAxis   = this.onAxis.bind(this);
    this.onButton = this.onButton.bind(this);

    this.attachEvents();
}

PlayerInput.prototype = Object.create(EventEmitter.prototype);
PlayerInput.prototype.constructor = PlayerInput;

/**
 * Gamepads input mapping
 *
 * @type {Array}
 */
PlayerInput.prototype.mapping = [
    [4, 6, 2, 14],
    [5, 7, 1, 15]
];


/**
 * Attach events
 */
PlayerInput.prototype.attachEvents = function()
{
    gamepadListener.on('gamepad:' + this.index + ':button', this.onButton);
    gamepadListener.on('gamepad:' + this.index + ':axis:0', this.onAxis);
};

/**
 * Detach events
 */
PlayerInput.prototype.detachEvents = function()
{
    gamepadListener.off('gamepad:' + this.index + ':button', this.onButton);
    gamepadListener.off('gamepad:' + this.index + ':axis:0', this.onAxis);
};

/**
 * On axis
 *
 * @param {Event} e
 */
PlayerInput.prototype.onAxis = function(e)
{
    var x = e.detail.value;

    if (x === 0) {
        this.setActive(0, false);
        this.setActive(1, false);
    } else {
        this.setActive(x > 0 ? 1 : 0, true);
    }
};

/**
 * On button
 *
 * @param {Event} e
 */
PlayerInput.prototype.onButton = function(e)
{
    for (var i = this.mapping.length - 1; i >= 0; i--) {
        if (this.mapping[i].indexOf(e.detail.index) >= 0) {
            return this.setActive(i, e.detail.pressed);
        }
    }
};

/**
 * Resolve
 *
 * @param {Number} index
 * @param {Boolean} pressed
 */
PlayerInput.prototype.setActive = function(index, pressed)
{
    if (this.active[index] !== pressed) {
        this.active[index] = pressed;
        this.resolve();
    }
};

/**
 * Resolve
 */
PlayerInput.prototype.resolve = function()
{
    var move = (this.active[0] !== this.active[1]) ? (this.active[0] ? -1 : 1) : false;

    if (this.move !== move) {
        this.setMove(move);
    }
};

/**
 * Set move
 *
 * @param {Boolean} move
 */
PlayerInput.prototype.setMove = function(move)
{
    this.move = move;
    this.emit('move', {avatar: this.avatar, move: move});
};

/**
 * Set width
 *
 * @param {Number} width
 */
PlayerInput.prototype.setWidth = function(width)
{
    this.width = width;
};
