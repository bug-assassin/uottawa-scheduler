package main

func main()  {
	terms := []string{"2017" + UOTTAWA_FALL, "2018" + UOTTAWA_WINTER}

	RunScraper(terms[1])
	RunNormalizer(terms[1])
}
