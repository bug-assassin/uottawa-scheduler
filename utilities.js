var noop = function () {};

function convertHourMinuteIntegerToString(hourMinute) {
    var hourMinuteString = hourMinute.toString();
    var length = hourMinuteString.length;
    var hour = hourMinuteString.substr(0, Math.floor(length / 2));
    var minute = hourMinuteString.substr(-2);
    return hour + ":" + minute;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
};
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
//Converts the data to an array if it is not already one
function toArray(data) {
    return data instanceof Array ? data : [data];
}

var timer = function(name) {
    var start = new Date();
    return {
        stop: function() {
            var end  = new Date();
            var time = end.getTime() - start.getTime();
            //console.log('Timer:', name, 'finished in', time, 'ms');

            return time;
        }
    }
};

function nameToColor(name) {
    return name.getHashCode().intToHSL();
}

//https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
String.prototype.getHashCode = function() {
    var hash = 0;
    if (this.length == 0) return hash;
    for (var i = 0; i < this.length; i++) {
        hash = this.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};
Number.prototype.intToHSL = function() {
    var shortened = this % 360;
    return "hsl(" + shortened + ",100%,30%)";
};

if (typeof module === "object" && module.exports) {
    module.exports = {
        timer: timer
    };
}


var Store = {
    set: function (key, data) {
        if(typeof data === "string" || data instanceof String) {
            localStorage.setItem(key, data);
        }
        else {
            localStorage.setItem(key, JSON.stringify(data));
        }
    },
    get: function (key) {
      return localStorage.getItem(key);
    },
    getJSON: function (key) {
        var item = localStorage.getItem(key);
        if(item == null) {
            return item;
        }
        return JSON.parse(item);
    },
    clear: function () {
        localStorage.clear();
    }
};

function isEmpty(value) {
    return value == null || value.length == 0
}