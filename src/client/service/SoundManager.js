/**
 * Sound Manager
 */
function SoundManager ()
{
    this.active = true;

    this.toggle = this.toggle.bind(this);

    createjs.Sound.alternateExtensions = ['mp3'];
    createjs.Sound.registerSounds(this.sounds, this.directory);
    createjs.Sound.setVolume(this.active ? this.volume : 0);
}

/**
 * Volume
 *
 * @type {Number}
 */
SoundManager.prototype.volume = 0.5;

/**
 * Sounds
 *
 * @type {Array}
 */
SoundManager.prototype.sounds = [
    {id:'death', src:'death.ogg'},
    {id:'win', src:'win.ogg'},
    {id:'notice', src:'notice.ogg'},
    {id:'bonus-clear', src:'bonus-clear.ogg'},
    {id:'bonus-pop', src:'bonus-pop.ogg'}
];

/**
 * Directory
 *
 * @type {String}
 */
SoundManager.prototype.directory = 'sounds/';

/**
 * Play a sound
 *
 * @param {String} sound
 */
SoundManager.prototype.play = function(sound)
{
    createjs.Sound.play(sound);
};

/**
 * Sound manager
 *
 * @param {String} sound
 */
SoundManager.prototype.stop = function(sound)
{
    createjs.Sound.stop(sound);
};

/**
 * Toggle active
 */
SoundManager.prototype.toggle = function ()
{
    this.setActive(!this.active);
};

/**
 * Set active/inactive
 *
 * @param {Boolean} active
 */
SoundManager.prototype.setActive = function(active)
{
    this.active = active ? true : false;
    this.setVolume(this.active ? this.volume : 0);
};

/**
 * Set volume
 *
 * @param {Number} volume
 */
SoundManager.prototype.setVolume = function(volume)
{
    createjs.Sound.setVolume(typeof(volume) !== 'undefined' ? volume : this.volume);
};
