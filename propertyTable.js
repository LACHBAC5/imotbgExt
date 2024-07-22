
class PropertyTable {
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
        "atelie": "ателие",
        "dataPromqna": "Дата.Прм",
        "dataKorekciq": "Дата.Крк",
        "obemKorekciq": "Обем.Крк",
        "preglejdaniq": "преглеждания",
        "link": "линк",
        "TEC": "ТЕЦ",
        "GAZ": "Газ"
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
