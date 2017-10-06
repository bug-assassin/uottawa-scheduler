package main

import (
	"io/ioutil"
	"encoding/json"
	"fmt"
	"os"

	"strings"
	"regexp"
	"strconv"
	"math"
	"time"
)

type NormalizedCourseInfo struct {
	CourseCode string
	Title      string
	Url        string
	Sections   []NormalizedSection
}
type NormalizedSection struct {
	SectionCode    string //Alphabet characters, Ex. A, B, C, D
	ActivityGroups []ActivityGroup
}
type ActivityGroup struct {
	ActivityType string //LEC, DGD. ETC
	Activities  []NormalizedActivity
}
type NormalizedActivity struct {
	Name          string
	ActivityType  string //LEC, DGD, LAB, TUT  - Removed: STG (Internship), REC/TLB (Research Project),
	StartDate string
	EndDate string
	Day           int
	StartHour     int
	EndHour       int
	Place         string
	Professor     string
}
type CourseLookup struct
{
	Title string `json:"value""`
	CourseCode string	 `json:"data"`
}
type Stats struct {
	NumCourses         int
	EarliestCourseTime int
	LatestCourseTime   int
}

const outPath = "scraper/out/"
func RunNormalizer(term string) {
	scraped_courses_file, err := ioutil.ReadFile(getPathFromTerm(term) + "step_0_scraped_courses.json")
	panicOnError(err)

	courses := make([]CourseInfo, 0, 2000)
	json.Unmarshal(scraped_courses_file, &courses)

	//Step 1: Clean Up
	originalLength := len(courses)
	fmt.Println("Num Courses: ", originalLength)

	courses = removeInvalidSections(courses)
	courses = removeEmptyAndNoSectionCourses(courses)
	fmt.Printf("Removed %d courses\n", originalLength-len(courses))
	fmt.Println("Num Courses: ", len(courses))

	WriteDataToJsonFileAndCreatePath(courses, "step_1_clean_courses.json", getPathFromTerm(term))

	//Step 2: Convert into better format
	normalizedCourses := make([]NormalizedCourseInfo, 0, len(courses))
	for _, course := range courses {
		normalizedActivities := normalizeActivities(course.Sections)
		normalizedSections := groupActivities(normalizedActivities)

		normalizedCourse := NormalizedCourseInfo{course.CourseCode, course.Title, course.Url, normalizedSections}
		normalizedCourses = append(normalizedCourses, normalizedCourse)
	}

	//TODO Sort Sections


	WriteDataToJsonFileAndCreatePath(normalizedCourses, "step_2_normalized_courses.json", getPathFromTerm(term))

	for _, course := range normalizedCourses {
		WriteDataToJsonFileAndCreatePath(course, course.CourseCode + ".json", getPathFromTerm(term) + "courses/")
	}

	//Create File With List Of Course Titles
	courseSearch1 := make([]string, 0, 2000)
	for _, course := range normalizedCourses {
		courseSearch1 = append(courseSearch1, course.CourseCode + " - " + course.Title)
	}
	WriteDataToJsonFileAndCreatePath(courseSearch1, "step_2_course_titles.json", getPathFromTerm(term))


	stats := Stats{len(normalizedCourses), 1200, 1200}
	//Stats File
	for _, course := range normalizedCourses {
		for _, section := range course.Sections {
			for _, activityGroup := range section.ActivityGroups {
				for _, activity := range activityGroup.Activities {
					stats.EarliestCourseTime = int(math.Min(float64(activity.StartHour), math.Min(float64(activity.EndHour), float64(stats.EarliestCourseTime))))
					stats.LatestCourseTime = int(math.Max(float64(activity.StartHour), math.Max(float64(activity.EndHour), float64(stats.LatestCourseTime))))
				}
			}
		}
	}
	WriteDataToJsonFileAndCreatePath(stats, "stats.json", getPathFromTerm(term))

}

func WriteDataToJsonFileAndCreatePath(data interface{}, fileName string, path string)  {
	err := os.MkdirAll(path, os.ModePerm)
	panicOnError(err)
	WriteDataToJsonFile(data, path + fileName)
}

