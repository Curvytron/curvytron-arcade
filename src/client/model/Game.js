/**
 * Game
 *
 * @param {Room} room
 */
function Game(room)
{
    BaseGame.call(this, room);

    this.render     = document.getElementById('render');
    this.canvas     = new Canvas(0, 0, document.getElementById('game'));
    this.background = new Canvas(0, 0, document.getElementById('background'));

    this.onResize = this.onResize.bind(this);

    window.addEventListener('error', this.stop);
    window.addEventListener('resize', this.onResize);

    this.onResize();
}

Game.prototype = Object.create(BaseGame.prototype);
Game.prototype.constructor = Game;

/**
 * Background color
 *
 * @type {String}
 */
Game.prototype.backgroundColor = '#222222';

/**
 * Get new frame
 */
Game.prototype.newFrame = function()
{
    this.frame = window.requestAnimationFrame(this.loop);
};

/**
 * Clear frame
 */
Game.prototype.clearFrame = function()
{
    window.cancelAnimationFrame(this.frame);
    this.frame = null;
};

/**
 * On frame
 *
 * @param {Number} step
 */
Game.prototype.onFrame = function(step)
{
    this.draw();
    BaseGame.prototype.onFrame.call(this, step);
};

/**
 * On round new
 */
Game.prototype.onRoundNew = function()
{
    BaseGame.prototype.onRoundNew.call(this);
    this.clearBackground();
    this.draw();
};

/**
 * On stop
 */
Game.prototype.onStop = function()
{
    BaseGame.prototype.onStop.call(this);
    this.clearBackground();
    this.draw();
};

/**
 * Is tie break
 *
 * @return {Boolean}
 */
Game.prototype.isTieBreak = function()
{
    var maxScore = this.maxScore;

    return this.avatars.match(function () { return this.score >= maxScore; }) !== null;
};

/**
 * Is borderless?
 *
 * @return {Boolean}
 */
Game.prototype.isBorderless = function()
{
    return this.avatars.match(function () {
        return this.alive && this.borderless;
    }) !== null;
};

/**
 * Are all avatars ready?
 *
 * @return {Boolean}
 */
Game.prototype.isReady = function()
{
    return this.started ? true : BaseGame.prototype.isReady.call(this);
};

/**
 * Clear trails
 */
Game.prototype.clearTrails = function()
{
    this.clearBackground();
};

/**
 * End
 */
Game.prototype.end = function()
{
    if (this.started) {
        this.started = false;

        window.removeEventListener('error', this.stop);
        window.removeEventListener('resize', this.onResize);

        this.stop();
        this.fps.stop();
        this.canvas.clear();
    }
};

/**
 * Update size
 */
Game.prototype.setSize = function(size)
{
    BaseGame.prototype.setSize.call(this, size);

    this.onResize();
};

/**
 * Draw
 *
 * @param {Number} step
 */
Game.prototype.draw = function()
{
    var i, avatar;

    for (i = this.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.avatars.items[i];
        if (avatar.present) {
            this.drawTail(avatar);
        }
    }

    this.canvas.clear();

    for (i = this.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.avatars.items[i];
        if (avatar.present) {
            this.drawAvatar(avatar);

            if (avatar.alive && avatar.hasBonus()) {
                this.drawBonusStack(avatar);
            }

            if (!this.frame && avatar.local) {
                this.drawArrow(avatar);
            }

            if (avatar.animation) {
                avatar.animation.draw(this.canvas);
            }
        }
    }

    this.drawBonuses();
};

/**
 * Draw tail
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawTail = function(avatar)
{
    var points = avatar.trail.getLastSegment();

    if (points) {
        this.background.drawLineScaled(points, avatar.width, avatar.color);
    }
};

/**
 * Draw avatar
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawAvatar = function(avatar)
{
    avatar.updateStart();
    this.canvas.drawImage(avatar.canvas.element, avatar.start, avatar.angle);
};

/**
 * Draw bonus stack
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawBonusStack = function(avatar)
{
    this.canvas.drawImage(avatar.bonusStack.canvas.element, [avatar.start[0] + 15, avatar.start[1] + 15]);
};

/**
 * Draw arrow
 *
 * @param {Avatar} avatar
 */
Game.prototype.drawArrow = function(avatar)
{
    this.canvas.drawImageScaled(
        avatar.arrow.element,
        [
            avatar.head[0] - 5,
            avatar.head[1] - 5
        ],
        10,
        10,
        avatar.angle
    );
};

/**
 * Draw bonuses
 */
Game.prototype.drawBonuses = function()
{
    this.bonusManager.draw(this.canvas);
};

/**
 * Clear background with color
 */
Game.prototype.clearBackground = function()
{
    this.background.color(this.backgroundColor);
};

/**
 * On resize
 */
Game.prototype.onResize = function()
{
    var x = window.innerWidth,
        y = window.innerHeight;

    var width = Math.min(x - document.getElementById('game-infos').clientWidth - 8, y - 8),
        scale = width / this.size,
        avatar;

    for (i = this.avatars.items.length - 1; i >= 0; i--) {
        avatar = this.avatars.items[i];

        avatar.setScale(scale);

        if (typeof(avatar.input) !== 'undefined') {
            avatar.input.setWidth(x);
        }
    }

    this.render.style.width = (width + 8) + 'px';
    this.render.style.height = (width + 8) + 'px';
    this.canvas.setDimension(width, width, scale);
    this.background.setDimension(width, width, scale, true);
    this.draw();
};
