
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

function clickAndWaitForDOMChange(button, element, triggers) {
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            resolve()
        })
        observer.observe(element, triggers)
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
/*
let p = new Property
p.parsePropertyHTML(document).then(()=>{
    console.log(p)
})
*/

let buttonPlace = document.querySelector(".pageNumbersInfo")
if(buttonPlace != null) {
    let button = document.createElement("button")
    button.innerText = "ИЗТЕГЛИ ТАБЛИЦА"
    let clickedCounter = document.createElement("button")

    button.onclick = () => {
        clickedCounter.innerText = 0
        a = new searchDownloader(()=>{
            clickedCounter.innerText = Number(clickedCounter.innerText) + 1
        })

        a.downloadSearchData().then(()=>{
            clickedCounter.replaceWith(button)
        })
        button.replaceWith(clickedCounter)
    }

    buttonPlace.replaceWith(button)
}
