/*
Copyright 2020 Kyle Kukshtel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const currentDateStart = () => new Date().setHours(0, 0, 0, 0);

export const defaultColumnWidth = 150;

export let defaults = {
    "sheet" : {
        "name" : "newSheet",
        "description" : "description of what the sheet is",
        "displayColumn" : "id",
        "guid" : "",
        "columns": [],
        "lines": [],
        "hidden":false,
        "isProps":false,
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "displayColumn" : "columnSelect@name",
            "columnSelect@name@displayColumn" : {
                "allowedTypes" : ["int","float","text","longtext","date"]
            }
        }
    },
    "int" : {
        "typeStr": "int",
        "guid" : "",
        "description" : "int field",
        "name": "newInt",
        "min" : -10000,
        "max" : 100000,
        "defaultValue" : 0,
        "width" : defaultColumnWidth,
        "iconName" : "newInt",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "min" : "int",
            "max" : "int",
            "defaultValue" : "int",
            "width" : "int"
        }
    },
    "float" : {
        "typeStr": "float",
        "guid" : "",
        "description" : "float field",
        "name": "newFloat",
        "min" : -10000,
        "max" : 100000,
        "defaultValue" : 0,
        "width" : defaultColumnWidth,
        "iconName" : "newFloat",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "min" : "float",
            "max" : "float",
            "defaultValue" : "float",
            "width" : "int"
        }
    },
    "date" : {
        "typeStr": "date",
        "guid" : "",
        "description" : "date field",
        "name": "newDate",
        "defaultValue" : currentDateStart(),
        "defaultToCurrentDate" : true,
        "width" : defaultColumnWidth,
        "iconName" : "newDate",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "date",
            "defaultToCurrentDate" : "bool",
            "width" : "int"
        }
    },
    "bool" : {
        "typeStr": "bool",
        "guid" : "",
        "description" : "bool field",
        "name": "newBool",
        "defaultValue" : true,
        "width" : defaultColumnWidth,
        "iconName" : "newBool",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "bool",
            "width" : "int"
        }
    },
    "text" : {
        "typeStr": "text",
        "guid" : "",
        "name": "newText",
        "description" : "text field",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newText",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "text",
            "width" : "int"
        }
    },
    "longtext" : {
        "typeStr": "longtext",
        "guid" : "",
        "name": "newLongText",
        "description" : "long text field",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newLongText",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "longtext",
            "width" : "int"
        }
    },
    "image" : {
        "typeStr": "image",
        "guid" : "",
        "name": "newImage",
        "description" : "new image field",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newImage",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "text",
            "width" : "int"
        }
    },
    "file" : {
        "typeStr": "file",
        "guid" : "",
        "name": "newFile",
        "description" : "new file field",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newFile",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "text",
            "width" : "int"
        }
    },
    "enum" : {
        "typeStr": "enum",
        "guid" : "",
        "name": "newEnum",
        "description" : "new enum field",
        "options" : "",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newEnum",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "text",
            "options" : "text",
            "width" : "int"
        }
    },
    "multiple" : {
        "typeStr": "multiple",
        "guid" : "",
        "name": "newMultiple",
        "description" : "new multiple field",
        "options" : "",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newMulti",
        "displayType" : "vertical",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "text",
            "options" : "text",
            "displayType" : "enum",
            "enum@displayType" : {
                "options" : ["vertical","horizontal"]
            }
            ,
            "width" : "int"
        }
    },
    "sheetReference" : {
        "typeStr": "sheetReference",
        "guid" : "",
        "name": "newSheetReference",
        "description" : "new sheet reference field",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newSheetLink",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "defaultValue" : "sheetSelect",
            "sheetSelect@defaultValue" : {
                "allowEmpty" : true
            },
            "width" : "int"
        }
    },
    "lineReference" : {
        "typeStr": "lineReference",
        "guid" : "",
        "name": "newLineReference",
        "description" : "new line reference field",
        "sheet" : "",
        "defaultValue" : "",
        "width" : defaultColumnWidth,
        "iconName" : "newLineLink",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "sheet" : "sheetSelect",
            "defaultValue" : "lineSelect@sheet",
            "width" : "int"
        }
    },
    "list" : {
        "typeStr":"list",
        "guid":"",
        "name":"new list",
        "description":"new list field", 
        "sheet":"",
        "defaultValue":[],
        "width" : defaultColumnWidth,
        "iconName" : "newList",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "width" : "int",
        }
    },
    "props" : {
        "typeStr":"props",
        "guid":"",
        "name":"new properties",
        "description":"new properties field",
        "sheet":"",
        "defaultValue":{},
        "width" : defaultColumnWidth,
        "iconName" : "newProps",
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "width" : "int",
        }
    },
    "grid" : {
        "typeStr":"grid",
        "guid":"",
        "name":"new grid",
        "description":"new grid field",
        "defaultValue":[true,true,true,true],
        "schema":[],
        "width" : defaultColumnWidth,
        "iconName" : "newGrid",
        "length" : 4,
        "displayWidth" : 2,
        "columnWidth" : 50,
        "columnHeight" : 50,
        "configurable" : {
            "name" : "text",
            "description" : "text",
            "schema" : "grid",
            "grid@schema" : {
                "allowedTypes" : ["int","bool","float","text","longtext","date","lineReference","sheetReference","multiple","enum"]
            },
            "width" : "int"
        }
    },
};

export function getDefaultColumnValue(column) {
    if (!column) {
        return "";
    }
    if (column.typeStr === "multiple") {
        return typeof column.defaultValue === "string" ? column.defaultValue.split(", ") : [];
    }
    if (column.typeStr === "date") {
        const baseValue = column.defaultToCurrentDate ? currentDateStart() : Number(column.defaultValue);
        return Number.isFinite(baseValue) ? baseValue : "";
    }
    if (Array.isArray(column.defaultValue)) {
        return column.defaultValue.map((item) =>
            typeof item === "object" && item !== null ? JSON.parse(JSON.stringify(item)) : item
        );
    }
    if (column.defaultValue && typeof column.defaultValue === "object") {
        return JSON.parse(JSON.stringify(column.defaultValue));
    }
    return column.defaultValue;
}

//every new column needs a name, guid, typeStr, and defaultValue field
//the @ for columnSelect and lineSelect indicates the field in their type that has the sheet to look up a column or line in
//[column/lineSelect]@[name of field that holds the sheetname/]
//typeStr directly maps to svelte fieldtypes
//the value in the configurable section also maps to svelte field types
