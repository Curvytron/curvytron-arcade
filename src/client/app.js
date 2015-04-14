var curvytronApp = angular.module('curvytronApp', ['ngRoute', 'ngCookies', 'colorpicker.module']),
    gamepadListener = new GamepadListener({analog: false, deadZone: 0.4});

gamepadListener.start();

curvytronApp.service('SocketClient', SocketClient);
curvytronApp.service('RoomRepository', ['SocketClient', RoomRepository]);
curvytronApp.service('SoundManager', SoundManager);
curvytronApp.service('KillLog', KillLog);
curvytronApp.service('PhotoBooth', PhotoBooth);

curvytronApp.controller(
    'CurvytronController',
    ['$scope', '$window', 'SocketClient', 'PhotoBooth', CurvytronController]
);
curvytronApp.controller(
    'RoomController',
    ['$scope', '$routeParams', '$location', 'SocketClient', 'RoomRepository', RoomController]
);
curvytronApp.controller(
    'GameController',
    ['$scope', '$routeParams', '$location', 'SocketClient', 'RoomRepository', 'SoundManager', 'KillLog', 'PhotoBooth', GameController]
);
curvytronApp.controller(
    'KillLogController',
    ['$scope', 'KillLog', KillLogController]
);

curvytronApp.config(['$routeProvider', '$locationProvider', function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'js/views/rooms/detail.html',
            controller: 'RoomController'
        })
        .when('/play', {
            templateUrl: 'js/views/game/play.html',
            controller: 'GameController'
        })
        .otherwise({
            redirectTo: '/'
        });
}]);
