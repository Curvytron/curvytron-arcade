/**
 * Curvytron Controller
 *
 * @param {Object} $scope
 * @param {Object} $window
 * @param {SocketClient} client
 */
function CurvytronController($scope, $window, client)
{
    this.$scope   = $scope;
    this.$window  = $window;
    this.client   = client;

    // Bind
    this.onConnect    = this.onConnect.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);
    this.reload       = this.reload.bind(this);

    // Hydrate scope
    this.$scope.curvytron = {bodyClass: ''};
    this.$scope.status    = 'connecting';
    this.$scope.reload    = this.reload;

    this.client.on('connected', this.onConnect);
    this.client.on('disconnected', this.onDisconnect);
}

/**
 * On connect
 *
 * @param {Event} e
 */
CurvytronController.prototype.onConnect = function(e)
{
    this.$scope.status = 'online';
    this.applyScope();
};

/**
 * On disconnect
 *
 * @param {Event} e
 */
CurvytronController.prototype.onDisconnect = function(e)
{
    this.$scope.status    = 'disconnected';
    this.$scope.curvytron = { bodyClass: '' };
    this.applyScope();
};

/**
 * Reload
 */
CurvytronController.prototype.reload = function()
{
    this.$window.location.href = '/';
};

/**
 * Apply scope
 */
CurvytronController.prototype.applyScope = function()
{
    var phase = this.$scope && this.$scope.$root ? this.$scope.$root.$$phase : null;

    if (phase !== '$apply' && phase !== '$digest') {
        this.$scope.$apply();
    }
};
