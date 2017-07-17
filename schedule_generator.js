function CustomError(message) {
    this.name = 'CustomError';
    this.message = message || '';
    var error = new Error(this.message);
    error.name = this.name;
    this.stack = error.stack;
}
CustomError.prototype = Object.create(Error.prototype);

//Returns a list of activities
function generateValidSchedulesFromCourses(courses) {
    var activityCombinations = [];

    //Algorithm
    //TODO


    //First Make All Combinations Of Sections
    courses.forEach(function(course) {
        //Combine all the sections into one list -- [ Section A, Section B]
        //Section A = [ LECList, DGDList] etc
        //LECList = [Activity1, Activity2]

        var sectionsComb = [];
        course.Sections.forEach(function(section) {
            sectionsComb = sectionsComb.concat(generateSectionCombinations(section.ActivityGroups));
        });

        //"Append" the sections
        activityCombinations = generateAllCombinations(activityCombinations, sectionsComb);

    });

    activityCombinations = activityCombinations.filter(function (comb) {
        if(!(comb instanceof Array)) { return true; } //Only 1 Element
        return isValidComb(comb);
    });

    return activityCombinations;
}

function isValidComb(activityCombination) {
    var days = {};
    activityCombination.forEach(function (activity) { //Group activities by their day of the week
        if(days[activity.Day] == null) {
            days[activity.Day] = [];
        }

        days[activity.Day].push(activity);
    });

    var dayKeys = Object.keys(days);
    //Sort the activities in the day by their start hour to make finding overlap easier
    dayKeys.forEach(function (day) {
        days[day] = days[day].sort(function (a, b) {
            return a.StartHour - b.StartHour
        });
    });

    for (var i = 0; i < dayKeys.length; i++) {
        var currentDaySchedule = days[dayKeys[i]];
        if (!isValidDailySchedule(currentDaySchedule)) {
            return false;
        }
    }

    return true;
}
function isValidDailySchedule(dailySchedule) {
    for (var i = 1; i < dailySchedule.length; i++) {
        var isValid = dailySchedule[i - 1].EndHour <= dailySchedule[i].StartHour;

        if(!isValid) return false;
    }

    return true;
}
function generateSectionCombinations(data) {
    var currentComb = data[0].Activities;
    for (var i = 1; i < data.length; i++) {
        currentComb = generateAllCombinations(currentComb, data[i].Activities);
    }
    return currentComb;
}

//Order Does Not Matter
function generateAllCombinations(itemList1, itemList2) {
    itemList1 = toArray(itemList1);
    itemList2 = toArray(itemList2);

    if (itemList1.length == 0 && itemList2.length == 0) {
        throw new CustomError("Both lists are empty, should not happen.");
    }
    if (itemList1.length == 0) return itemList2;
    if (itemList2.length == 0) return itemList1;

    var combinations = [];
    itemList2.forEach(function(comb2Item) {
        itemList1.forEach(function(comb1Item) {
            combinations.push(toArray(comb1Item).concat(comb2Item));
        })
    });

    return combinations;
}

//Converts the data to an array if it is not already one
function toArray(data) {
    return data instanceof Array ? data : [data];
}

if (typeof module === "object" && module.exports) {
    module.exports = {
        generateValidSchedulesFromCourses: generateValidSchedulesFromCourses
    };
}