func WriteDataToJsonFile(data interface{}, fileName string)  {
	encodedData, err := json.MarshalIndent(data, "", "    ")
	panicOnError(err)

	os.Remove(fileName)
	err = ioutil.WriteFile(fileName, encodedData, os.ModePerm)
	panicOnError(err)
}
func groupActivities(activities []NormalizedActivity) []NormalizedSection {
	sections := make(map[string]NormalizedSection, 1)

	//Create ActivityGroups

	for _, activity := range activities {
		activitySeparatorIndex := strings.Index(activity.Name, " ") //SOC3118 A00 - PossibleName, Separate SOC3118 and A00
		sectionCode := string(activity.Name[activitySeparatorIndex + 1])

		mSection := sections[sectionCode]
		mSection.SectionCode = sectionCode

		var activityTypeIndex int
		activityTypeIndex, mSection.ActivityGroups = findOrCreateIndexOfActivityType(mSection.ActivityGroups, activity.ActivityType)
		mSection.ActivityGroups[activityTypeIndex].Activities = append(mSection.ActivityGroups[activityTypeIndex].Activities, activity)
		sections[sectionCode] = mSection
	}

	//Convert back to slice
	normalizedSectionSlice := make([]NormalizedSection, 0, len(sections))

	for  _, value := range sections {
		normalizedSectionSlice = append(normalizedSectionSlice, value)
	}

	return normalizedSectionSlice
}
func findOrCreateIndexOfActivityType(group []ActivityGroup, activityType string) (int, []ActivityGroup) {
	for i, activityGroup := range group {
		if activityGroup.ActivityType == activityType {
			return i, group
		}
	}
	group = append(group, ActivityGroup{activityType, make([]NormalizedActivity, 0, 1)})
	return len(group) - 1, group
}

func normalizeActivities(sections []Section) []NormalizedActivity {
	days := map[string]int{"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
	normalizedActivities := make([]NormalizedActivity, 0, 1)

	str := `\(\D+\d{2} - \D+\d{2}\)`
	dateMatcher := regexp.MustCompile(str)
	for _, section := range sections {
		datesIndex := dateMatcher.FindStringIndex(section.Name)

		//section.Name Format is SOC3118 A00(September 06 - December 06)PossibleName
		name := section.Name[datesIndex[1]:]//Get Everything after the date
		fullName := section.Name[:datesIndex[0]] //SOC3118 A00 - PossibleName
		if name != "" {
			fullName += " - " + name
		}

		startEndDates := section.Name[datesIndex[0]+1:datesIndex[1]-1]

		timeParseLayout := "January 02"
		timeFormatLayout := "01-02" //Month-Day

		startDate, err1 := time.Parse(timeParseLayout, strings.Split(startEndDates, " - ")[0])
		panicOnError(err1)
		endDate, err2 := time.Parse(timeParseLayout, strings.Split(startEndDates, " - ")[1])
		panicOnError(err2)
		startDateString := startDate.Format(timeFormatLayout)
		endDateString := endDate.Format(timeFormatLayout)

		//section.Day Format is Wednesday 16:00 - 19:00
		dayEndIndex := strings.Index(section.Day, " ")
		dayString := section.Day[:dayEndIndex]

		startEndHours := section.Day[dayEndIndex+1:]
		startEndHours = strings.Replace(startEndHours, ":", "", 2)
		hoursIndex := strings.Index(startEndHours, " - ")
		startHour, _ := strconv.Atoi(startEndHours[:hoursIndex])
		endHour, _ := strconv.Atoi(startEndHours[hoursIndex+3:])
		professor := section.Professor
		if strings.Contains(professor, "Not available at") {
			professor = "N/a"
		}


		normalizedActivity := NormalizedActivity{fullName, section.Activity, startDateString, endDateString, days[dayString], startHour, endHour, section.Place, professor}
		normalizedActivities = append(normalizedActivities, normalizedActivity)
	}

	return normalizedActivities
}

func removeEmptyAndNoSectionCourses(courses []CourseInfo) []CourseInfo {
	nonEmptyCourses := make([]CourseInfo, 0, len(courses))

	for _, mCourse := range courses {
		if strings.TrimRight(mCourse.CourseCode, "\n") != "" && len(mCourse.Sections) > 0 {
			nonEmptyCourses = append(nonEmptyCourses, mCourse)
		}
	}

	return nonEmptyCourses
}

func removeInvalidSections(courses []CourseInfo) []CourseInfo {
	//Invalid = empty section or "Not available at this time."

	notAvailableRegex := regexp.MustCompile(`Not available at this time`)
	for i, mCourse := range courses {

		//Remove Empty Sections
		w := 0 //write index, taken from https://stackoverflow.com/questions/5020958/go-what-is-the-fastest-cleanest-way-to-remove-multiple-entries-from-a-slice
		for _, section := range mCourse.Sections {
			if strings.TrimSpace(section.Name) == "" || notAvailableRegex.MatchString(section.Day) || notAvailableRegex.MatchString(section.Name) {
				continue
			}
			mCourse.Sections[w] = section
			w++
		}
		mCourse.Sections = mCourse.Sections[:w]
		courses[i] = mCourse
	}

	return courses
}