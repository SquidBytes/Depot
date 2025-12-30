<!--
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
-->

<script>
import { getContext } from 'svelte';
import TextField from "../Fields/TextField.svelte";
import BooleanField from '../Fields/BooleanField.svelte';
import EnumField from '../Fields/EnumField.svelte';
import ImageField from '../Fields/ImageField.svelte';
import LongTextField from '../Fields/LongTextField.svelte';
import MultipleField from '../Fields/MultipleField.svelte';
import NumberField from '../Fields/NumberField.svelte';
import IntegerNumberField from '../Fields/IntegerNumberField.svelte';
import DateField from '../Fields/DateField.svelte';
import FileField from '../Fields/FileField.svelte';
import {defaults, defaultColumnWidth, getDefaultColumnValue} from './depotDefaults';
import { v4 as uuidv4 } from 'uuid';

import { createEventDispatcher } from 'svelte';
import GridFieldTableEditor from '../Fields/GridFieldTableEditor.svelte';
export let fullData;
export let sheetData;
export let inputLineData; //this will be an array if this sheet isn't props, or an object if it is props
//from DepotOptions.svelte
export let debug;
export let showLineGUIDs;
export let previewDisclosedFields;
export let showNestedNames;
export let showNestedPaths;
export let allowSchemaEditing;
export let allowAddRemoveItems;



export let depotInfo;
export let originLineGUID = "";
export let listVisibility = {};
const dispatch = createEventDispatcher();
let iconPaths = getContext("iconPaths");

export let lastHovered;
export let parentGUID = "";
export let baseDataPath = "";
let draggingIndex = null;
let dragOverIndex = null;
let resizingColumnGUID = null;
let resizeStartX = 0;
let resizeStartWidth = defaultColumnWidth;
const SPECIAL_COLUMNS = {
    controls: "__controls",
    guid: "__guid",
    id: "id"
};

function getColumnWidth(columnOrKey) {
    if (typeof columnOrKey === "string") {
        const fallback =
            columnOrKey === SPECIAL_COLUMNS.controls
                ? 90
                : columnOrKey === SPECIAL_COLUMNS.guid
                ? 260
                : columnOrKey === SPECIAL_COLUMNS.id
                ? 120
                : defaultColumnWidth;
        const width =
            sheetData &&
            sheetData.columnWidths &&
            Number(sheetData.columnWidths[columnOrKey]);
        return Number.isFinite(width) && width > 20 ? width : fallback;
    }
    const width = columnOrKey && Number(columnOrKey.width);
    return Number.isFinite(width) && width > 20 ? width : defaultColumnWidth;
}

function startDrag(index) {
    draggingIndex = index;
}

function handleDragOver(index, event) {
    if (draggingIndex === null || !Array.isArray(inputLineData)) {
        return;
    }
    event.preventDefault();
    dragOverIndex = index;
}

function dropOn(index) {
    if (draggingIndex === null || !Array.isArray(inputLineData)) {
        resetDrag();
        return;
    }
    moveLine(draggingIndex, index);
    resetDrag();
}

function moveLine(fromIndex, toIndex) {
    if (fromIndex === toIndex) {
        return;
    }
    if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= inputLineData.length ||
        toIndex >= inputLineData.length
    ) {
        return;
    }
    const updatedLines = [...inputLineData];
    const [movedLine] = updatedLines.splice(fromIndex, 1);
    updatedLines.splice(toIndex, 0, movedLine);
    inputLineData = updatedLines;
}

function resetDrag() {
    draggingIndex = null;
    dragOverIndex = null;
}

function startColumnResize(column, event) {
    resizingColumnGUID = column.guid;
    resizeStartX = event.clientX;
    resizeStartWidth = getColumnWidth(column);
    event.preventDefault();
    event.stopPropagation();
}

function handleMouseMove(event) {
    if (!resizingColumnGUID) {
        return;
    }
    const delta = event.clientX - resizeStartX;
    const newWidth = Math.max(60, resizeStartWidth + delta);
    applyColumnWidth(resizingColumnGUID, newWidth);
}

function endColumnResize() {
    resizingColumnGUID = null;
}

function applyColumnWidth(columnGUID, width) {
    const sheetIndex = fullData.sheets.findIndex((s) => s.guid === sheetData.guid);
    if (sheetIndex < 0) {
        return;
    }
    // special pseudo columns (controls/id/guid) get stored on sheet metadata
    const specialKeys = Object.values(SPECIAL_COLUMNS);
    if (specialKeys.includes(columnGUID)) {
        const colWidths = {
            ...(fullData.sheets[sheetIndex].columnWidths || {}),
            [columnGUID]: width
        };
        fullData.sheets[sheetIndex] = {
            ...fullData.sheets[sheetIndex],
            columnWidths: colWidths
        };
    } else {
        const updatedColumns = fullData.sheets[sheetIndex].columns.map((col) =>
            col.guid === columnGUID ? { ...col, width } : col
        );
        fullData.sheets[sheetIndex] = { ...fullData.sheets[sheetIndex], columns: updatedColumns };
    }
    // trigger bindings
    fullData = { ...fullData, sheets: [...fullData.sheets] };
    sheetData = fullData.sheets[sheetIndex];
}

