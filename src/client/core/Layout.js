/**
 * Game layout
 */
function Layout()
{
    this.main   = document.getElementById('col-right');
    this.infos  = document.getElementById('game-infos');
    //this.death  = document.getElementById('game-death');
    this.render = document.getElementById('render');

    //this.onResize = this.onResize.bind(this);

    window.addEventListener('resize', this.onResize);

    //this.onResize();
}

/**
 * On resize
 */
Layout.prototype.onResize = function()
{
    var width = Math.floor((window.innerWidth - this.render.clientWidth)/2) + 'px';

    this.main.style.paddingLeft = width;
    this.infos.style.width     = width;
};

/**
 * Destroy
 */
Layout.prototype.destroy = function()
{
    window.removeEventListener('resize', this.onResize);
};
