/**
 * Created by Reeoo on 2015/7/13 0013.
 */
var myCalendar = angular.module("myCalendar", []);
myCalendar.directive("calendar", ['$compile', '$timeout', '$q', function ($compile, $timeout, $q) {
    /*
     * 每次打开日期都是实时生成日历数据
     name       {string}  日历页面的名字，是日历页面元素的id前缀，规则是：name + "Page"，默认是calendar，
     如果需要多个日历页面，可以给日历页面配置不同的名字
     title      {string}  日历页面的标题，默认是"选择日期"，可以配置
     startDate  {string | Date}  日历的起始日期，默认是当天，使用字符串话，格式为短线分割的日期，例如：2014-01-01
     endDate    {string | Date}  日历的终止时间，默认是半年之后
     curentDate {Array}  当前选中的时间，同时配置开始和结束日期的话会有区间选择的效果
     reverseOrder  {boolean}  日历是否倒序，默认是false，如果需要倒叙，设置为true
     model  {string} 默认是"rangeFrom"，"rangeTo"可以配置为"range"，表示区间，可以选择起始时间和终止时间
     tips   {Array}  区间选择的提示，默认是["请选择起始时间", "请选择结束时间"]
     wrapper    {zepto}  包含日历元素，也就是自定义日历页面，高级属性，较少用到
     fn     {function}  点击执行回调，二个参数（date，elem），第一个参数是时间数组，第二个参数是td元素（自定义内容可以通过td获取里面内容的值属性）
     growInterval  {number}   一次请求月份增长区间，默认是一个月一个月请求（0.0.3）
     ajaxOjb    {object} ajax请求对象，直接传递$.ajax方法
     url里面可配置年月参数名如 http://www.xxx.com?yearaa={year}&monthaa={month}&grow={growInterval},{year}和{month}是不变的
     也可以在beforeSend里面处理(xhr,setting,date) 第一个ajax对象，第二个是ajax配置，第三个是日期
     buildContent{function} 四个参数(date,dateStr,classArr,data)，第一个参数是日期。第二个参数返回节日和今天和空。
     第三个参数是类名数组，可向classArr里面push类名，会加在td上面，同时也可以用来判断是否是disabled的
     第四个参数是数据，这里是一个月的所有数据，通过对date的日期判断，是否取data里面的数据。
     */
    /*
     * startDate:{string} "20150720"
     * endDate:{string} "20150820"
     *
     * */

    Date.prototype.format = function (format) {
        var o = {
            "M+": this.getMonth() + 1, //month
            "d+": this.getDate(), //day
            "h+": this.getHours(), //hour
            "m+": this.getMinutes(), //minute
            "s+": this.getSeconds(), //second
            "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
            "S": this.getMilliseconds() //millisecond
        }
        if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format))
                format = format.replace(RegExp.$1,
                    RegExp.$1.length == 1 ? o[k] :
                        ("00" + o[k]).substr(("" + o[k]).length));
        }
        return format;
    }


    function calendar(settings) {
        this.scope = settings.scope;
        this.cbFn = settings.cbFn || angular.noop;
        this.dateRange = settings.dateRange;
        this.name = settings.name;
        this.pickerFn = settings.pickerFn;
        this.needClear = settings.needClear || false;
        this.template =
            '<div class="calendar">' +
            '<h3 class="calendar-title" ng-bind="calendarTitle"></h3>' +
            '<table>' +
            '<tr class="suntosat"><th class="sun-sat">日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th class="sun-sat">六</th></tr>' +
            '<tr ng-repeat="data in pdata track by $index">' +       //ng-class="{true: \'sun-sat\', false: \'\'}[$index == 0 || $index == 6]"
            '<td ng-class="{true:\'active\',false:\'\'}[item.active]" ng-click="click(item.fullYMD,item.price,item)" ng-repeat="item in data track by $index">' +
            '<div ng-class="{true:\'calendar-content hide-day\',false:\'calendar-content\'}[item.type == \'prev\' || item.type == \'next\']">' +
            '<p class="calendar-day" ng-bind="item.day"></p>' +
            '<div class="calendar-extend-data" ng-bind="item.price"></div>' +
            '</div>' +
            '</td>' +
            '</tr>' +
            '</table>' +
            '</div>'
        this.init();
    }


    calendar.prototype = {
        constructor: calendar,

        init: function () {
            if (this.needClear) {
                console.log(angular.element(document.querySelector('.calendar-box')))
                angular.element(document.querySelectorAll('.calendar')).remove();
            }
            this.getTimeList();
        },
        setDateList: function (result, startYear, startMonth) {
            var arr = [], tArr = [], html, j = 0, self = this;
            var scope = self.scope.$new(true);//创建独立作用域，尼玛，再也不会都一样了。
            for (var i = 0; i < result.length; i++) {//分组，每7个一组
                result[i].price = "¥" + result[i].day + "0";
                tArr.push(result[i]);
                if (j == 6) {
                    arr.push(tArr)
                    tArr = [];
                    j = 0;
                }
                else {
                    ++j;
                }
            }

            scope.pdata = arr;//长得像这样子：[[{},{},{},{},{},{},{}],[{},{},{},{},{},{},{}],[{},{},{},{},{},{},{}]......]
            scope.calendarTitle = startYear + "年" + startMonth + "月";
            scope.calendarName = self.name;
            scope.returnYM = startYear + "-" + (startMonth > 9 ? startMonth : "0" + startMonth);
            scope.click = function (fullYMD, price, item) {
                var isActive = item.active;
                angular.forEach(result, function (i, e) {
                    i.active = false;
                })
                if(isActive){
                    item.active = false;
                }
                else{
                    item.active = true;
                }

                scope.$emit(self.cbFn, {
                    fullYMD: fullYMD,
                    price: price
                })
            }

            html = $compile(self.template)(scope);
            angular.element(document.querySelector('.calendar-box')).append(html);
        },
        getTimeList: function () {
            var self = this;
            var startDate = this.dateRange.split(',')[0] || (new Date()).format('yyyy-MM-dd');

            var endDate = this.dateRange.split(',')[1] || new Date().format('yyyy-MM-dd');

            var startYear = +startDate.split('-')[0],
                startMonth = +startDate.split('-')[1],
                endYear = +endDate.split('-')[0],
                endMonth = +endDate.split('-')[1];


            var result;
            if (startYear === endYear) {
                for (; startMonth <= endMonth; startMonth++) {
                    result = self.buildCalendar41Month(startYear, startMonth);
                    self.setDateList(result, startYear, startMonth);
                }
            }
            else {
                for (var i = startMonth; i <= 12; i++) {
                    result = self.buildCalendar41Month(startYear, i);//生成开始年份的日历
                    self.setDateList(result, startYear, i);
                }

                if (endYear - startYear > 1) {
                    for (var i = startYear + 1; i < endYear; i++) {
                        for (var j = 1; j <= 12; j++) {
                            result = self.buildCalendar41Month(i, j);//生成完整年份的日历
                            self.setDateList(result, i, j);
                        }
                    }
                }

                for (var i = 1; i <= endMonth; i++) {
                    result = self.buildCalendar41Month(endYear, i);//生成结束年份的日历
                    self.setDateList(result, endYear, i);
                }
            }

        },
        buildCalendar41Month: function (y, m) {
            var arr = [];
            var maxDay = this.getMaxDayInMonth(y, m),//这个月的天数
                firstDay = this.getWeekday(y, m);//这个月的第一天是周几
            var lastMonthMaxDay;
            if (m == 1) {
                lastMonthMaxDay = this.getMaxDayInMonth(y - 1, 12);//上一个月多少天
            }
            else {
                lastMonthMaxDay = this.getMaxDayInMonth(y, m - 1);//上一个月多少天
            }
            var nextMonthFirstDay;
            if (m == 12) {
                nextMonthFirstDay = this.getWeekday(y + 1, 1);//上一个月多少天
            }
            else {
                nextMonthFirstDay = this.getWeekday(y, m + 1);//上一个月多少天
            }


            for (var i = lastMonthMaxDay - firstDay + 1; i <= lastMonthMaxDay; i++) {//补足上月
                var Y = m - 1 == 0 ? y - 1 : y;
                var M = m - 1 > 9 ? m - 1 : m - 1 == 0 ? 12 : "0" + (m - 1);
                arr.push({
                    type: "prev",
                    day: i,
                    fullYMD: Y + '-' + M + '-' + (i > 9 ? i : "0" + i)
                })
            }

            for (var j = 1; j <= maxDay; j++) {//处理当月
                arr.push({
                    type: "curr",
                    day: j,
                    fullYMD: y + '-' + (m > 9 ? m : "0" + m) + '-' + (j > 9 ? j : "0" + j)
                })
            }

            if (nextMonthFirstDay > 0) {
                var Y = m + 1 > 12 ? y + 1 : y;
                var M = m + 1 > 12 ? m = "01" : (m + 1 > 9 ? m + 1 : "0" + (m + 1));
                for (var k = 1; k <= 7 - nextMonthFirstDay; k++) {//补足下月
                    var d = k > 9 ? k : "0" + k;
                    arr.push({
                        type: "next",
                        day: k,
                        fullYMD: Y + "-" + M + "-" + d
                    })
                }
            }

            return arr;

        },
        getWeekday: function (y, m) {//获取每个月的第一天是周几
            if (y && m) {
                return new Date(y + "/" + m + "/01").getDay()
            }

            return new Date().getDay()

        }
        ,
        getMaxDayInMonth: function (y, m) {//获取一个月的最大天数
            var date;
            if (y && m) {
                date = new Date(y + "/" + m);
            }
            else {
                date = new Date();
            }

            var month = date.getMonth();

            date.setMonth(month + 1);

            date.setDate(0);

            return date.getDate();

        }
    }

    return {
        restrict: 'AE',
        scope: {
            name: "@calendarName",
            pickerFn: "&",
            dateRange: '@'
        },
        template: '<section class="calendar-box"><h3 class="calendar-name" ng-if="name" ng-bind="name"></h3></section>',
        compile: function () {
            return {
                pre: function (scope, elem, attrs) {
                    var dateRange = attrs.dateRange || 0,
                        name = attrs.name || "",
                        cbFn = attrs.cbFn,
                        cal = new calendar({
                            dateRange: dateRange,
                            scope: scope,
                            name: name,
                            cbFn: cbFn
                        });
                    scope.$watch('dateRange', function (newValue, oldValue) {
                        if (newValue !== oldValue) {//数据发生改变
                            cal.needClear = true;
                            cal.dateRange = newValue;
                            cal.init()
                        }
                    })

                    scope.$watch('name', function (newValue, oldValue) {
                        if (newValue !== oldValue) {//数据发生改变
                            cal.name = newValue;
                        }
                    })
                },
                post: function (scope, elem, attrs) {

                }
            }
        }
    };
}])


