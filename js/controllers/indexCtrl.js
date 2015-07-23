app.controller("indexCtrl", [
    "$rootScope",
    "$scope",
    function ($rootScope, $scope) {
        $scope.abc = "打开日历";
        $scope.$on('bbb', function (event, data) {
            console.log(data)
            $scope.abc = data.fullYMD;
        })

        $scope.name = "选择日期"

        $scope.changeName = function () {
            $scope.name = "哇急啊急啊急"
        }

        $scope.changeName1 = function () {
            $scope.name = "选择哇哈哈"
        }

        $scope.dateRange = "2015-07-10,2016-07-10"

        $scope.changeData = function () {
            $scope.dateRange = "2015-12-10,2017-01-10"
        }
        $scope.changeData1 = function () {
            $scope.dateRange = "2015-01-10,2015-03-31"
        }
    }
])

