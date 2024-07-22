
class PropertyParams {
    vid; mqsto; cena; plosht; cenaM2; etaj; broyEtaji; vidStroitelstvo; godinaStroitelstvo; atelie; dataPromqna; dataKorekciq; obemKorekciq; preglejdaniq; link; TEC; GAZ;
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
            this.params.dataPromqna = edit[0]+"-"+this.parseDateString(edit)
        }

        const korekciqButtonElement = propertyHTML.querySelector(".price > span > a")
        if(korekciqButtonElement != null) {
            const newKorekciqButtonElement = document.body.insertBefore(korekciqButtonElement, document.body.firstChild)
            newKorekciqButtonElement.style.display = 'none'
        
            const priceTable = document.body.insertBefore(propertyHTML.querySelector('#price_stats'), document.body.firstChild)
            priceTable.style.display = 'none'

            await clickAndWaitForDOMChange(korekciqButtonElement, priceTable, {childList: true})

            const korekcii = document.querySelectorAll(".newprice")
            if(korekcii != null && korekcii.length > 2) {
                const obem = Number(korekcii[1].innerText.split(" ")[0].replaceAll(" ", ""))
                const nachalnaCena = (valuta == "лв." ? Math.round(obem/1.95583) : obem)
                const margin = this.params.cena - nachalnaCena

                const datiKorekcii = document.querySelectorAll(".prices > .date")
                
                const dataPoslednaKorekciq = this.parseDateString(datiKorekcii[2].innerText)

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

    
        const dotsLessElement = propertyHTML.querySelector("#dots_less")
        if(dotsLessElement != null) {
            dotsLessElement.style = ""
        }
    
        const atelieElement = propertyHTML.querySelector("#description_div")
        if(atelieElement != null) {
            let atelieElementText = atelieElement.innerText
            if(atelieElementText.toLowerCase().search("ателие")!=-1) {
                this.params.atelie = "Да"
            }
            else {
                this.params.atelie = "Не"
            }
        }

        this.params.link = link
    }
}
