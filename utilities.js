function hourMinuteToString(hourMinute) {
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

module.exports = {
    timer: timer
};