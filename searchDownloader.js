
class searchDownloader extends PropertyTable {
    onPageParsed
    constructor (onPageParsedCallback) {
        super()
        this.onPageParsed = onPageParsedCallback
    }

    async parseSearchPage(searchPageHTML) {
        const propertyLinks = searchPageHTML.querySelectorAll("a.lnk2")
        for (const link of propertyLinks) {
            const propertyPage = await scrapePageHTML(link)
            
            const property = new Property
            await property.parsePropertyHTML(propertyPage, link.href)
            this.appendProperty(property)

            this.onPageParsed()
            //break
        }
    }
    
    async downloadSearchData() {
        await this.parseSearchPage(document)
        
        const pageButtons = document.querySelector("span.pageNumbersDisable").parentElement.querySelectorAll("a.pageNumbers")
        for(const button of pageButtons) {
            const page = await scrapePageHTML(button.href)
            await this.parseSearchPage(page)
        }
        
        downloadString("searchTable.html", a.xlsxWebTable.outerHTML)
    }
}
