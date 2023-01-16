import DSWImporter from '@ds-wizard/importer-sdk'


const PREFIX = 'http://purl.org/ripper#'
const FIELD_MAP = {
    'Test Name': 'testName',
    'Test Mode': 'testMode',
    'Test Type': 'testType',
    'Title1': 'title',
    'Comment1': 'comment',
    'Key Word': 'keyWord',
    'Product Name': 'productName',
    'Test File Name': 'testFileName',
    'Method File Name': 'methodFileName',
    'Report Date': 'reportDate',
    'Test Date': 'testDate',
    'Test Mode': 'testMode',
    'Test Type': 'testType',
    'Speed': 'speed',
    'Shape': 'shape',
    'No of Batches:': 'noOfBatches',
    'Qty/Batch:': 'qtyBatch',
    'Elastic': 'elastic',
    'YP(%FS)_Force': 'ypForce',
    'Max_Disp_Stroke': 'maxDispStroke',
    'Max_Disp_Strain': 'maxDispStrain',
    'Max_Force': 'maxForce',
    'Break_Force': 'breakForce',
    'Max_Stress': 'maxStress',
    'Break_Stress': 'breakStress',
    // 'Time': 'time',
    // 'Force': 'force',
    // 'Stroke': 'stroke',
}

const EXTRA_FIELDS = [
    'Elastic',
    'YP(%FS)_Force',
    'Max_Force',
    'Break_Force',
    'Max_Stress',
    'Break_Stress',
]

const UNIT_FIELDS = [
    'Max_Disp_Stroke',
    'Max_Disp_Strain',
]

const DATE_FIELDS = [
    'Report Date',
    'Test Date',
]


function fieldIRI(fieldName) {
    return `${PREFIX}${FIELD_MAP[fieldName]}`
}

function getQuestionUuid(importer, fieldName) {
    return importer.getQuestionUuidByAnnotation('rdfType', fieldIRI(fieldName))
}

function processDate(dateString) {
    const [day, month, year] = dateString.split('.')
    return `${year}-${month}-${day}`
}

function importFromFile(importer, content) {
    const chapterUuid = importer.getFirstChapterUuid()
    const testCaseUuid = importer.getQuestionUuidByAnnotation('rdfType', 'http://purl.org/ripper#TestCase')
    const itemUuid = importer.addItem([chapterUuid, testCaseUuid])
    const itemPath = [chapterUuid, testCaseUuid, itemUuid]

    content.split('\n').forEach((line) => {
        const parts = line.split(/\t+/)

        if (parts.length < 2 || parts[1].length === 0) return
        if (!FIELD_MAP[parts[0]]) return
        const fieldName = parts[0]
        let value = parts[1]

        if (EXTRA_FIELDS.indexOf(fieldName) !== -1) {
            if (parts.length < 4) return
            value = parts[2]
        } else if (UNIT_FIELDS.indexOf(fieldName) !== -1) {
            if (parts.length < 3) return
        } else if (DATE_FIELDS.indexOf(fieldName) !== -1) {
            value = processDate(value)
        }

        const path = [...itemPath, getQuestionUuid(importer, fieldName)]
        importer.setReply(path, value)
    })
}

function showError(message) {
    const errorDiv = document.getElementById('error')
    const errorAlert = document.getElementById('error-alert')
    errorAlert.textContent = message
    errorDiv.classList.toggle('hidden')
}

const importer = new DSWImporter()
importer
    .init()
    .then(() => {
        const fileSelector = document.getElementById('file-input')
        fileSelector.addEventListener('change', (event) => {
            const fileList = event.target.files

            if (fileList.length !== 1) {
                alert('File not selected...')
                return
            }

            const file = fileList[0]
            const reader = new FileReader()
            reader.addEventListener('load', (event) => {
                try {
                    importFromFile(importer, event.target.result)
                } catch (error) {
                    showError('Failed to parse maDMP in JSON.')
                    return
                }
                try {
                    importer.send()
                } catch (error) {
                    showError('Failed to send data back to the Wizard.')
                }
            })
            reader.readAsText(file)
        })
    })
    .catch(error => {
        console.error(error)
    })