function enterSheet() {
    dispatch('message', {
        "type" : "hoverUpdate",
        "data" : {
            "action" : "enter",
            "sheetGUID" : sheetData.guid,
            "parentGUID" : parentGUID,
        }
    });
}

function leaveSheet() {
    if(lastHovered == sheetData.guid) {
        lastHovered = "";
    }
    dispatch('message', {
        "type" : "hoverUpdate",
        "data" : {
            "action" : "exit",
            "sheetGUID" : sheetData.guid,
            "parentGUID" : parentGUID
        }
    });
}

function editColumn(column) {
    dispatch('message', {
        "type" : "editorUpdate",
        "data" : {
            "active" : true,
            "operation" : "edit",
            "editType" : column,
            "sheetGUID" : sheetData.guid
        }
    });
}

function removeLine(lineIndex, line, originGUID) {
    dispatch('message', {
        "type" : "lineEdit",
        "data" : {
            "operation" : "remove",
            "lineIndex" : lineIndex,
            "line" : line,
            "originLineGUID" : originGUID,
            "sheetGUID" : sheetData.guid
        }
    });
}

function copyLine(lineIndex, line, originGUID) {
    dispatch('message', {
        "type" : "lineEdit",
        "data" : {
            "operation" : "copy",
            "lineIndex" : lineIndex,
            "line" : line,
            "originLineGUID" : originGUID,
            "sheetGUID" : sheetData.guid
        }
    });
}

function addLines(amount,originGUID) {
    dispatch('message', {
        "type" : "lineEdit",
        "data" : {
            "operation" : "add",
            "amount" : amount,
            "originLineGUID" : originGUID,
            "sheetGUID" : sheetData.guid
        }
    });
}

function createColumn(columnType) {
    dispatch('message', {
        "type" : "editorUpdate",
        "data" :{
                "active" : true,
                "operation" : "new",
                "editType" : columnType,
                "sheetGUID" : sheetData.guid
                }
    });
}

