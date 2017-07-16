var assert = require('assert');
var utilities = require('../utilities.js');
var courses = require('./allCourses').allCourses;
var scheduleGen = require('../schedule_generator');

describe('SpeedTest', function () {
    it('Average Execution time under 5 seconds', function (done) {
        this.timeout(0);

        var t = utilities.timer();
        var numIterations = 50;

        for (var i = 0; i < numIterations; i++) {
            var selectedCourses = pickRandomCourses(10);
            scheduleGen.generateValidSchedulesFromCourses(selectedCourses);
        }
        var durationms = t.stop() / numIterations;

        console.log("Average Duration: " + Math.round(durationms) / 1000 + " seconds");
        assert(durationms < 5000);
        done();
    })
});

function pickRandomCourses(numCourses) {
    var returnCourses = [];
    var courseMaxIndex = courses.length - 1;

    for (var i = 0; i < numCourses; i++) {
        var index = Math.round(Math.random() * courseMaxIndex);
        returnCourses.push(courses[index]);
    }

    return returnCourses;
}