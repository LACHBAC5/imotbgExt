parser = new DOMParser();
async function scrapePageHTML(link) {
    return fetch (link).then(async response => {
        const contentType = response.headers.get("content-type");
        const charset = contentType.match(/charset=([^;]*)/i)?.[1] || 'windows-1251';
        const decoder = new TextDecoder(charset);

        const buffer = await response.arrayBuffer()
        return decoder.decode(buffer)
    }).then(async html => {
        return parser.parseFromString(html, "text/html")
    })
}

function clickAndWaitForDOMChange(button, element) {
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            resolve()
        })
        observer.observe(element, {childList: true})
        button.click()
    })
}

function downloadString(filename, string, dataType="text/plain;charset=UTF-8") {
    let blob = new Blob([string], {type : dataType})

    let a = document.createElement('a')
    a.href = window.URL.createObjectURL(blob)
    a.download = filename
    a.style.display = 'none'

    document.body.appendChild(a)
    a.click()

    delete a
}

class PropertyParams {
    vid; mqsto; cena; plosht; cenaM2; etaj; broyEtaji; vidStroitelstvo; godinaStroitelstvo; TEC; GAZ; dataKorekciq; obemKorekciq; preglejdaniq; link
}

class Property {
    params = new PropertyParams

    static dateParsingTable = {
        "януари": 1,
        "февруари": 2,
        "март": 3,
        "април": 4,
        "май": 5,
        "юни": 6,
        "юли": 7,
        "август": 8,
        "септември": 9,
        "октомври": 10,
        "ноември": 11,
        "декември": 12,
    }

    parseDateString(dateStr) {
        dateStr = dateStr.split(",")
        dateStr[0] = dateStr[0].split(" ")
        dateStr[1] = dateStr[1].split(" ")

        const day = dateStr[0][dateStr[0].length-2].padStart(2, "0")
        const month = Property.dateParsingTable[dateStr[0][dateStr[0].length-1].toLowerCase()].toString().padStart(2, "0")
        const year = dateStr[1][dateStr[1].length-2]

        const date = day + "." + month + "." + year

        return date
    }

    toolbarParams = {
        "Площ:": paramArr => {
            this.params.plosht = Number(paramArr[1])
        },
        "Етаж:": paramArr => {
            if(paramArr[1] != "Партер") {
                this.params.etaj = Number(paramArr[1].split("-")[0])
            }
            else {
                this.params.etaj = 1
            }
            this.params.broyEtaji = Number(paramArr[3])
        },
        "Строителство:": paramArr => {
            if(paramArr.length > 2) {
                paramArr[1] = paramArr[1].slice(0, -1)
                this.params.godinaStroitelstvo = Number(paramArr[2])
            }
            this.params.vidStroitelstvo = paramArr[1]
        },
        "ТEЦ:": paramArr => {
            this.params.TEC = paramArr[1]
        },
        "Газ:": paramArr => {
            this.GAZ = paramArr[1]
        }
    }

