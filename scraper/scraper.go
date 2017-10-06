package main

import (
	"github.com/PuerkitoBio/goquery"
	"github.com/sclevine/agouti"
	"github.com/pkg/errors"
	"fmt"
)

var (
	baseURL = "https://web30.uottawa.ca/v3/SITS/timetable/"
	searchURL = baseURL + "Search.aspx"
)
const ( //Year + One Of These
	UOTTAWA_SUMMER = " Spring/Summer Term"
	UOTTAWA_FALL = " Fall Term"
	UOTTAWA_WINTER = " Winter Term"
)


type CourseInfo struct {
	CourseCode string
	Title string
	Url string
	Sections []Section
}
type Section struct {
	Name string
	Activity string
	Day string
	Place string
	Professor string
}

/*func main()  {
	url := "https://web30.uottawa.ca/v3/SITS/timetable/Course.aspx?id=020684&term=2179&session=A"

	channel := make(chan CourseInfo, 1)
	getCourseInfo("A", url, channel)

	course := <-channel
	println(course.Title)
}*/
func RunScraper(term string)  {
	var agoutiDriver *agouti.WebDriver = agouti.ChromeDriver()
	err := agoutiDriver.Start()
	panicOnError(err)
	defer agoutiDriver.Stop()


	page, err := agoutiDriver.NewPage(agouti.Browser("chrome"))
	panicOnError(err)

	defer page.Destroy()
	err = page.Navigate(searchURL)
	panicOnError(err)

	//Search Settings
	form := page.Find("#aspnetForm")
	err = page.Find("#aspnetForm").Find("#ctl00_MainContentPlaceHolder_Basic_TermDropDown").Select(term)
	panicOnError(err)
	form.Find("#ctl00_MainContentPlaceHolder_Basic_Button").Click()


	println("Running for term ", term)
	courses := make([]CourseInfo, 0, 2000)
	courseChannel := make(chan CourseInfo, 10)
	totalCourses := 0
	isLastPage := false
	pageNumber := 0
	for !isLastPage {
		pageNumber += 1

		courseLinksOnPage, _ := page.Find("#ctl00_MainContentPlaceHolder_SearchResultGridView").All("a").Elements()
		for _, element := range courseLinksOnPage {
			//DEBUG
			//if i > 0 { continue }
			
			courseUrl, _ := element.GetAttribute("href")
			courseCode, _ := element.GetText()

			go getCourseInfo(courseCode, courseUrl, courseChannel)
			totalCourses += 1
		}

		//Press Next Page Button
		err = page.FindByXPath("/html/body/form/div[3]/div[2]/div/div[3]/div[4]/span[2]/a").Click()

		println("Page ", pageNumber)
		isLastPage = err != nil
	}

	//Get all returned courses
	returnedCourses := 0
	for {
		course := <-courseChannel

		courses = append(courses, course)
		returnedCourses += 1

		if returnedCourses >= totalCourses {
			break
		}
	}

	WriteDataToJsonFileAndCreatePath(courses, "step_0_scraped_courses.json", getPathFromTerm(term))
}

func getPathFromTerm(term string) string {
	year := term[:4]
	semester := term[4:]
	semesterPath := ""
	switch semester {
	case UOTTAWA_FALL:
		semesterPath = "fall"
	case UOTTAWA_SUMMER:
		semesterPath = "summer"
	case UOTTAWA_WINTER:
		semesterPath = "winter"
	default:
		panicOnError(errors.New(fmt.Sprintf("Semester does not exist for %s", term)))
	}

	return outPath + year + "/" + semesterPath + "/"
}
func getCourseInfo(courseCode, url string, courseChan chan CourseInfo) {
	doc, _ := goquery.NewDocument(url)

	//reader, _ := os.Open("example_page.html")
	//doc, _ := goquery.NewDocumentFromReader(reader)
	title := doc.Find("#main-content").Find("h1").First().Text()
	var courseSections []Section

	doc.Find("#schedule").Find("tr").Not(".first-element").Each(
		func(i int, scheduleNode *goquery.Selection) {
			newSection := Section{}
			newSection.Name = scheduleNode.Find(".Section").Text()
			newSection.Activity = scheduleNode.Find(".Activity").Text()
			newSection.Day = scheduleNode.Find(".Day").Text()
			newSection.Place = scheduleNode.Find(".Place").Text()
			newSection.Professor = scheduleNode.Find(".Professor").Text()

			courseSections = append(courseSections, newSection)
		})

	courseChan <- CourseInfo{courseCode, title, url, courseSections}
}

func panicOnError(err error)  {
	if err != nil {
		panic(err)
	}
}