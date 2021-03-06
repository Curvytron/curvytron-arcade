/**
 * Photo Booth
 */
function PhotoBooth()
{
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    this.enabled   = photobooth;
    this.video     = document.createElement('video');
    this.canvas    = new Canvas(this.width, this.height);
    this.streaming = false;
    this.parent    = null;
    this.pictures  = [];

    this.onVideo          = this.onVideo.bind(this);
    this.onError          = this.onError.bind(this);
    this.onLoadedMetaData = this.onLoadedMetaData.bind(this);
    this.onCanPlay        = this.onCanPlay.bind(this);

    this.video.addEventListener('loadedmetadata', this.onLoadedMetaData);
    this.video.addEventListener('canplay', this.onCanPlay);
    this.video.addEventListener('error', this.onError);

    this.start();
}

/**
 * Camera width
 *
 * @type {Number}
 */
PhotoBooth.prototype.width = 640;

/**
 * Camera height
 *
 * @type {Number}
 */
PhotoBooth.prototype.height = 480;

/**
 * Enabled
 *
 * @type {Boolean}
 */
PhotoBooth.prototype.enabled = true;

/**
 * Take a picture
 *
 * @return {Resource}
 */
PhotoBooth.prototype.takePicture = function()
{
    if (this.streaming) {
        this.canvas.drawImage(this.video);

        var picture = this.canvas.toString();

        this.pictures.push(picture);

        return picture;
    }

    return null;
};

/**
 * Start video stream
 */
PhotoBooth.prototype.start = function()
{
    if (!this.enabled) { return; }

    if (!this.streaming) {
        this.streaming = true;
        if (this.video.src) {
            this.video.play();
        } else {
            if (typeof(navigator.getUserMedia) === 'undefined' || !navigator.getUserMedia) {
                return this.onError({name: 'User media api supported.'});
            }
            navigator.getUserMedia(this.getConstraints(), this.onVideo, this.onError);
        }
    }
};

/**
 * Stop
 */
PhotoBooth.prototype.stop = function()
{
    if (this.streaming) {
        this.streaming = false;
        this.video.pause();
    }
};

/**
 * Get constraints
 *
 * @return {Object}
 */
PhotoBooth.prototype.getConstraints = function()
{
    return {
        audio: false,
        video: {
            mandatory: {
              maxWidth: this.width,
              maxHeight: this.height
            }
        }
    };
};

/**
 * On video
 *
 * @param {Resource} stream
 */
PhotoBooth.prototype.onVideo = function(stream)
{
    this.video.src = window.URL.createObjectURL(stream);
};

/**
 * On loaded meta data
 *
 * @param {Event} event
 */
PhotoBooth.prototype.onLoadedMetaData = function(event)
{
    this.video.play();
};

/**
 * On video can play
 *
 * @param {Event} event
 */
PhotoBooth.prototype.onCanPlay = function(event)
{
    this.height = this.video.videoHeight;
    this.width  = this.video.videoWidth;

    this.canvas.setDimension(this.width, this.height);
    this.video.width  = this.width;
    this.video.height = this.height;
};

/**
 * Attach
 *
 * @param {DOMElement} element
 */
PhotoBooth.prototype.attach = function(element)
{
    if (!this.enabled) { return; }

    if (element && !this.parent) {
        this.parent = element;
        this.parent.appendChild(this.video);
    }
};

/**
 * Detach
 */
PhotoBooth.prototype.detach = function()
{
    if (this.parent) {
        this.parent.removeChild(this.video);
        this.parent = null;
    }
};

/**
 * Clear
 */
PhotoBooth.prototype.clear = function()
{
    this.pictures.length = 0;
};

/**
 * On error
 *
 * @param {Object} error
 */
PhotoBooth.prototype.onError = function(error)
{
    this.streaming = false;
    this.enabled   = false;
    console.error('The following error occured: %s',  error.name);
};
