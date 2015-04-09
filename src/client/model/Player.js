/**
 * Player
 *
 * @param {Number} id
 * @param {String} client
 * @param {String} name
 * @param {String} color
 * @param {Boolean} ready
 * @param {Boolean} active
 */
function Player(id, client, name, color, ready, active)
{
    BasePlayer.call(this, client, name, color, ready);

    this.id        = id;
    this.active    = active;
    this.local     = false;
    this.vote      = false;
    this.kicked    = false;
}

Player.prototype = Object.create(BasePlayer.prototype);
Player.prototype.constructor = Player;

/**
 * Set local
 *
 * @param {Boolean} local
 */
Player.prototype.setLocal = function(local)
{
    this.local = local;
};