function handleSubTableEvent(event) {
    // console.log("handing subtable event");
    // console.log(event);
    // console.log(originLineGUID)
    switch (event.detail.type) {
        case "lineEdit":
            let nestedSheetGUID = event.detail.data.sheetGUID;
            let nestedSheetIndex = fullData.sheets.findIndex(sheet => sheet.guid === nestedSheetGUID);
            var refLineColumn = listVisibility[event.detail.data.originLineGUID];
            switch (event.detail.data.operation) {
                case "add":
                    // console.log("adding nested line from",nestedSheetGUID,"with index",nestedSheetIndex,"from line",originLineGUID,"with index",refLineIndex,"at column",refLineColumn.name,"with guid",refLineColumn.guid)
                    for (let index = 1; index <= event.detail.data.amount; index++) {
                        var newLine = {};
                        newLine["guid"] = uuidv4();
                        fullData.sheets[nestedSheetIndex].columns.forEach(column => {
                            newLine[column.name] = getDefaultColumnValue(column);
                        });
                        //if the sheet we clicked add on isn't a props sheet
                        if(!fullData.sheets[nestedSheetIndex].isProps) {
                            
                            if(!sheetData.isProps)  //the target linedata is an array and our inputdata is an array
                            {
                                //this is the line in the parent sheet that caught the event from the subsheet
                                let refLineIndex = inputLineData.findIndex(line => line.guid === event.detail.data.originLineGUID);
                                newLine["id"] = inputLineData[refLineIndex][refLineColumn.name].length + "";
                                inputLineData[refLineIndex][refLineColumn.name] = [...inputLineData[refLineIndex][refLineColumn.name], newLine];
                            }
                            else                    //the target linedata is an array and our inputdata is an object
                            {
                                newLine["id"] = inputLineData[refLineColumn.name].length + "";
                                inputLineData[refLineColumn.name] = [...inputLineData[refLineColumn.name], newLine];
                            }
                        //the sheet we clicked add on IS a props sheet
                        } else {
                            if(!sheetData.isProps)  //the target linedata is an object and our inputdata is an array
                            {
                                let refLineIndex = inputLineData.findIndex(line => line.guid === event.detail.data.originLineGUID);
                                inputLineData[refLineIndex][refLineColumn.name] = newLine;
                            }
                            else                        //the target linedata is an object and our inputdata is an object
                            {
                                inputLineData[refLineColumn.name] = newLine;
                            }
                        }
                    }
                    break;
                case "remove":
                    //if the sheet we're removing on isn't a props sheet
                    if(!fullData.sheets[nestedSheetIndex].isProps) {
                        if(!sheetData.isProps)
                        {
                            let refLineIndex = inputLineData.findIndex(line => line.guid === event.detail.data.originLineGUID);
                            var rmArray = inputLineData[refLineIndex][refLineColumn.name];
                            var rmIndex = event.detail.data.lineIndex;
                            inputLineData[refLineIndex][refLineColumn.name] = [...rmArray.slice(0,rmIndex),...rmArray.slice(rmIndex+1)];
    
                            //delete this from visibility
                            //TODO: if the line has nested lists as well that are visbile, this needs to delete those lines as well from visbility
                            //this doesn't happen right now so creates some garbage in listVisibility
                            if(inputLineData[refLineIndex].guid in listVisibility)
                            {
                                delete listVisibility[refLineIndex];
                            }
                        }
                        else
                        {
                            var rmArray = inputLineData[refLineColumn.name];
                            var rmIndex = event.detail.data.lineIndex;
                            inputLineData[refLineColumn.name] = [...rmArray.slice(0,rmIndex),...rmArray.slice(rmIndex+1)];
    
                            //delete this from visibility
                            //TODO: if the line has nested lists as well that are visbile, this needs to delete those lines as well from visbility
                            //this doesn't happen right now so creates some garbage in listVisibility
                            if(inputLineData.guid in listVisibility)
                            {
                                delete listVisibility[listVisibility.findIndex(l => l.guid === inputLineData.guid)];
                            }
                        }
                    } else {
                        if(!sheetData.isProps) {
                            //note this doesnt remove the props config, just this entry in this line
                            let refLineIndex = inputLineData.findIndex(line => line.guid === event.detail.data.originLineGUID);
                            
                            //delete this from visibility
                            //TODO: if the line has nested lists as well that are visbile, this needs to delete those lines as well from visbility
                            //this doesn't happen right now so creates some garbage in listVisibility
                            if(inputLineData[refLineIndex][refLineColumn.name].guid in listVisibility)
                            {
                                let delIndex = listVisibility.findIndex(l => l.guid === inputLineData[refLineIndex][refLineColumn.name].guid);
                                delete listVisibility[delIndex];
                            }

                            inputLineData[refLineIndex][refLineColumn.name] = {};

                        }
                        else {
                            //delete this from visibility
                            //TODO: if the line has nested lists as well that are visbile, this needs to delete those lines as well from visbility
                            //this doesn't happen right now so creates some garbage in listVisibility
                            if(inputLineData.guid in listVisibility)
                            {
                                let delIndex = listVisibility.findIndex(l => l.guid === inputLineData.guid);
                                delete listVisibility[delIndex];
                            }

                            //note this doesnt remove the props config, just this entry in this line
                            inputLineData[refLineColumn.name] = {};
                        }
                    }
                    //nested sheet lines cannot be referened so we can just delete this from the list
                    break;
                case "copy":
                    //inputLineData will only be an array here because copy functionality is not exposed on props "lines"
                    var newLine = JSON.parse(JSON.stringify(event.detail.data.line));
                    let baseID = newLine.id.split("_copy_")[0];
                    function reassignGUIDS(line)
                    {
                        Object.keys(line).forEach((key) => {
                            if(key === "guid")
                            {
                                line[key] = uuidv4();
                            }
                            else if(Array.isArray(line[key]))
                            {
                                line[key].forEach((lineItem) => {
                                    reassignGUIDS(lineItem);
                                });
                            }
                            else if(typeof line[key] === 'object')
                            {
                                reassignGUIDS(line[key]);
                            }
                        });
                    }
                    reassignGUIDS(newLine);
                    //cant copy props lines (by design), so following function all use spread for arrays
                    if(!sheetData.isProps)
                    {
                        let refLineIndex = inputLineData.findIndex(line => line.guid === event.detail.data.originLineGUID);
                        let currentCopies =  inputLineData[refLineIndex][refLineColumn.name].filter(x => x.id.includes(baseID + "_copy_")).length;
                        newLine["id"] = newLine.id + "_copy_" + currentCopies;
                        inputLineData[refLineIndex][refLineColumn.name] = [...inputLineData[refLineIndex][refLineColumn.name], newLine];
                    }
                    else
                    {
                        let currentCopies =  inputLineData[refLineColumn.name].filter(x => x.id.includes(baseID + "_copy_")).length;
                        newLine["id"] = newLine.id + "_copy_" + currentCopies;
                        inputLineData[refLineColumn.name] = [...inputLineData[refLineColumn.name], newLine];
                    }
                    break;
                default:
                    break;
            }
            break;
        case "hoverUpdate":
            let actionSheet = event.detail.data.sheetGUID;
            switch (event.detail.data.action) {
                case "enter":
                    lastHovered = actionSheet;
                    break;
                case "exit":
                    if(event.detail.data.parentGUID === sheetData.guid) {
                        lastHovered = sheetData.guid;
                    }
                    break;
            }
            dispatch('message',event.detail);
            break;
        default:
            //forward messages otherwise from nested table
            dispatch('message',event.detail);
            break;
    }
}

