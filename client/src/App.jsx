import { useState, useRef, useEffect, useCallback } from 'react';
import { RichSelect, Switch, DatePicker, MultiCombo } from '@svar-ui/react-core';
import { Editor, registerEditorItem } from '@svar-ui/react-editor';
import { Button } from "@svar-ui/react-core";
import { Willow } from "@svar-ui/react-core";
import { WillowDark } from "@svar-ui/react-core";
import Starfield from 'react-starfield';
import axios from 'axios';

import './App.css';

import { getEditorConfig } from "@svar-ui/react-grid";
import { Grid } from "@svar-ui/react-grid";
import "@svar-ui/react-grid/all.css";

// import CheckboxCell from '../custom/CheckboxCell.jsx';
registerEditorItem('richselect', RichSelect);
registerEditorItem('switch', Switch);
registerEditorItem('datepicker', DatePicker);
registerEditorItem('multicombo', MultiCombo);





const gridData = [
    {
        id: 1,
        AttributeName: "Body",
        Scale: "MINOR",
        Rank: "1",
        BuildPoints: "5",
        data: []
    },
    {
        id: 2,
        AttributeName: "Area",
        Scale: "1",
        Rank: "0",
        BuildPoints: "0",
        data: []
    },
];

let AttributeRowCount = gridData.length;
let LimitRowCount = 1;
let TagRowCount = 1;


const attributeScale = [
    { id: "1", label: "MINOR" },
    { id: "2", label: "MODERATE" },
    { id: "3", label: "MAJOR" }
];

const tagRank = [
    { id: "1", label: "1" },
    { id: "2", label: "2" },
    { id: "3", label: "3" }
];

const systemList = [
    { id: 0, label: 'Communications' },
    { id: 1, label: 'Electronics' },
    { id: 2, label: 'Power' },
    { id: 3, label: 'Main Attack' },
    { id: 4, label: 'Secondary Attack' },
    { id: 5, label: 'Main Drive' },
    { id: 6, label: 'Secondary Drive' },
    { id: 7, label: 'Missiles' },
    { id: 8, label: 'Modifiers' },
    { id: 9, label: 'Structure' },
    { id: 10, label: 'Tasks' }
];

const gridColumns = [
    { id: "id", width: 50, hidden: true },
    { id: "AttributeName", width: 100, header: "Attribute", footer: "Attribute" },
    {
        id: "Scale", header: "Scale", footer: "Scale", width: 150,
        editor: {
            type: "combo",
            config: { template: (option) => `${option.label}` },
            },
            options: attributeScale        

    },
    { id: "Rank", header: "Rank", footer: "Rank", width: 75, editor:"text" },
    { id: "BuildPoints", header: "BP Cost", footer: "BP Cost", width: 75 }
];

const gridLimCol = [
    { id: "id", width: 50, hidden: true },
    {id: "LimitDesc", width: 374, header: "Description", footer: "Attribute", editor: "text"},
    {
        id: "LimitScale", header: "Scale", footer: "Scale", width: 150,
        editor: {
            type: "richselect",
            config: { template: (option) => `${option.label}` },
        },
        options: attributeScale

    },
    { id: "BuildPoints", header: "BP Cost", footer: "BP Cost", width: 75 }
];

const gridTagCol = [
    { id: "id", width: 50, hidden: true },
    { id: "TagDesc", width: 398, header: "Description", footer: "Description", editor: "text" },
    {
        id: "TagRank", header: "Rank", footer: "Rank", width: 75,
        editor: {
            type: "richselect",
            config: { template: (option) => `${option.label}` }
        },
        options: tagRank
    },
    {
        id: "TagFree",
        header: "Free",
        footer: "Free",
        width: 50,
        editor: {
            type: "switch"
        }
    },
    { id: "BuildPoints", header: "BP Cost", footer: "BP Cost", width: 75 }
];




