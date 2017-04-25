var LINE_DELIMETER = '\n';
var COLUMNS_DELIMETER = ',';
var UNKNOWN = 'unknown';
var KEYS = {
    ANIMAL_ID: 'AnimalID',
    NAME: 'Name',
    DATE_TIME: 'DateTime',
    OUTCOME_TYPE: 'OutcomeType',
    OUTCOME_SUBTYPE: 'OutcomeSubtype',
    ANIMAL_TYPE: 'AnimaType',
    SEX_UPON_OUTCOME: 'SexuponOutcome',
    AGE_UPON_OUTCOME: 'AgeuponOutcome',
    BREED: 'Breed',
    COLOR: 'Color'
};

var NEW_KEYS = {
    SEXO: 'sexo',
    CASTRADO: 'castrado',
    IDADE_CHEGADA: 'idade_chegada_dias',
    CLASSE_IDADE: 'classe_idade',
    HAS_NAME: 'has_name'
};

var SEX = {
    M: 'm',
    F: 'f',
    UNKNOWN: UNKNOWN
};

var CASTRADO = {
    TRUE: true,
    FALSE: false,
    UNKNOWN: UNKNOWN
};

var HAS_NAME = {
    TRUE: true,
    FALSE: false
};

function handleCsvFile(files) {
    // Check for the various File API support.
    if (window.FileReader) {
        // FileReader are supported.
        getAsText(files[0]);
    } else {
        alert('FileReader are not supported in this browser.');
    }
}

function getAsText(fileToRead) {
    var reader = new FileReader();
    // Read file into memory as UTF-8
    reader.readAsText(fileToRead);
    // Handle errors load
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
}

function getEntrySexInfo(entry) {
    var sexInfo = {};
    sexInfo[NEW_KEYS.SEXO] = SEX.UNKNOWN;
    sexInfo[NEW_KEYS.CASTRADO] = CASTRADO.UNKNOWN;
    entry[KEYS.SEX_UPON_OUTCOME] = entry[KEYS.SEX_UPON_OUTCOME].toLowerCase();

    if (entry[KEYS.SEX_UPON_OUTCOME] !== UNKNOWN) {
        var [castrado, sex] = entry[KEYS.SEX_UPON_OUTCOME].split(' ');
        if (sex === 'male') {
            sexInfo[NEW_KEYS.SEXO] = SEX.M;
        } else if (sex === 'female') {
            sexInfo[NEW_KEYS.SEXO] = SEX.F;
        }


        if (castrado === 'neutered' || castrado === 'spayed') {
            sexInfo[NEW_KEYS.CASTRADO] = CASTRADO.TRUE;
        }
        else if (castrado === 'intact') {
            sexInfo[NEW_KEYS.CASTRADO] = CASTRADO.FALSE;
        }
    }

    return sexInfo;
}
function turnIntoCsv(generatedData) {
    var keys = _.keys(_.sample(generatedData));
    var csv = keys.join(COLUMNS_DELIMETER);
    csv += LINE_DELIMETER;
    csv += _.chain(generatedData)
        .mapValues(function (entry) {
            var array = [];
            _.forEach(keys, function (key) {
                array.push(entry[key]);
            }, true);
            return array.join(COLUMNS_DELIMETER);
        })
        .values()
        .join(LINE_DELIMETER);

    return csv;

}

function getTimeMultiplyer(type) {
    switch (type) {
        case 'year':
        case 'years':
            return 365;
        case 'month':
        case 'months':
            return 30;
        case 'week':
        case 'weeks':
            return 7;
        default:
            return 1;
    }
}

function getClasseIdade(idade) {
    if (idade < 31)
        return 'até 1 mes';
    else if (idade < 181)
        return 'até 6 meses';
    else if (idade < 366)
        return 'até 1 ano';
    else if (idade < 731)
        return 'até 2 anos';
    else if (idade > 730)
        return 'maior que 2 anos';
    else
        return UNKNOWN;
}

function getEntryAgeInfo(entry) {
    var ageInfo = {};
    ageInfo[NEW_KEYS.IDADE_CHEGADA] = UNKNOWN;
    ageInfo[NEW_KEYS.CLASSE_IDADE] = UNKNOWN;

    if (entry[KEYS.AGE_UPON_OUTCOME] && entry[KEYS.AGE_UPON_OUTCOME] !== '0 years') {
        var [total, type] = entry[KEYS.AGE_UPON_OUTCOME].split(' ');
        ageInfo[NEW_KEYS.IDADE_CHEGADA] = total * getTimeMultiplyer(type);
        ageInfo[NEW_KEYS.CLASSE_IDADE] = getClasseIdade(ageInfo[NEW_KEYS.IDADE_CHEGADA]);
    }
    return ageInfo;
}

function getNameInfo(entry) {
    var nameInfo = {};
    nameInfo[NEW_KEYS.HAS_NAME] = entry[KEYS.NAME] ? HAS_NAME.TRUE : HAS_NAME.FALSE;
    return nameInfo;
}
function getPredictionClassDefaultInfo() {
    var predictionInfo = {};
    predictionInfo[KEYS.OUTCOME_TYPE] = UNKNOWN;
    return predictionInfo;
}

function loadHandler(event) {
    var csv = event.target.result;
    var csvInfo = getCsvInfo(csv);
    console.log(csvInfo.keys);
    var csvData = getFormatedData(csvInfo);
    var generatedData = _.chain(csvData)
        .cloneDeep()
        .map(function (entry) {
            _.defaults(entry, getPredictionClassDefaultInfo(entry));
            _.merge(entry, getEntrySexInfo(entry));
            _.merge(entry, getEntryAgeInfo(entry));
            _.merge(entry, getNameInfo(entry));
            // _.omit(entry, KEYS.SEX_UPON_OUTCOME);
            // _.omit(entry, KEYS.NAME);
            // _.omit(entry, KEYS.AGE_UPON_OUTCOME);
            // entry[KEYS.DATE_TIME] = new Date(entry[KEYS.DATE_TIME]);
            return entry;
        })
        .value();

    let newCsv = turnIntoCsv(generatedData);
    $('#putHere').textContent = newCsv;
    console.log(newCsv);
    // console.log(JSON.stringify(generatedData));
// console.log(csv);
}

function getCsvInfo(csvString) {
    var allLines = csvString.split(LINE_DELIMETER);
    return {
        keys: allLines[0].split(COLUMNS_DELIMETER),
        data: allLines.splice(1)
    };
}

function getFormatedData(csvInfo) {
    return _.chain(csvInfo.data)
        .map(function (dadoRow) {
            var splitedData = dadoRow.split(COLUMNS_DELIMETER);
            var object = {};
            for (var i = 0; i < splitedData.length; i++) {
                object[csvInfo.keys[i]] = splitedData[i];
            }
            return object;
        })
        .omit(function (entry) {
            return !entry[KEYS.ANIMAL_ID];
        })
        .keyBy(csvInfo.keys[0])
        .value();
}

function errorHandler(error) {
    alert(error);
}
