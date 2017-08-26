var dayStrings = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


var template_activity = "<tr><td>{{ActivityType}}</td><td>{{Name}}</td><td>{{Place}}</td><td>{{Professor}}</td><td>{{Day}} {{StartHour}}-{{EndHour}}</td></tr>";

function generateCourseHTML(course) {
    var courseHtml = "<tbody data-course-code='{{CourseCode}}'><tr><th class='courseTitle' colspan='2'>{{CourseCode}} {{CourseName}} <a class='removeCourseBtn'><span class='icon is-small'><i class='icon-cancel'></i></span></a> </th></tr><td><table class='monitored_table table'>"
        .replaceAll("{{CourseCode}}", course.CourseCode)
        .replace("{{CourseName}}", course.Title);

    course.Sections.forEach(function (courseSection) {
        //For Each Section Code (A, B, C)
        var sectionCode = courseSection.SectionCode;
        var sectionHtml = "<thead><tr><th>Section {{SectionCode}}</th></tr></thead>".replace("{{SectionCode}}", sectionCode);

        //TODO Sort By LEC, DGD, ETC
        courseSection.ActivityGroups.forEach(function (activityGroup) {
            sectionHtml += "<tbody>";
            activityGroup.Activities.forEach(function (activity) {
                sectionHtml += generateActivityHtml(activity, sectionCode);
            });
            sectionHtml += "</tbody>";
        });

        courseHtml += sectionHtml;
    });

    courseHtml += "</table></td>";
    courseHtml += "<tr class='table-spacer'></tr>";
    courseHtml += "</tbody>";

    return courseHtml;
}

function generateActivityHtml(activity, sectionCode) {
    var result = template_activity.replace("{{ActivityType}}", activity.ActivityType)
        .replaceAll("{{Name}}", activity.Name)
        .replace("{{Day}}", dayStrings[activity.Day])
        .replace("{{StartHour}}", convertHourMinuteIntegerToString(activity.StartHour))
        .replace("{{EndHour}}", convertHourMinuteIntegerToString(activity.EndHour))
        .replace("{{Place}}", activity.Place)
        .replace("{{Professor}}", activity.Professor)
        .replace("{{SectionName}}", "section_" + sectionCode + activity.ActivityType);

    return result;
}