    async parsePropertyHTML(propertyHTML, link) {
        const vidElement = propertyHTML.querySelector("div.advHeader > div.title")
        if(vidElement != null) {
            const vid = vidElement.innerText.slice(vidElement.innerText.lastIndexOf(" ")+1);
            this.params.vid = vid;
        }

        const mqstoElement = propertyHTML.querySelector("div.advHeader > div.info > div.location")
        if(mqstoElement != null) {
            const mqsto = mqstoElement.innerText
            this.params.mqsto = mqsto
        }

        const cenaElement = propertyHTML.querySelector("#cena")
        let valuta
        if(cenaElement != null) {
            const cena = cenaElement.innerText;
            const lastSpace = cena.lastIndexOf(" ");
            const obem = Number(cena.slice(0, lastSpace).replaceAll(' ', ''))
            valuta = cena.slice(lastSpace+1)
            
            valuta == "лв." ? this.params.cena = Math.round(obem/1.95583) : this.params.cena = obem
        }

        propertyHTML.querySelectorAll("div.adParams > div").forEach(paramHTML => {
            var param = paramHTML.innerText.split(" ")
            const toolbarParam = this.toolbarParams[param[0]]
            if(toolbarParam != null) {
                toolbarParam(param)
            }
            else {
                console.log("ERR! Unrecognized ToolbarParam =", param[0])
            }
        })

        const editedElement = propertyHTML.querySelector(".adPrice > .info > div")
        if(editedElement != null) {
            const edit = editedElement.innerText
            this.params.dataKorekciq = edit[0]+"-"+this.parseDateString(edit)
        }

        const korekciqButtonElement = propertyHTML.querySelector(".price > span > a")
        if(korekciqButtonElement != null) {
            const newKorekciqButtonElement = document.body.insertBefore(korekciqButtonElement, document.body.firstChild)
            newKorekciqButtonElement.style.display = 'none'
        
            const priceTable = document.body.insertBefore(propertyHTML.querySelector('#price_stats'), document.body.firstChild)
            priceTable.style.display = 'none'

            await clickAndWaitForDOMChange(korekciqButtonElement, priceTable)

            const korekcii = document.querySelectorAll(".newprice")
            if(korekcii != null && korekcii.length > 2) {
                const obem = Number(korekcii[1].innerText.split(" ")[0].replaceAll(" ", ""))
                const nachalnaCena = (valuta == "лв." ? Math.round(obem/1.95583) : obem)
                const margin = this.params.cena - nachalnaCena

                const datiKorekcii = document.querySelectorAll(".prices > .date")
                
                const dataPoslednaKorekciq = "K-"+this.parseDateString(datiKorekcii[datiKorekcii.length-1].innerText)

                this.params.obemKorekciq = margin
                this.params.dataKorekciq = dataPoslednaKorekciq
            }
            
            priceTable.remove()
            newKorekciqButtonElement.remove()
        }

        if(this.params.cena != null && this.params.plosht != null) {
            this.params.cenaM2 = Math.round(this.params.cena / this.params.plosht)
        }

        const preglejdaniqElement = propertyHTML.querySelector("div.info > span")
        if(preglejdaniqElement != null) {
            const preglejdaniq = preglejdaniqElement.innerText
            this.params.preglejdaniq = preglejdaniq;
        }

        this.params.link = link
    }
}

class PropertyTable {
    xlsxWebTable

    static NamingDictionary = {
        "vid": "Вид",
        "mqsto": "Място",
        "cena": "Цена",
        "plosht": "Площ",
        "cenaM2": "Цена/м2",
        "etaj": "Етаж",
        "broyEtaji": "Бр.Етажи",
        "vidStroitelstvo": "Вид Строителство",
        "godinaStroitelstvo": "год.Стой",
        "TEC": "ТЕЦ",
        "GAZ": "Газ",
        "dataKorekciq": "Дата.Крк",
        "obemKorekciq": "Обем.Крк",
        "preglejdaniq": "преглеждания",
        "link": "линк"
    }
    
    constructor () {
        this.xlsxWebTable = document.createElement('table')
        var tableRow = this.xlsxWebTable.insertRow()
        for(let param in new PropertyParams) {
            //console.log(param)
            tableRow.insertCell().appendChild(document.createTextNode(PropertyTable.NamingDictionary[param]))
        }
    }

    appendProperty(property) {
        var tableRow = this.xlsxWebTable.insertRow()
        for(let param in property.params) {
            if(property.params[param] == undefined) {
                tableRow.insertCell().appendChild(document.createTextNode(""))
                continue
            }
            //console.log(param, property.params[param])
            tableRow.insertCell().appendChild(document.createTextNode(property.params[param]))
        }
    }
}

class propertySearchDownloader extends PropertyTable {
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

let buttonPlace = document.querySelector(".pageNumbersInfo")
if(buttonPlace != null) {
    let button = document.createElement("button")
    button.innerText = "ИЗТЕГЛИ ТАБЛИЦА"
    let clickedCounter = document.createElement("button")

    button.onclick = () => {
        clickedCounter.innerText = 0
        a = new propertySearchDownloader(()=>{
            clickedCounter.innerText = Number(clickedCounter.innerText) + 1
        })

        a.downloadSearchData().then(()=>{
            clickedCounter.replaceWith(button)
        })
        button.replaceWith(clickedCounter)
    }

    buttonPlace.replaceWith(button)
}