let totalColumns = 0;
$: {
    // console.log(sheetData);
    if(showLineGUIDs)
    {
        totalColumns = sheetData.columns.length + 3;
    }
    else
    {
        totalColumns = sheetData.columns.length + 2; 
    }
} 


function setListVisible(line,column,visible) {
    if(visible) {
        listVisibility[line.guid] = column;
    }
    else {
        delete listVisibility[line.guid];
    }
    //https://svelte.dev/tutorial/updating-arrays-and-objects
    listVisibility = listVisibility;
}

function validateID(event,line) {
    switch (event.detail.type) {
        case "validate":
            if(!sheetData.isProps)
            {
                inputLineData.forEach(ld => {
                    if(line.guid !== ld.guid && line.id === ld.id)
                    {
                       let index = inputLineData.findIndex(l => l.guid === line.guid);
                       inputLineData[index].id = "DUPLICATE("+line.id+")";
                    }
                });
            }
            break;
        default:
            //forward messages otherwise from nested table
            dispatch('message',event.detail);
            break;
    }
}

</script>
<svelte:window on:mousemove={handleMouseMove} on:mouseup={endColumnResize}/>
<table on:mouseenter={enterSheet} on:mouseleave={leaveSheet}>
<!-- This checks if this is a nested sheet, in which case we want to have the UI visible -->
{#if sheetData.hidden}
    {#if (lastHovered == sheetData.guid) && allowSchemaEditing}
    <tr>
        <td colspan="{totalColumns}">
            {#each Object.keys(defaults) as columnType}
                {#if columnType !== "sheet"}
                <button class="buttonIcon padded" title="Create new {columnType} column" on:click={() => createColumn(columnType)}>
                    <img src={iconPaths[defaults[columnType].iconName].path} alt="Create new {columnType} column">
                </button>
                {/if}
            {/each}
        </td>
    </tr>
    {/if}
    {#if showNestedNames || showNestedPaths}
    <tr>
        <td colspan="{totalColumns}">
            {#if showNestedNames}<b>{sheetData.name}</b>{/if} {#if showNestedPaths} @ {baseDataPath}{/if}
        </td>
    </tr>
    {/if}
{/if}
<tr>
    <th style={`width:${getColumnWidth(SPECIAL_COLUMNS.controls)}px; min-width:50px;`}>
        <div class="columnHeader">
            <span>Actions</span>
            <span class="resizeHandle" title="Drag to resize column" on:mousedown={(event) => startColumnResize({ guid: SPECIAL_COLUMNS.controls }, event)}></span>
        </div>
    </th>
    {#if showLineGUIDs}
    <th style={`width:${getColumnWidth(SPECIAL_COLUMNS.guid)}px; min-width:120px;`}>
        <div class="columnHeader">
            <span>GUID</span>
            <span class="resizeHandle" title="Drag to resize column" on:mousedown={(event) => startColumnResize({ guid: SPECIAL_COLUMNS.guid }, event)}></span>
        </div>
    </th>
    {/if}
    {#if !sheetData.isProps}
    <th style={`width:${getColumnWidth(SPECIAL_COLUMNS.id)}px; min-width:80px;`}>
        <div class="columnHeader">
            <span>ID</span>
            <span class="resizeHandle" title="Drag to resize column" on:mousedown={(event) => startColumnResize({ guid: SPECIAL_COLUMNS.id }, event)}></span>
        </div>
    </th>
    {/if}
{#each sheetData.columns as column}
    <th title="{column.description}" style={`width:${getColumnWidth(column)}px; min-width:60px;`}>
        <div class="columnHeader">
            {#if allowSchemaEditing}<a href={"#"} on:click={()=> editColumn(column.name)}>{column.name}</a>{:else}{column.name}{/if}
            <span class="resizeHandle" title="Drag to resize column" on:mousedown={(event) => startColumnResize(column, event)}></span>
        </div>
    </th>
{/each}
</tr>
{#if !sheetData.isProps}
    <!-- SHEET DRAWING FOR LIST/NORMAL SHEET -->
    {#each inputLineData as line, i}
    <!-- this prevents us from preemptively drawing empty an empty props entry -->
    {#if Object.keys(line).length !== 0}
        <tr class:dragTarget={dragOverIndex === i} class:dragging={draggingIndex === i} on:dragover|preventDefault={(event) => handleDragOver(i,event)} on:drop|preventDefault={() => dropOn(i)} on:dragleave={() => dragOverIndex = null}>
            <td class="lineActions" style={`width:${getColumnWidth(SPECIAL_COLUMNS.controls)}px; min-width:50px;`}>
                {#if Array.isArray(inputLineData) && inputLineData.length > 1}
                    <span class="dragHandle" title="Drag to move line" draggable="true" on:dragstart={() => startDrag(i)} on:dragend={resetDrag}>::</span>
                {/if}
                {#if allowAddRemoveItems}
                    <button class="buttonIcon" title="Remove Line" on:click={() => removeLine(i,line,originLineGUID)}>
                        <img style="max-width:17px" src={iconPaths["removeLine"].path} alt="Remove Line">
                    </button>
                {/if}
                <button class="buttonIcon" title="Copy Line" on:click={() => copyLine(i,line,originLineGUID)}>
                    <img style="max-width:17px" src={iconPaths["copyLine"].path} alt="Copy Line">
                </button>
            </td>
            {#if showLineGUIDs}
            <td style={`width:${getColumnWidth(SPECIAL_COLUMNS.guid)}px; min-width:120px;`}>{line.guid}</td>
            {/if}
            <td style={`width:${getColumnWidth(SPECIAL_COLUMNS.id)}px; min-width:80px;`}><TextField sheetGUID={sheetData.guid} bind:data={line["id"]} on:message={(event) => validateID(event,line)}/></td>
            {#each sheetData.columns as column, c}
                <td title="{column.description}" style={`width:${getColumnWidth(column)}px; min-width:60px;`}>
                <div>
                <!-- message from field updates bubble to Depot.svelte -->
                {#if column.typeStr === "text"}
                <TextField sheetGUID={sheetData.guid} bind:data={line[column.name]} on:message/>
                {:else if column.typeStr === "longtext"}
                <LongTextField bind:data={line[column.name]}/>
                {:else if column.typeStr === "image"}
                <ImageField sheetGUID={sheetData.guid} bind:data={line[column.name]} on:message fileKey={{"line":line,"lineIndex":i,"column":column,"columnIndex":c}}/>
                {:else if column.typeStr === "file"}
                <FileField sheetGUID={sheetData.guid} bind:data={line[column.name]} on:message fileKey={{"line":line,"lineIndex":i,"column":column,"columnIndex":c}}/>
                {:else if column.typeStr === "bool"}
                <BooleanField bind:data={line[column.name]}/>
                {:else if column.typeStr === "enum"}
                <EnumField bind:data={line[column.name]} options={sheetData.columns.find(x => x.name === column.name).options.split(', ')}/>
                {:else if column.typeStr === "sheetReference"}
                <EnumField bind:data={line[column.name]} options={depotInfo.sheetsFiltered.guids} aliases={depotInfo.sheetsFiltered.names}/>
                {:else if column.typeStr === "lineReference"}
                    {#if column.sheet !== ""}
                    <EnumField  bind:data={line[column.name]} 
                                options={depotInfo.lines[column.sheet].guids} 
                                aliases={depotInfo.lines[column.sheet].names}/>
                    {:else}
                    <EnumField  bind:data={line[column.name]} 
                                options={[]} 
                                aliases={[]}/>
                    {/if}
                    {#if line[column.name] !== "" && !depotInfo.lines[column.sheet].guids.includes(line[column.name])}
                        <div title="Selected value with GUID {line[column.name]} not in selected sheet. Select proper sheet in column settings">ERROR</div>
                    {/if}
                {:else if column.typeStr === "multiple"}
                <MultipleField bind:data={line[column.name]} options={sheetData.columns.find(x => x.name === column.name).options.split(', ')} displayType={"displayType" in column ? column.displayType : "vertical"}/>
                {:else if column.typeStr === "int"}
                <IntegerNumberField bind:data={line[column.name]} min={column.min} max={column.max}/>
                {:else if column.typeStr === "float"}
                <NumberField bind:data={line[column.name]} min={column.min} max={column.max}/>
                {:else if column.typeStr === "date"}
                <DateField bind:data={line[column.name]}/>
                {:else if column.typeStr === "list" || column.typeStr === "props" || column.typeStr === "grid"}
                    {#if line.guid in listVisibility && listVisibility[line.guid].guid === column.guid}
                        <button class="buttonIcon" on:click={()=>setListVisible(line,column,false)}>
                            <img src={iconPaths["showList"].path} alt="Hide {column.typeStr}">
                        </button>
                        ...
                    {:else}
                        <button class="buttonIcon" on:click={()=>setListVisible(line,column,true)}>
                            <img src={iconPaths["hideList"].path} alt="Show {column.typeStr}">
                        </button>
                        {#if previewDisclosedFields}
                        {#if column.typeStr === "list"}
                            <!-- Preview list contents  -->
                            {#if line[column.name].length > 0 && line[column.name].length <= 5}
                                {column.name} ({line[column.name].length}) : {line[column.name].map(l => l.id)}
                            {:else if line[column.name].length > 5}
                                {column.name} ({line[column.name].length}) : {line[column.name].map(l => l.id).slice(0, 4)}...
                            {/if}
                        {:else if column.typeStr === "props"}
                            <!-- Preview props contents  -->
                            {#each Object.keys(line[column.name]) as k, index}
                                {#if k !== "guid" && index < 5}
                                    {k} : {line[column.name][k]},
                                {/if}
                            {/each}
                            ...
                        {:else if column.typeStr === "grid"}
                            <!-- Preview grid contents  -->
                            {#if line[column.name].length > 0 && line[column.name].length <= 5}
                                {line[column.name]}
                            {:else if line[column.name].length > 5}
                                {line[column.name].slice(0, 4)}...
                            {/if}
                        {/if}
                        {/if}
                    {/if}
                {/if}
                </div>
                </td>
            {/each}
        </tr>
        <!-- if line has a hidden sheet currently set to visible -->
        <!-- listVisibility is guid, column  -->
        {#if line.guid in listVisibility}
        <!-- maybe pull this out of the tr and just use a div? -->
            <tr>
            {#if listVisibility[line.guid].typeStr === "list" || listVisibility[line.guid].typeStr === "props"}
                <td></td>
                <td colspan="{totalColumns -  1}">
                    <!--    lineData grabs itself from the values in the lineData in this sheet
                            this is because lines store their nested values inside of themsevles instead of inside the sheet -->

                    <!-- if our sheet isnt props, our linedata will be an array -->
                    <svelte:self    debug={debug} 
                                    showLineGUIDs={showLineGUIDs} 
                                    showNestedNames={showNestedNames}
                                    showNestedPaths={showNestedPaths}
                                    allowSchemaEditing={allowSchemaEditing}
                                    allowAddRemoveItems={allowAddRemoveItems}
                                    originLineGUID={line.guid}
                                    bind:fullData={fullData} 
                                    bind:sheetData={fullData.sheets[fullData.sheets.findIndex(sheet => sheet.guid === listVisibility[line.guid].sheet)]} 
                                    bind:inputLineData={inputLineData[inputLineData.findIndex(refLine => refLine.guid === line.guid)][listVisibility[line.guid].name]} 
                                    depotInfo={depotInfo} 
                                    on:message={handleSubTableEvent}
                                    bind:listVisibility={listVisibility}
                                    bind:lastHovered={lastHovered}
                                    parentGUID={sheetData.guid}
                                    baseDataPath={baseDataPath + (sheetData.isProps ? "." : "[" + i + "].") + fullData.sheets[fullData.sheets.findIndex(sheet => sheet.guid === listVisibility[line.guid].sheet)].name}/>
                </td>
            {:else if listVisibility[line.guid].typeStr === "grid"}
                <td></td>
                <td colspan="{totalColumns -  1}">
                    <GridFieldTableEditor sheetGUID={sheetData.guid} 
                                          bind:data={line[listVisibility[line.guid].name]} 
                                          bind:columnData={listVisibility[line.guid]} 
                                          on:message/>
                </td>
            {/if}
            </tr>
        {/if}
    {/if}
    {/each}
{:else}
    <!-- SHEET DRAWING FOR PROPS SHEET -->
    <!-- this prevents us from preemptively drawing empty an empty props entry -->
    {#if Object.keys(inputLineData).length !== 0}
        <tr>
            <td class="lineActions" style={`width:${getColumnWidth(SPECIAL_COLUMNS.controls)}px; min-width:50px;`}>
                {#if allowAddRemoveItems}
                    <button class="buttonIcon" title="Remove Line" on:click={() => removeLine(0,inputLineData,originLineGUID)}>
                        <img style="max-width:17px" src={iconPaths["removeLine"].path} alt="Remove Line">
                    </button>
                {/if}
            </td>
            {#if showLineGUIDs}
            <td style={`width:${getColumnWidth(SPECIAL_COLUMNS.guid)}px; min-width:120px;`}>{inputLineData.guid}</td>
            {/if}
            {#each sheetData.columns as column, c}
                <td title="{column.description}" style={`width:${getColumnWidth(column)}px; min-width:60px;`}>
                <div>
                <!-- message from field updates bubble to Depot.svelte -->
                {#if column.typeStr === "text"}
                <TextField sheetGUID={sheetData.guid} bind:data={inputLineData[column.name]} on:message/>
                {:else if column.typeStr === "longtext"}
                <LongTextField bind:data={inputLineData[column.name]}/>
                {:else if column.typeStr === "image"}
                <ImageField sheetGUID={sheetData.guid} bind:data={inputLineData[column.name]} on:message fileKey={{"line":inputLineData,"lineIndex":0,"column":column,"columnIndex":c}}/>
                {:else if column.typeStr === "file"}
                <FileField sheetGUID={sheetData.guid} bind:data={inputLineData[column.name]} on:message fileKey={{"line":inputLineData,"lineIndex":0,"column":column,"columnIndex":c}}/>
                {:else if column.typeStr === "bool"}
                <BooleanField bind:data={inputLineData[column.name]}/>
                {:else if column.typeStr === "enum"}
                <EnumField bind:data={inputLineData[column.name]} options={sheetData.columns.find(x => x.name === column.name).options.split(', ')}/>
                {:else if column.typeStr === "sheetReference"}
                <EnumField bind:data={inputLineData[column.name]} options={depotInfo.sheetsFiltered.guids} aliases={depotInfo.sheetsFiltered.names}/>
                {:else if column.typeStr === "lineReference"}
                    {#if column.sheet !== ""}
                    <EnumField  bind:data={inputLineData[column.name]} 
                                options={depotInfo.lines[column.sheet].guids} 
                                aliases={depotInfo.lines[column.sheet].names}/>
                    {:else}
                    <EnumField  bind:data={inputLineData[column.name]} 
                                options={[]} 
                                aliases={[]}/>
                    {/if}
                    {#if inputLineData[column.name] !== "" && !depotInfo.lines[column.sheet].guids.includes(inputLineData[column.name])}
                        <div title="Selected value with GUID {inputLineData[column.name]} not in selected sheet. Select proper sheet in column settings">ERROR</div>
                    {/if}
                {:else if column.typeStr === "multiple"}
                <MultipleField bind:data={inputLineData[column.name]} options={sheetData.columns.find(x => x.name === column.name).options.split(', ')} displayType={"displayType" in column ? column.displayType : "vertical"}/>
                {:else if column.typeStr === "int"}
                <IntegerNumberField bind:data={inputLineData[column.name]} min={column.min} max={column.max}/>
                {:else if column.typeStr === "float"}
                <NumberField bind:data={inputLineData[column.name]} min={column.min} max={column.max}/>
                {:else if column.typeStr === "date"}
                <DateField bind:data={inputLineData[column.name]} />
                {:else if column.typeStr === "list" || column.typeStr === "props" || column.typeStr === "grid"}
                    {#if inputLineData.guid in listVisibility && listVisibility[inputLineData.guid].guid === column.guid}
                        <button class="buttonIcon" on:click={()=>setListVisible(inputLineData,column,false)}>
                            <img src={iconPaths["showList"].path} alt="Hide {column.typeStr}">
                        </button>
                        ...
                    {:else}
                        <button class="buttonIcon" on:click={()=>setListVisible(inputLineData,column,true)}>
                            <img src={iconPaths["hideList"].path} alt="Show {column.typeStr}">
                        </button>
                        {#if previewDisclosedFields}
                        {#if column.typeStr === "list"}
                            <!-- Preview list contents  -->
                            {#if inputLineData[column.name].length > 0 && inputLineData[column.name].length <= 5}
                                {column.name} ({inputLineData[column.name].length}) : {inputLineData[column.name].map(l => l.id)}
                            {:else if inputLineData[column.name].length > 5}
                                {column.name} ({inputLineData[column.name].length}) : {inputLineData[column.name].map(l => l.id).slice(0, 4)}...
                            {/if}
                        {:else if column.typeStr === "props"}
                            <!-- Preview props contents  -->
                            {#each Object.keys(inputLineData[column.name]) as k, index}
                                {#if k !== "guid" && index < 5}
                                    {k} : {inputLineData[column.name][k]},
                                {/if}
                            {/each}
                            ...
                        {:else if column.typeStr === "grid"}
                            <!-- Preview grid contents  -->
                            {#if inputLineData[column.name].length > 0 && inputLineData[column.name].length <= 5}
                                {inputLineData[column.name]}
                            {:else if inputLineData[column.name].length > 5}
                                {inputLineData[column.name].slice(0, 4)}...
                            {/if}
                        {/if}
                        {/if}
                    {/if}
                {/if}
                </div>
                </td>
            {/each}
        </tr>
        <!-- if line has a hidden sheet currently set to visible -->
        <!-- listVisibility is guid, column  -->
        {#if inputLineData.guid in listVisibility}
        <!-- maybe pull this out of the tr and just use a div? -->
            <tr>
            {#if listVisibility[inputLineData.guid].typeStr === "list" || listVisibility[inputLineData.guid].typeStr === "props"}
                <td></td>
                <td colspan="{totalColumns -  1}">
                <!-- if our sheet is props, our line data is just an object to be indexed by key -->
                <svelte:self    debug={debug} 
                                showLineGUIDs={showLineGUIDs} 
                                showNestedNames={showNestedNames}
                                showNestedPaths={showNestedPaths}
                                allowSchemaEditing={allowSchemaEditing}
                                allowAddRemoveItems={allowAddRemoveItems}
                                originLineGUID={inputLineData.guid}
                                bind:fullData={fullData} 
                                bind:sheetData={fullData.sheets[fullData.sheets.findIndex(sheet => sheet.guid === listVisibility[inputLineData.guid].sheet)]} 
                                bind:inputLineData={inputLineData[listVisibility[inputLineData.guid].name]} 
                                depotInfo={depotInfo} 
                                on:message={handleSubTableEvent}
                                bind:listVisibility={listVisibility}
                                bind:lastHovered={lastHovered}
                                parentGUID={sheetData.guid}
                                baseDataPath={baseDataPath + (sheetData.isProps ? "." : "[" + 0 + "].") + fullData.sheets[fullData.sheets.findIndex(sheet => sheet.guid === listVisibility[inputLineData.guid].sheet)].name}/>
                </td>
            {:else if listVisibility[inputLineData.guid].typeStr === "grid"}
                <td></td>
                <td colspan="{totalColumns -  1}">
                    <GridFieldTableEditor sheetGUID={sheetData.guid} 
                                        bind:data={inputLineData[listVisibility[inputLineData.guid].name]} 
                                        bind:columnData={listVisibility[inputLineData.guid]} 
                                        on:message/>
                </td>
            {/if}
            </tr>
        {/if}
    {/if}
{/if}
    {#if allowAddRemoveItems}
        <!-- dont allow more than one line for a props sheet -->
        {#if sheetData.isProps && inputLineData && Object.keys(inputLineData).length === 0 && inputLineData.constructor === Object}
        <tr>
            <td></td>
            <td colspan="{totalColumns -  1}">
                <button class="buttonIcon addLine" title="Add props" on:click={() => addLines(1,originLineGUID)}>
                    <img src={iconPaths["addPropsLine"].path} alt="Add props">
                </button>
            </td>
        </tr>
        {:else if !sheetData.isProps}
        <tr>
            <td></td>
            <td colspan="{totalColumns -  1}">
                <button class="buttonIcon addLine" title="Add one line" on:click={() => addLines(1,originLineGUID)}>
                    <img src={iconPaths["addOneLine"].path} alt="Add one line">
                </button>
                <button class="buttonIcon addLine" title="Add five lines" on:click={() => addLines(5,originLineGUID)}>
                    <img src={iconPaths["addFiveLines"].path} alt="Add five lines">
                </button>
                <button class="buttonIcon addLine" alt="Add ten lines" on:click={() => addLines(10,originLineGUID)}>
                    <img src={iconPaths["addTenLines"].path} alt="Add ten lines">
                </button>
            </td>
        </tr>
        {/if}
    {/if}
</table>
{#if debug}
<p>Current Table Data:</p>
<pre>{JSON.stringify({sheetData},null,2)}</pre>
<p>----------------------------------------</p>
{/if}

<style>

    .buttonIcon {
        background-color: var(--vscode-button-background);
        border: none;
        color: var(--vscode-button-foreground);
        display: inline-block;
        cursor: pointer;
    }
    .buttonIcon:hover {
      background-color: var(--vscode-button-hoverBackground);
    }
    .buttonIcon:focus {
        outline: none;
        box-shadow: none;
    }
    .buttonIcon:active:focus {
        outline: none;
        box-shadow: none;
    }
    .buttonIcon.padded {
        margin: 5px 5px 5px 0px;
        width: 45px;
        height: 45px;
    }
    .buttonIcon.addLine {
        margin: 5px 0px 5px 0px;
        padding: 0px 0px 0px 0px;
    }

    .lineActions {
        width: 80px;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .dragHandle {
        cursor: grab;
        font-weight: bold;
        user-select: none;
        color: var(--vscode-editor-foreground);
        padding: 0px 4px;
    }

    tr.dragTarget {
        outline: 1px dashed var(--vscode-focusBorder);
    }

    tr.dragging {
        opacity: 0.7;
    }

    .columnHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        width: 100%;
        position: relative;
        padding-right: 14px;
        box-sizing: border-box;
    }

    .columnHeader a {
        flex: 1;
        min-width: 0;
    }

    .resizeHandle {
        position: absolute;
        top: 0;
        right: -5px;
        width: 14px;
        height: 100%;
        cursor: col-resize;
        user-select: none;
        border-left: 1px solid var(--vscode-panel-border);
        background: linear-gradient(to right, transparent 0%, transparent 45%, var(--vscode-panel-border) 45%, var(--vscode-panel-border) 55%, transparent 55%, transparent 100%);
        opacity: 0.7;
    }

    .resizeHandle:hover {
        background: linear-gradient(to right, transparent 0%, transparent 35%, var(--vscode-focusBorder) 35%, var(--vscode-focusBorder) 65%, transparent 65%, transparent 100%);
        opacity: 1;
    }
</style>