function App() {
    const [itemsizes, setItemsizes] = useState();
    const [itemsizesds, setItemsizesDS] = useState();
    const [itemattributesds, setItemAttributesDS] = useState();
    const [itemName, setItemName] = useState();

    const [selectedSize, setSelectedSize] = useState();
    const [itemBasePoints, setItemBasePoints] = useState();
    const [itemIncrementPoints, setItemIncrementPoints] = useState();

    const [baseCR, setBaseCR] = useState();
    const [totalCR, setTotalCR] = useState();

    const [baseBody, setBaseBody] = useState();
    const [attriBody, setAttriBody] = useState();
    const [bodyRating, setBodyRating] = useState();

    const [itemArmor, setItemArmor] = useState();
    const [itemArmorType, setItemArmorType] = useState();
    const [itemForceField, setItemForceField] = useState();
    const [itemPowerSlots, setItemPowerSlots] = useState();

    const [modifiers, setModifiers] = useState();
    const [skillsList, setSkillsList] = useState();
    const [modifierSelections, setModifierSelections] = useState();

    const [tasks, setTasks] = useState();
    const [taskText, setTaskText] = useState();

    const [tagBP, setTagBP] = useState();
    const [attrBP, setAttrBP] = useState();
    const [limitBP, setLimitBP] = useState();

    const [totalBP, setTotalBP] = useState();

    const [tagFields, setTagFields] = useState([{ value: '', rank: 1, type: 1 }, { value: '', rank: 1, type: 1 }, { value: '', rank: 1, type: 1 }]);

    const [attriFields, setAttriFields] = useState([{ AttributeID: '1', AttributeName: '1', Scale: "minor", Rank: "0", AttributeBP: "0", PowerSlots: "0", data: [] }]);
    const [attridd, setAttriDD] = useState();
    const [attriScale, setAttriScale] = useState();
    const [attriSysList, setAttriSysList] = useState();

    const [attriGridData, setAttriGridData] = useState();
    const [attriGridCol, setAttriGridCol] = useState();
    const [limitGridData, setLimitGridData] = useState();
    const [tagGridData, setTagGridData] = useState();

    const [dataToEdit, setDataToEdit] = useState(null);
    const [limitToEdit, setLimitToEdit] = useState();
    const [tagToEdit, setTagToEdit] = useState();

    const dataToEditRef = useRef(null);
    const limitToEditRef = useRef(null);
    const tagToEditRef = useRef(null);

    const tagBPRef = useRef(tagBP);

    const [minorLimitationCnt, setMinorLimitationCnt] = useState();
    const [moderateLimitationCnt, setModerateLimitationCnt] = useState();
    const [majorLimitationCnt, setMajorLimitationCnt] = useState();

    const [itemPackage, setItemPackage] = useState();

    const [attackList, setAttackList] = useState();
    const [attacks, setAttacks] = useState();
    const [attackText, setAttackText] = useState();

    const [SystemBreakDown, setSystemBreakDown] = useState();

    useEffect(() => {
        setAttriSysList([
            { id: 0, label: 'Communications' },
            { id: 1, label: 'Electronics' },
            { id: 2, label: 'Power' },
            { id: 3, label: 'Main Attack' },
            { id: 4, label: 'Secondary Attack' },
            { id: 5, label: 'Main Drive' },
            { id: 6, label: 'Secondary Drive' },
            { id: 7, label: 'Missiles' },
            { id: 8, label: 'Modifiers' },
            { id: 9, label: 'Tasks' }

        ]);


        populateItemSizesData();
        populateItemSizesDataSet();
        populateItemAttributesDataSet();
        populateAttributeScaleDataSet();
        populateSkillsDataSet();


        setItemBasePoints(0);
        setItemIncrementPoints(0);
        setItemName("");

        setBaseCR(0);
        setTotalCR(0);

        setBaseBody(0);
        setAttriBody(0);
        setBodyRating(0);

        setItemArmor(0);
        setItemArmorType("");
        setItemForceField(0);
        setItemPowerSlots([]);

        setModifiers([]);
        setModifierSelections([]);

        setTasks([]);
        setTaskText([]);


        setMinorLimitationCnt(0);
        setModerateLimitationCnt(0);
        setMajorLimitationCnt(0);


        setTagFields([{ value: '', rank: "1", type: "1" }]);
        setAttriFields([{ AttributeID: '1', AttributeName: 'Area', Scale: "minor", Rank: "0", AttributeBP: "0", data: [] }]);
        setAttriGridData([{ id: 1, AttributeName: "Area", Scale: "1", Rank: "0", BuildPoints: "0", PowerSlots: "0", data: [] }]);
        setLimitGridData([{ id: 1, LimitDesc: "", LimitScale: 1, BuildPoints: 0 }]);
        setTagGridData([{ id: 1, TagDesc: "", TagRank: 1, TagFree: false, BuildPoints: 0 }]);

        setTagBP(0);
        setAttrBP(0);

        setLimitBP(0);

        setTotalBP(0);

        setAttackList([]);
        setAttacks([]);
        setAttackText([]);
        setSystemBreakDown([]);




        dataToEditRef.current = dataToEdit;
        limitToEditRef.current = limitToEdit;
        tagToEditRef.current = tagToEdit;
        tagBPRef.current = tagBP;

        console.log("ItemSizeDataSet");
        console.log(itemsizesds);
        console.log(itemsizes);



    }, []);

    useEffect(() => {
        calcTotalBP(tagBP, attrBP, limitBP);
    }, [tagBP, attrBP, limitBP]);

    useEffect(() => {
        let crTotal = 0;

        crTotal = baseCR + Math.round((totalBP - itemBasePoints) / itemIncrementPoints);
        if (crTotal < 0 || crTotal === undefined || isNaN(crTotal) || crTotal === Infinity) {
            crTotal = 0;
        }

        setTotalCR(crTotal)
    }, [baseCR, itemIncrementPoints, itemBasePoints, totalBP]);

    useEffect(() => {
        setBodyRating(parseInt(baseBody) + parseInt(attriBody));
    }, [baseBody, attriBody]);

    useEffect(() => {
        let newModifiers = structuredClone(modifiers);

        if (modifierSelections !== undefined) {
            modifierSelections.forEach((selection) => {
                let currentModifier = newModifiers.find(modifier => {
                    return newModifiers.modifierID === selection.modifierID;
                });

                if (currentModifier !== undefined) {
                    currentModifier.modifierName = selection.modifierName;
                }
            });
        }

        setModifiers(newModifiers)
    }, [modifierSelections]);

    const apiRef = useRef(null);
    const apiLimitRef = useRef(null);
    const apiTagRef = useRef(null);

     const addRow = () => {
        AttributeRowCount++;
        apiRef.current.exec("add-row", {
            row: {
                id: AttributeRowCount,
                AttributeName: 1,
                Scale: "1",
                Rank: "0",
                BuildPoints: "0",
                PowerSlots: "0",
                data: []
            }
        });
    };

    const addSystem = () => {
        let newSystem = system_add_fld.value;
        let SystemID = attriSysList.length + 1;


        if (newSystem != "") {
            if (attriSysList.length == 0) {
                setAttriSysList([{ sysID: SystemID, sysName: newSystem }]);
            }
            if (attriSysList.find(({ sysName }) => sysName == newSystem) === undefined) {


                setAttriSysList([...attriSysList, { sysID: SystemID, sysName: newSystem }]);
            }
        }

        populateItemAttributesDataSet();


    };

    const addSubRow = () => {
        AttributeRowCount++;
        let grid = apiRef.current.getState();

        if (grid.selectedRows.length === 1) {
            let selectedID = grid.selectedRows[0];
            let gridRow = grid.flatData.find(selected => selected.id === selectedID);

            console.log("GridRow for Sub Row Insert:");
            console.log(gridRow);




            let subRow = {
                id: AttributeRowCount,
                AttributeName: "1",
                Scale: "1",
                Rank: "0",
                BuildPoints: "0",
                PowerSlots: "0",
                data: []
            }
            subRow.$parent = selectedID;
            subRow.$level = 1 + gridRow.$level;

            if (gridRow.$count) {
                gridRow.$count++;
                gridRow.data = [...gridRow.data, subRow];
            } else {
                gridRow.$count = 0;
                gridRow.data = [subRow];
            }

            gridRow.open = true;


            // Throws an Error:
            //apiRef.current?.exec("open-row", { id: 0, nested: true });

            apiRef.current.exec('add-row', {
                row: subRow,
            });
            setAttriGridData([...AttriGridData]);
        }

        console.log(grid);
    }

    const addLimitRow = () => {
        LimitRowCount++;
        apiLimitRef.current.exec("add-row", {
            row: {
                id: LimitRowCount,
                LimitDesc: "",
                LimitScale: 1,
                BuildPoints: 0
            }
        });
    };

    const addTagRow = () => {
        TagRowCount++;
        apiTagRef.current.exec("add-row", {
            row: {
                id: TagRowCount,
                TagDesc: "",
                TagRank: 1,
                TagFree: false,
                BuildPoints: 0
            }
        });
    };

    const ExportToCVS = () => {
        let exportItem = packageItem();
        requestCVS(exportItem);
    }

    function getRowByID(grid, id) {
        let gridData = grid.flatData;
        let gridRow = gridData.find(attribute => attribute.id === id);

        return gridRow;
    }

    const init = useCallback((gridApi) => {
        gridApi.intercept('open-editor', ({ id }) => {
            let gridRow = getRowByID(gridApi.getState(), id);

            console.log("Attribute Grid Row for Editor:");
            console.log(gridRow);
            console.log(gridApi.getRow(id));
            setDataToEdit(gridRow);
            return false;
        });
        gridApi.on('select-row', ({ id }) => {
            if (dataToEditRef.current) {
                setDataToEdit(id ? gridApi.getRow(id) : null);
            }
        });
        gridApi.on('delete-row', ({ id }) => {
            calcAttriBP(gridApi.getState());
        });
        gridApi.on('update-row', async ({ id }) => {
            let scaleData = undefined;

            console.log("The cell is updated in the row:", id);
            if (attriScale === undefined) {
                scaleData = await populateAttributeScaleDataSet();
            } else {
                scaleData = attriScale;
            }

            let row = getRowByID(gridApi.getState(), id);
            console.log(row);
            let scaleType = 'MINOR'

            if (row.Scale === '2') {
                scaleType = 'MODERATE'
            }
            if (row.Scale === '3') {
                scaleType = 'MAJOR'
            }


            let searching = false;
            let rowIdx = 0;
            let scaleRow = undefined;
            let bpCost = 0;

            while (scaleRow === undefined && rowIdx < scaleData.length) {

                if (scaleData[rowIdx].AttributeID == row.AttributeName && scaleData[rowIdx].ScaleType == scaleType) {
                    scaleRow = scaleData[rowIdx];
                }

                rowIdx++;
            }

            if (!(scaleRow === undefined)) {
                console.log(scaleRow);

                if (scaleRow.AttributeFormula === null || scaleRow.AttributeFormula.length === 0) {
                    bpCost = parseInt(scaleRow.AttributeCost) * parseInt(row.Rank);
                } else {
                    let attriForm = scaleRow.AttributeFormula.replaceAll("[N]", row.Rank);
                    bpCost = eval(attriForm);
                    console.log(attriForm);
                }
            }

            row.BuildPoints = bpCost;
            if (!(scaleRow === undefined)) {
                if (scaleRow.PowerSlots !== undefined) {
                    //scaleRow.PowerSlots = 0;
                    row.PowerSlots = scaleRow.PowerSlots
                }
            } else {
                row.PowerSlots = 0;
            }


            calcAttriBP(gridApi.getState());

            console.log(tagBP);
            console.log(bpCost);
            console.log("scaleData:");
            console.log(scaleData);
        })
    }, [attriScale, tagBP, limitBP, tagBPRef]);

    const limitInit = useCallback((gridApi) => {
        gridApi.intercept('open-editor', ({ id }) => {
            setLimitToEdit(gridApi.getRow(id));
            return false;
        });
        gridApi.on('select-row', ({ id }) => {
            if (limitToEditRef.current) {
                setLimitToEdit(id ? gridApi.getRow(id) : null);
            }
        });
        gridApi.on('update-row', async ({ id }) => {
            let row = gridApi.getRow(id);
            let bpCost = -10;

            if (row.LimitScale == 2) {
                bpCost = -20;
            }
            if (row.LimitScale == 3) {
                bpCost = -50;
            }

            row.BuildPoints = bpCost;

            calcLimitBP(gridApi.getState());

        });
        gridApi.on('delete-row', ({ id }) => {
            calcLimitBP(gridApi.getState());
        });
    }, []);


    const tagInit = useCallback((gridApi) => {
        gridApi.intercept('open-editor', ({ id }) => {
            setTagToEdit(gridApi.getRow(id));
            return false;
        });
        gridApi.on('select-row', ({ id }) => {
            if (tagToEditRef.current) {
                setTagToEdit(id ? gridApi.getRow(id) : null);
            }
        });
        gridApi.on('update-row', async ({ id }) => {
            let row = gridApi.getRow(id);
            let bpCost = 5;

            if (row.TagFree) {
                bpCost = 10;
            }

            bpCost = row.TagRank * bpCost;

            if (!Number.isInteger(bpCost)) {
                bpCost = 0;
            }

            row.BuildPoints = bpCost;

            calcTagBP(gridApi.getState());

        });
        gridApi.on('delete-row', ({ id }) => {
            calcTagBP(gridApi.getState());
        });
    }, []);

    function calcAttriBP(grid) {
        let bpTotal = 0;

        let bodyTotal = 0;
        let bodyMultiplier = 5;

        let forceFieldMultiplier = 10;
        let forceFieldTotal = 0;

        let armorType = ' (Firefight)';
        let powerArray = [10, 22];
        let newPowerSlots = [];
        let newModifiers = [];
        let newTasks = [];
        let newAttacks = [];


        console.log(tagBPRef.current);

        try {
            console.log("Flat Data:");
            console.log(grid.flatData);
            let sysOfADown = [];

            grid.flatData.forEach((attribute) => {
                bpTotal = bpTotal + parseInt(attribute.BuildPoints);
                let systemName = undefined;

                let sysFlag = true;
                // Armor Track Logic
                if (attribute.AttributeName == 2) {
                    if (attribute.Scale == '2') {
                        armorType = ' (Battlefield)';
                    }
                    if (attribute.Scale == '3') {
                        armorType = ' (Hull)';
                    }

                    setItemArmor(attribute.Rank);
                    setItemArmorType(armorType);
                    sysFlag = false;
                }

                // Body Track Calculation Logic
                if (attribute.AttributeName == 5) {
                    console.log(attribute);

                    if (attribute.Scale == '2') {
                        bodyMultiplier = 20;
                    }
                    if (attribute.Scale == '3') {
                        bodyMultiplier = 50;
                    }

                    bodyTotal = parseInt(attribute.Rank) * bodyMultiplier;
                    setAttriBody(bodyTotal);
                    sysFlag = false;

                }

                // Force Field Track Calculation Logic
                if (attribute.AttributeName == 13) {
                    if (attribute.Scale == '2') {
                        forceFieldMultiplier = 20;
                    }
                    if (attribute.Scale == '3') {
                        forceFieldMultiplier = '50'
                    }

                    forceFieldTotal = parseInt(attribute.Rank) * forceFieldMultiplier;
                    setItemForceField(forceFieldTotal);
                    sysFlag = false;
                }

                // Power Slot Tracking
                if (powerArray.includes(attribute.AttributeName) || attribute.PowerSlots > 0) {
                    let powerRecord = newPowerSlots.find(slot => slot.scale === attribute.Scale);
                    let powerBase = 0

                    if (powerArray.includes(attribute.AttributeName)) {
                        powerBase = 3;
                    }

                    if (powerRecord === undefined) {
                        let scaleName = 'Minor';

                        if (attribute.Scale === '2') {
                            scaleName = 'Moderate';
                        }

                        if (attribute.Scale === '3') {
                            scaleName = 'Major';
                        }

                        powerRecord = { scale: attribute.Scale, total: powerBase * parseInt(attribute.Rank), used: attribute.PowerSlots, scaleName: scaleName };


                        newPowerSlots.push(powerRecord);
                        newPowerSlots.sort((a, b) => a.scale - b.scale);



                    } else {
                        powerRecord.total = powerRecord.total + (powerBase * parseInt(attribute.Rank));
                        powerRecord.used = powerRecord.used + parseInt(attribute.PowerSlots);
                    }
                    sysFlag = false;

                }

                setItemPowerSlots(newPowerSlots);

                // Modifier Tracking 
                if (attribute.AttributeName === 20) {
                    if (attribute.Rank > 4) {
                        attribute.Rank = 4;
                    }

                    let modifierRecord = { modifierID: 'Modifier_' + attribute.id, modifierName: "", modifierRank: attribute.Rank }
                    newModifiers.push(modifierRecord);
                    sysFlag = false;
                }

                // Task Tracking 
                if (attribute.AttributeName === 26) {
                    let taskRecord = { taskID: 'Task_' + attribute.id, taskName: "", taskRank: attribute.Rank }
                    newTasks.push(taskRecord);
                    sysFlag = false;
                }

                // Attack Tracking
                if (attackList.includes(attribute.AttributeName)) {
                    let attackRecord = { attackID: 'Attack_' + attribute.id, attributeID: attribute.id, attackName: "", attackRank: attribute.Rank, AttributeName: attribute.AttributeName, attributes: [] };
                    newAttacks.push(attackRecord);
                }

                if (attribute.$parent !== 0 && attribute.$parent !== undefined) {
                    let attackRecord = newAttacks.find(attack => attack.attributeID = attribute.$parent)
                    console.log(attackRecord);
                    let attackAttribute = { id: attribute.AttributeName, Rank: attribute.Rank };
                    attackRecord.attributes.push(attackAttribute);

                }

                if (sysFlag) {
                    systemName = systemList[parseInt(attribute.AttributeSystem)].label;
                    let systemIdx = sysOfADown.findIndex(({ sysName }) => sysName === systemName);

                    if (systemIdx !== -1) {
                        sysOfADown[systemIdx].sysAttributes.push(attribute);
                    } else {
                        let newSystem = { sysName: systemName, sysAttributes: [attribute] };
                        sysOfADown.push(newSystem);
                    }
                }

            })
            setModifiers(newModifiers);
            setTasks(newTasks);
            //setAttacks(newAttacks);

            sysOfADown.sort((a, b) => a.sysName.localeCompare(b.sysName));
            setSystemBreakDown(sysOfADown);

            setAttrBP(bpTotal);



            /*
            if (tagBP !== undefined && limitBP !== undefined) {
                calcTotalBP(tagBP, bpTotal, limitBP);
            } else { 
                calcTotalBP(0, bpTotal, 0);
            }*/

        } catch (e) {
            console.error(e.Message);
        }

    }

    function calcLimitBP(grid) {
        let bpTotal = 0;
        let minorLimit = 0;
        let moderateLimit = 0;
        let majorLimit = 0;

        try {
            grid.flatData.forEach((limit) => {
                bpTotal = bpTotal + limit.BuildPoints;

                switch (limit.LimitScale) {
                    case '1':
                        minorLimit++;
                        break;
                    case '2':
                        moderateLimit++;
                        break;
                    case '3':
                        majorLimit++;
                        break;

                }
            });

            setMinorLimitationCnt(minorLimit);
            setModerateLimitationCnt(moderateLimit);
            setMajorLimitationCnt(majorLimit);
            setLimitBP(bpTotal);
        } catch (e) {
            console.error(e.Message);
        }
    }

    function calcTagBP(grid) {
        let bpTotal = 0;


        try {
            grid.flatData.forEach((tag) => {
                bpTotal = bpTotal + tag.BuildPoints;

            });


            setTagBP(bpTotal);
        } catch (e) {
            console.error(e.Message);
        }
    }

    function attributeScaleMatch(record, AttriID, scType) {
        console.log("AttributeScaleMatch Parameters")
        console.log(record);
        console.log(AttriID);
        console.log(scType);

        return (record.AttributeID === AttriID && record.ScaleType === scType);
    }

    function loadsysList() {

        return systemList;
    }




    /*
        Action Handles Section 
    */
    const packageItem = () => { 
        console.log("Save Logic");
        let attributeList = apiRef.current?.getState();
        let tagList = apiTagRef.current?.getState();
        let limitList = apiLimitRef.current?.getState();


        let newPackageItem = {
            itemID: null,
            itemName: itemName,
            itemSize: selectedSize,
            CostRating: totalCR,
            modifierList: modifierSelections,
            taskList: tasks,
            attributeList: structuredClone(attributeList.flatData),
            limitList: structuredClone(limitList.flatData),
            tagList: structuredClone(tagList.flatData)
        };

        newPackageItem.attributeList.forEach((attribute) => {
            let sysID = attribute.AttributeSystem; 

            let system = systemList.find((sysItem => sysItem.id == sysID))

            if (system !== undefined) { 
                attribute.AttributeSystem = system.label;

            }
        });

        if (newPackageItem.taskList.length > 0) {
            newPackageItem.taskList.forEach((task) => {
                let taskName = taskText.find(text => text.taskID == task.taskID);

                if (taskName !== undefined) { 
                    task.taskName = taskName.taskName;
                }
            });
        }

        setItemPackage(newPackageItem);

        console.log(JSON.stringify(newPackageItem));

        return newPackageItem;
    }

    const handleSave = () => {
        console.log("Save Logic");
        let attributeList = apiRef.current?.getState();
        let tagList = apiTagRef.current?.getState();
        let limitList = apiLimitRef.current?.getState();


        if (itemPackage === undefined) {
            // Saving an item for the first time. 

            console.log(attributeList);

            let newPackageItem = {
                itemID: null,
                itemName: itemName,
                itemSize: selectedSize,
                modifierList: modifierSelections,
                taskList: Tasks,
                attributeList: structuredClone(attributeList.flatData),
                limitList: structuredClone(limitList.flatData),
                tagList: structuredClone(tagList.flatData)
            };

            console.log(JSON.stringify(newPackageItem));
        }



    }

    const handleDelete = () => {
        console.log("Delete Logic");
    }

    const handleNameChange = (event) => {
        setItemName(event.target.value);
    };

    const handleSizeChange = (event) => {
        setSelectedSize(event.target.value);

        itemsizesds.forEach((item, index) => {
            console.log(item.SizeName);
            console.log(item.BasePoints);
            if (item.SizeName == event.target.value) {
                setItemBasePoints(item.BasePoints);
                setItemIncrementPoints(item.IncrementPoints);
                setBaseCR(item.BaseCR);
                setBaseBody(item.BaseBody);

            }
        });
    };

    /* Tag Handles */

    const handleAddTag = () => {
        const newTagFields = [...tagFields, { value: '', rank: '1', type: '1' }];

        setTagFields(newTagFields); // Add a new field object
        calcTagBuildPoints(newTagFields);
    };

    const handleRemoveTag = (index) => {
        const newTagFields = [...tagFields];
        newTagFields.splice(index, 1); // Remove the field at the given index
        setTagFields(newTagFields);
        calcTagBuildPoints(newTagFields);
    };

    const handleTagChange = (index, event) => {
        const newTagFields = [...tagFields];
        newTagFields[index].value = event.target.value;
        setTagFields(newTagFields);
        calcTagBuildPoints(tagFields);
    };

    const handleTagRankChange = (index, event) => {
        const newTagFields = [...tagFields];
        newTagFields[index].rank = event.target.value;
        setTagFields(newTagFields);
        calcTagBuildPoints(tagFields);
    };

    const handleTagTypeChange = (index, event) => {
        const newTagFields = [...tagFields];
        newTagFields[index].type = event.target.value;
        setTagFields(newTagFields);
        calcTagBuildPoints(tagFields);
    };

    const handleModifierChange = (event) => {
        console.log(event);
        console.log(event.target.value);
        console.log(event.target.id);

        let modifierName = event.target.value;
        let modifierID = event.target.id;

        let newModifierSelection = structuredClone(modifierSelections);
        let currentModifier = {};

        currentModifier = newModifierSelection.find(modifier => {
            return modifier.modifierID == modifierID
        });

        if (currentModifier === undefined) {
            currentModifier = { modifierID: modifierID, modifierName: modifierName };

            newModifierSelection.push(currentModifier);
        } else {
            currentModifier.modifierName = modifierName;
        }

        setModifierSelections(newModifierSelection);
    };

    const handleTaskChange = (event) => {
        console.log(event);
        console.log(event.target.value);
        console.log(event.target.id);

        let taskName = event.target.value;
        let taskID = event.target.id;

        let newTaskText = structuredClone(taskText);
        let currentTask = {};

        currentTask = newTaskText.find(task => {
            return task.taskID == taskID
        });

        if (currentTask === undefined) {
            currentTask = { taskID: taskID, taskName: taskName };

            newTaskText.push(currentTask);
        } else {
            currentTask.taskName = taskName;
        }

        setTaskText(newTaskText);
    };

    const handleAttackChange = (event) => {
        console.log(event);
        console.log(event.target.value);
        console.log(event.target.id);

        let attackName = event.target.value;
        let attackID = event.target.id;

        let newAttackText = structuredClone(attackText);
        let currentAttack = {};

        currentAttack = newAttackText.find(attack => {
            return attack.attackID == attackID
        });

        if (currentAttack === undefined) {
            currentAttack = { attackID: attackID, attackName: attackName };

            newAttackText.push(currentAttack);
        } else {
            currentAttack.attackName = attackName;
        }

        setAttackText(newAttackText);
    };




    const calcTagBuildPoints = (tagList) => {
        let calcTotal = 0;

        try {
            tagList.forEach((item) => {
                calcTotal = calcTotal + (parseInt(item.rank) * parseInt(item.type) * 5);
            });
        } catch (e) {
            console.error(e.message);
        }


        setTagBP(calcTotal);
        tagBPRef.current = tagBP;
        calcTotalBP(calcTotal, attrBP, limitBP);




    };

    /* Attribute Handles */
    const handleAddAttribute = () => {
        const newAttriFields = [...attriFields, { attribute: '', scale: 'minor' }];

        setAttriFields(newAttriFields); // Add a new field object
        calcTagBuildPoints(tagFields);
    };

    const handleRemoveAttribute = (index) => {
        const newAttriFields = [...attriFields];
        newAttriFields.splice(index, 1); // Remove the field at the given index
        setAttriFields(newAttriFields);
        calcTagBuildPoints(tagFields);
    };

    const calcTotalBP = (tagPoints, attrPoints, limitPoints) => {
        let calcTotal = 0;
        let crTotal = baseCR;

        calcTotal = tagPoints + attrPoints + limitPoints;


        console.log(itemIncrementPoints);
        setTotalBP(calcTotal);
    };




    /*
        End Action Handles Section
    */



    /*
         Form Body
    */
    const attacksHDR = (attacks === undefined || attacks.length === 0 || attridd === undefined)
        ? ""
        : < tr >
            <th colspan="4"><hr></hr></th>
        </tr>
        ;

    const attacksTbl = (attacks === undefined || attacks.length === 0 || attridd === undefined)
        ? ""
        : <td colspan="4" class="itemContents">
            <table>
                <tbody>
                    <tr>
                        <td class="panel_table_left" colspan="3">Attacks: </td>

                    </tr>
                    {attacks.map((attack) => {
                        console.log("attack: ");
                        console.log(attack);

                        let attackID = parseInt(attack.AttributeName);
                        console.log("attackId: ");
                        console.log(attackID);

                        console.log("attridd");
                        console.log(attridd);

                        let attributeDtls = attridd.find(attribute => attribute.id === attackID);
                        console.log("attributeDtls: ");
                        console.log(attributeDtls);

                        let attackValue = "";

                        if (attackText !== undefined) {
                            let selection = attackText.find((searcher) => {
                                console.log(searcher.attackID);
                                console.log(attack.attackID);
                                return searcher.attackID == attack.attackID;
                            });

                            if (selection !== undefined) {
                                console.log("Attack Value");
                                console.log(selection.attackName);

                                attackValue = selection.attackName;
                            } else {
                                console.log("Attack selection not found.");
                                console.log(attackText);
                            }

                        } else {
                            console.log("attackText undefined.");
                        }

                        return (
                            <tbody>
                                <tr>
                                    <td class="panel_table_left">
                                        <input type="text" id={attack.attackID} key={attack.attackID} width="150px" onChange={handleAttackChange} defaultValue={attackValue} />
                                    </td>
                                    <td class="panel_table_left"> {attributeDtls.label} </td>
                                    <td class="panel_table_right"> {attack.attackRank} </td>
                                </tr>
                                {attack.attributes.map((attribute) => {
                                    console.log("Attribute Record:");
                                    console.log(attribute);

                                    let attributeRecord = attridd.find(attri => attri.id == attribute.id)
                                    let attributeName = ""

                                    if (attributeRecord !== undefined) {
                                        attributeName = attributeRecord.label;
                                    }

                                    return (
                                        <tr>
                                            <td class="panel_table_left">&nbsp;</td>
                                            <td class="panel_table_left">{attributeName}</td>
                                            <td class="panel_table_right">{attribute.Rank}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        );

                    })}
                </tbody>

            </table>
        </td>
        ;

    const tasksTbl = (tasks === undefined || taskText === undefined)
        ? ""
        : tasks.length === 0
            ? ""
            : <td colspan="2" class="itemContents">
                <table>
                    <tbody>
                        <tr>
                            <td class="panel_table_left">Tasks:</td>
                            <td class="panel_table_right">&nbsp;</td>
                        </tr>
                        {tasks.map((task) => {
                            let taskValue = "";

                            if (taskText !== undefined) {
                                let selection = taskText.find((searcher) => {
                                    console.log(searcher.taskID);
                                    console.log(task.taskID);
                                    return searcher.taskID == task.taskID;
                                });

                                if (selection !== undefined) {
                                    console.log("Task Value");
                                    console.log(selection.taskName);

                                    taskValue = selection.taskName;
                                } else {
                                    console.log("Task selection not found.")
                                    console.log(taskText);
                                }

                            } else {
                                console.log("taskText undefined.")
                            }

                            console.log(task);
                            return (
                                <tr>
                                    <td class="panel_table_left">
                                        <input type="text" id={task.taskID} key={task.taskID} width="150px" onChange={handleTaskChange} defaultValue={taskValue} />
                                    </td>
                                    <td class="panel_table_right">{task.taskRank}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </td>

        ;

    const modifiersTbl = (modifiers === undefined || skillsList === undefined || modifierSelections === undefined)
        ? ""
        : modifiers.length === 0
            ? ""
            : <td colspan="2" class="itemContents">
                <table>
                    <tbody>
                        <tr>
                            <td class="panel_table_left">Modifiers:</td>
                            <td class="panel_table_right">&nbsp;</td>
                        </tr>
                        {modifiers.map((modifier) => {
                            let modifierValue = "Animal Ken";

                            if (modifierSelections !== undefined) {
                                let selection = modifierSelections.find((searcher) => {
                                    console.log(searcher.modifierID);
                                    console.log(modifier.modifierID);
                                    return searcher.modifierID == modifier.modifierID;
                                });

                                if (selection !== undefined) {
                                    console.log("Modifier Value");
                                    console.log(selection.modifierName);

                                    modifierValue = selection.modifierName;
                                } else {
                                    console.log("Modifier selection not found.")
                                    console.log(modifierSelections);
                                }

                            } else {
                                console.log("ModifierSelections undefined.")
                            }

                            return (
                                <tr>
                                    <td class="panel_table_left">

                                        <select id={modifier.modifierID} onChange={handleModifierChange} value={modifierValue}>
                                            {skillsList.map((option) => {

                                                return (
                                                    <option key={option.skillID} value={option.skillName} width="150px;"  >
                                                        {option.skillName}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </td>
                                    <td class="panel_table_right">+{modifier.modifierRank}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </td>
        ;

    const powerSlotsTbl = itemPowerSlots === undefined
        ? ""
        : itemPowerSlots.length === 0
            ? ""
            : <tbody>
                <tr>
                    <td class="panel_table_left">Power Slots:</td>
                    <td class="panel_table_right">&nbsp;</td>
                </tr>
                {itemPowerSlots.map((powerScale) => {
                    return (
                        <tr>
                            <td class="panel_table_left">{powerScale.scaleName}:</td>
                            <td class="panel_table_right">{powerScale.used}/{powerScale.total}</td>
                        </tr>
                    );
                })}
            </tbody>
        ;

    const SystemBreakDownTbl = SystemBreakDown === undefined || itemattributesds === undefined
        ? ""
        : SystemBreakDown.length === 0
            ? ""
            : <table>
                <tbody>
                    <tr>
                        <td colspan="2"><hr></hr></td>
                    </tr>
                </tbody>
                {SystemBreakDown.map((system) => {
                    return (
                        <tbody>
                            <tr>
                                <td class="panel_table_left_system">{system.sysName}</td>
                                <td class="panel_table_right">&nbsp;</td>
                            </tr>
                            {system.sysAttributes.map((attribute) => {
                                console.log(attribute);
                                console.log(itemattributesds);
                                let attr = itemattributesds.find(AttributeDS => AttributeDS.AttributeID === attribute.AttributeName);
                                let scale = attributeScale.find(attrSc => attrSc.id === attribute.Scale);

                                let attrName = attr.AttributeName + ' (' + scale.label + ')';
                                console.log(attr);
                                console.log(scale);

                                return (
                                    <tr>
                                        <td class="panel_table_left_system">{attrName}</td>
                                        <td class="panel_table_right">{attribute.Rank}</td>
                                    </tr>
                                );
                            })}
                            <tr>
                                <td colspan="2"><hr></hr></td>
                            </tr>
                        </tbody>

                    );
                })}
            </table>
        ;

    const itemsizedd = (itemsizes === undefined || totalCR === undefined)
        ? <p><em>Data Retrieval In Progress...</em></p>
        : <div>
            <div>
                <div class="breakdown-left">Build Point Summary</div>
                <div class="breakdown-right">
                    <Button onClick={ExportToCVS} type="primary">[Export CSV]</Button>
                </div>
            </div>
                
            <table>
                <tbody>
                    <tr>
                        <td colspan="4">
                            <hr></hr>
                        </td>
                    </tr>
                </tbody>
                    <tbody>
                        <tr>
                            <td class="panel_table_left">Base Build Points: </td>
                            <td class="panel_table_right">{itemBasePoints}</td>
                            <td class="panel_table_left">Total Build Points:</td>
                            <td class="panel_table_right">{totalBP}</td>
                        </tr>    
                        <tr>
                            <td class="panel_table_left">Base Cost Rating:</td>
                            <td class="panel_table_right">{baseCR}</td>
                            <td class="panel_table_left"><b>Cost Rating: </b></td>
                            <td class="panel_table_right"><b>{totalCR}</b></td>
                        </tr>
                        <tr>
                            <td class="panel_table_left">Cost Rating Increment: </td>
                            <td class="panel_table_right">{itemIncrementPoints}</td>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <th colspan="4"><hr></hr></th>
                        </tr>
                        <tr>
                            <td colspan="2"> 
                                <table>
                                    <tbody>
                                        <tr>
                                            <td class="panel_table_left">Structure:</td>
                                            <td class="panel_table_right">&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td class="panel_table_left">
                                                Body: 
                                            </td>
                                            <td class="panel_table_right">
                                                {bodyRating}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="panel_table_left">
                                                Armor{itemArmorType}:
                                            </td>
                                            <td class="panel_table_right">
                                                {itemArmor}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="panel_table_left">
                                                Force Fields:
                                            </td>
                                            <td class="panel_table_right">
                                                {itemForceField}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                            <td colspan="2" class="itemContents">
                                <table>
                                    {powerSlotsTbl}
                                </table>
                            </td>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            <td colspan="4">
                                {SystemBreakDownTbl}
                            </td>
                        </tr>
                    </tbody>
                    <tbody>
                        <tr>
                            {modifiersTbl}
                            {tasksTbl}
                        </tr>
                        {attacksHDR}
                        <tr>
                            
                            {attacksTbl}
                    </tr>
                    <tr>
                        <th colspan="4"><hr></hr></th>
                    </tr>
                    </tbody>
                </table>
            </div>
        ;

    const tagSection = (tagGridData === undefined || gridTagCol === undefined)
        ? "" 
        : <WillowDark>
            <Grid data={tagGridData} columns={gridTagCol} ref={apiTagRef} init={tagInit} autoRowHeight reorder />

        </WillowDark>
        ;

    const attributeSection = (attriFields == undefined || itemattributesds == undefined || attriScale == undefined)
        ? <p><em>Loading... attributes missing</em></p>
        : <div class="section">
            <div class="item_header">
                <div class="item_header_left">
                    Attributes
                </div>
                <div class="item_header_right">
                    <Button onClick={addRow} type="primary">[+]</Button>&nbsp;
                    {/*<Button onClick={addSubRow} type="primary">[+>]</Button>&nbsp;*/}
                </div>
                <hr width="600px" align="left"></hr>
            </div>
            {/*<div>*/}
            {/*    <span class="system_span">Add System:</span> */}
            {/*    <input type="text" id="system_add_fld" name="system_add_fld" class="item_TextField" /> */}
            {/*    <Button onClick={addSystem} type="primary">[+]</Button>&nbsp;*/}
            {/*</div>*/}
            <div class="item_section">
                {console.log("Attribute Fields Length:")}
                {console.log(attriFields.length)}
                <WillowDark>
                    <Grid data={attriGridData} columns={attriGridCol} ref={apiRef} init={init} autoRowHeight reorder tree={true} />

                </WillowDark>

            </div>
          </div>
        ;

    const limitationSection = (minorLimitationCnt === undefined || moderateLimitationCnt === undefined || majorLimitationCnt === undefined)
        ? <div>
            <p>Design Limitations Loading...</p>
        </div>
        : <div class="limitationBody">
            <div> 
                <table>
                    <tbody>
                        <tr>
                            <td class="limitation_table">Minor: </td>
                            <td class="limitation_table" style={{ color: minorLimitationCnt > 3 ? "darkred" : "antiquewhite" }}>{minorLimitationCnt} / 3</td>
                            <td class="limitation_table" >Moderate: </td>
                            <td class="limitation_table" style={{ color: moderateLimitationCnt > 2 ? "darkred" : "antiquewhite" }}>{moderateLimitationCnt} / 2</td>
                            <td class="limitation_table">Major: </td>
                            <td class="limitation_table" style={{ color: majorLimitationCnt > 1 ? "darkred" : "antiquewhite" }}>{majorLimitationCnt} / 1</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <WillowDark>
                <Grid data={limitGridData} columns={gridLimCol} ref={apiLimitRef} init={limitInit} autoRowHeight />

            </WillowDark>
        </div>
        ;

    const itemsizeDataSet = itemsizesds === undefined
        ? <p><em>Loading... item size missing</em></p>
        : <div>
            &nbsp;
          </div>
        ;

    const itemsizeSelect = (itemsizes === undefined)
        ? <p><em>Loading... item size missing</em></p>
        : <select class="item_SelectField" id="ItemSize" name="ItemSize" value={selectedSize} onChange={handleSizeChange}>
            <option value="">--Please choose an Item Size--</option>
            {itemsizes.map((option) => {
                return (
                    <option key={option.key} value={option.value}>
                        {option.value}
                    </option>
                );
            })}
        </select>
        ;


    return (
        <div>
            <Starfield
                starCount={1000}
                starColor={[255, 255, 255]}
                speedFactor={0.01}
                backgroundColor="black"
            />            
            <div class="panel_header">
                <div class="top_panel">
                    Redemption Gear Creator
                </div>
            </div>

            <div class="panel_body">
                <div class="small_panel">
                    <div class="panel_title">
                        Panel.01
                    </div>
                    <p>Inventory</p>
                </div>
                <div class="large_panel">
                    <div class="panel_title">
                        Panel.02
                    </div>

                    <div class="item_name_field">
                        <div class="toolBar">
                            <Button type="primary" id="tags_add" onClick={handleSave}>[Save]</Button>&nbsp; 
                            <Button type="primary" id="tags_add" onClick={handleDelete}>[Delete]</Button>&nbsp; 
                        </div>
                        <table>
                            <tbody>
                                <tr>
                                    <td class="headerCellLeft">
                                        <label>Name </label>
                                        <input type="text" id="item_name_fld" name="item_name_fld" class="item_TextField" onChange={handleNameChange} />
                                    </td>
                                    <td class="headerCellRight">
                                        {itemsizeSelect}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="section_container">
                        <div class="section">
                            <div class="item_header">
                                <div class="item_header_left">
                                    Tags
                                </div>
                                <div class="item_header_right">
                                    <Button type="primary" id="tags_add" onClick={addTagRow}>[+]</Button>&nbsp;
                                </div>
                                <hr width="500px" align="left"></hr>
                            </div>
                            <div class="item_section">
                                {/*{tagFields.map((field, index) => (*/}
                                {/*    <div key={index} class="TagRow">*/}
                                {/*        <input*/}
                                {/*            type="text"*/}
                                {/*            value={field.value}*/}
                                {/*            onChange={(e) => handleTagChange(index, e)}*/}
                                {/*            class = "TagDesc"*/}
                                {/*        />*/}
                                {/*        &nbsp;*/}
                                {/*        <select width="50px" value={field.rank} onChange={(e) => handleTagRankChange(index, e)}>*/}
                                {/*            <option key="1" value="1" >1</option>*/}
                                {/*            <option key="2" value="2" >2</option>*/}
                                {/*            <option key="3" value="3" >3</option>*/}
                                {/*        </select> */}
                                {/*        &nbsp;*/}
                                {/*        <select value={field.type} onChange={(e) => handleTagTypeChange(index, e)}>*/}
                                {/*            <option key="1" value="1">Normal</option>*/}
                                {/*            <option key="2" value="2">Free</option>*/}
                                {/*        </select>*/}
                                {/*        &nbsp;*/}
                                {/*        <span class="TagRemoval">*/}
                                {/*            <Button onClick={() => handleRemoveTag(index)}>*/}
                                {/*                [ - ]*/}
                                {/*            </Button>*/}
                                {/*        </span>*/}
                                {/*    </div>*/}
                                {/*))} */}
                                {tagSection}
                            </div>
                        </div>
                        <br></br>

                        {attributeSection}

                        <div class="section">
                            <div class="item_header">
                                <div class="item_header_left">
                                    Limitations
                                </div>
                                <div class="item_header_right">
                                    <Button type="primary" onClick={addLimitRow} >[+]</Button>&nbsp;
                                </div>
                                <hr width="500px" align="left"></hr>
                            </div>
                            <div class="item_section">
                                {limitationSection}
                            </div>
                        </div>
                    </div>
                </div>



                <div class="large_panel">
                    <div class="panel_title">
                        Panel.03
                    </div>
                    {itemsizedd}
                    {itemsizeDataSet}
                </div>


                <WillowDark>
                    {tagToEdit && tagRank !== undefined ? (
                        <Editor
                            values={tagToEdit}
                            items={getEditorConfig(gridTagCol)}
                            topBar={{
                                items: [
                                    {
                                        comp: 'icon',
                                        icon: 'wxi-close',
                                        id: 'close',
                                    },
                                    { comp: 'spacer' },
                                    {
                                        comp: 'button',
                                        type: 'danger',
                                        text: 'Delete',
                                        id: 'delete',
                                    },
                                    {
                                        comp: 'button',
                                        type: 'primary',
                                        text: 'Save',
                                        id: 'save',
                                    },
                                ],
                            }}
                            placement="sidebar"
                            onSave={({ values }) => {
                                if (apiTagRef.current) {
                                    apiTagRef.current.exec('update-row', {
                                        id: tagToEdit.id,
                                        row: values,
                                    });
                                }
                            }}
                            onAction={({ item }) => {
                                if (item.id === 'delete' && apiTagRef.current) {
                                    apiTagRef.current.exec('delete-row', { id: tagToEdit.id });
                                }
                                if (item.comp) setTagToEdit(null);
                            }}
                        />
                    ) : null}

                    {limitToEdit && attriScale !== undefined ? (
                        <Editor
                            values={limitToEdit}
                            items={getEditorConfig(gridLimCol)}
                            topBar={{
                                items: [
                                    {
                                        comp: 'icon',
                                        icon: 'wxi-close',
                                        id: 'close',
                                    },
                                    { comp: 'spacer' },
                                    {
                                        comp: 'button',
                                        type: 'danger',
                                        text: 'Delete',
                                        id: 'delete',
                                    },
                                    {
                                        comp: 'button',
                                        type: 'primary',
                                        text: 'Save',
                                        id: 'save',
                                    },
                                ],
                            }}
                            placement="sidebar"
                            onSave={({ values }) => {
                                if (apiLimitRef.current) {
                                    apiLimitRef.current.exec('update-row', {
                                        id: limitToEdit.id,
                                        row: values,
                                    });
                                }
                            }}
                            onAction={({ item }) => {
                                if (item.id === 'delete' && apiLimitRef.current) {
                                    apiLimitRef.current.exec('delete-row', { id: limitToEdit.id });
                                }
                                if (item.comp) setLimitToEdit(null);
                            }}
                        />
                    ) : null}

                    {dataToEdit && attriScale !== undefined ? (
                        <Editor
                            values={dataToEdit}
                            items={getEditorConfig(attriGridCol)}
                            topBar={{
                                items: [
                                    {
                                        comp: 'icon',
                                        icon: 'wxi-close',
                                        id: 'close',
                                    },
                                    { comp: 'spacer' },
                                    {
                                        comp: 'button',
                                        type: 'danger',
                                        text: 'Delete',
                                        id: 'delete',
                                    },
                                    {
                                        comp: 'button',
                                        type: 'primary',
                                        text: 'Save',
                                        id: 'save',
                                    },
                                ],
                            }}
                            placement="sidebar"
                            onSave={({ values }) => {
                                if (apiRef.current) {
                                    apiRef.current.exec('update-row', {
                                        id: dataToEdit.id,
                                        row: values,
                                    });
                                }
                            }}
                            onAction={({ item }) => {
                                if (item.id === 'delete' && apiRef.current) {
                                    apiRef.current.exec('delete-row', { id: dataToEdit.id });
                                }
                                if (item.comp) setDataToEdit(null);
                            }}
                        />
                    ) : null}
                </WillowDark>


            </div>
        </div>
    );


    /*
        Database Fetch Section 
    */
    async function requestCVS(item) {
        let jsonItem = JSON.stringify(item);
        console.log(jsonItem);
        let uriItem = encodeURIComponent(jsonItem);
        console.log(uriItem);

        try {
            const response = await fetch('itemcreator/exportitemtocvs/download?item=' + uriItem);

            // 1. Convert response to a blob
            const blob = await response.blob();

            // 2. Create a temporary URL for the blob
            const url = window.URL.createObjectURL(blob);

            // 3. Create a hidden 'a' element and click it
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', item.itemName + '.csv'); // Specify file name
            document.body.appendChild(link);
            link.click();

            // 4. Clean up: remove the link and revoke the URL to free memory
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
        }
        
    }


    async function populateItemSizesData() {
        try {
            const response = await fetch('itemcreator/getitemsizes/');
            if (response.ok) {
                const data = await response.json();

                const results = [] 
                console.log(Object.keys(data));
                Object.keys(data).forEach(key => {
                    results.push({
                        key: key, 
                        value: data[key]
                    });
                });

                //console.log(data);
                //console.log(results);
                setItemsizes(results);
                console.log(itemsizes);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    async function populateItemSizesDataSet() {
        try {
            const response = await fetch('itemcreator/getitemsizesds/');
            if (response.ok) {
                const data = await response.json();

                console.log(data);
                setItemsizesDS(data);
                console.log(itemsizesds);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    async function populateItemAttributesDataSet() {
        try {
            const response = await fetch('itemcreator/getitemattributesds/');
            if (response.ok) {
                const data = await response.json();
                let attributeList = [];
                let tmpAttackList = [];

                console.log(data);
                setItemAttributesDS(data);

                data.forEach((attribute) => {
                    attributeList.push({ id: attribute.AttributeID, label: attribute.AttributeName });
                    if (attribute.AttributeName.includes("Attack"))
                    {
                        tmpAttackList.push(attribute.AttributeID);
                    }

                })

                setAttackList(tmpAttackList);

                let gridCol = [
                    { id: "id", flexgrow: 1, hidden: true },
                    {
                        id: "AttributeSystem", 
                        width: 100, 
                        header: "System", 
                        footer: "System", 
                        editor: {
                            type: "richselect",
                            config: { template: (option) => `${option.label}` },
                        },
                        options: systemList
                    },
                    {
                        id: "AttributeName",
                        width: 154,
                        treetoggle: true,
                        header: "Attribute",
                        footer: "Attribute",
                        editor: {
                            type: "richselect",
                            config: { template: (option) => `${option.label}` },
                        },
                        options: attributeList, 

                    },
                    {
                        id: "Scale", header: "Scale", footer: "Scale", width: 100,
                        editor: {
                            type: "richselect",
                            config: { template: (option) => `${option.label}` },
                        },
                        options: attributeScale

                    },
                    { id: "Rank", header: "Rank", footer: "Rank", width:75, editor: "text" },
                    { id: "BuildPoints", header: "BP Cost", footer: "BP Cost", width: 75 }, 
                    { id: "PowerSlots", header: "Power Slots", footer: "Power Slots", width: 95}
                ];

                console.log(attributeList);
                setAttriDD(attributeList);
                console.log(itemattributesds);

                setAttriGridCol(gridCol);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    async function populateAttributeScaleDataSet() {
        try {
            const response = await fetch('itemcreator/getattributescaleds/');
            if (response.ok) {
                const data = await response.json();

                console.log(data);
                setAttriScale(data);
                console.log(attriScale);

                return data;
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        return undefined;
    }

    async function populateSkillsDataSet() {
        try {
            const response = await fetch('itemcreator/getskillsds/');
            if (response.ok) {
                const data = await response.json();

                console.log(data);
                setSkillsList(data);
                console.log(attriScale);

                return data;
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }

        return undefined;
    }


    /*
        End Database Fetch Section 
    */

}

export default App;