export let textureTrick = {

    changeSize(size: number) {
        let constanta = {};
        for (const baseName in TEXTURES) {
            constanta[baseName] = TEXTURES[baseName].replace('/----/', '/' + size + '/');
        }
        // @ts-ignore
        window.tpConst = constanta;
    },

    getAll() {
        let response = {};
        for (const size of ['8', '16', '32']) {
            for (const baseName in TEXTURES) {
                response[baseName + size] = TEXTURES[baseName].replace('/----/', '/' + size + '/');
            }
        }
        return response;
    },
};

const TEXTURES = {
    zoneCenter: 'resources/----/cursor.png',
    zoneSide: 'resources/----/cursor_side.png',
    stoneV: 'resources/----/SV.png',
    stoneR: 'resources/----/SR.png',
    stoneI: 'resources/----/SI.png',
    stoneO: 'resources/----/SO.png',
    cell: 'resources/----/cell.png',
    roadL: 'resources/----/R_left.png',
    roadR: 'resources/----/R_right.png',
    roadH: 'resources/----/R_heavy.png',
    roadLV: 'resources/----/RV_left.png',
    roadRV: 'resources/----/RV_right.png',
    roadHV: 'resources/----/RV_heavy.png',
    roadLR: 'resources/----/RR_left.png',
    roadRR: 'resources/----/RR_right.png',
    roadHR: 'resources/----/RR_heavy.png',
    roadLI: 'resources/----/RI_left.png',
    roadRI: 'resources/----/RI_right.png',
    roadHI: 'resources/----/RI_heavy.png',
    roadLO: 'resources/----/RO_left.png',
    roadRO: 'resources/----/RO_right.png',
    roadHO: 'resources/----/RO_heavy.png',
    semiAwake: 'resources/----/T_awake.png',
    semiAwakeV: 'resources/----/TV_awake.png',
    semiAwakeR: 'resources/----/TR_awake.png',
    semiAwakeI: 'resources/----/TI_awake.png',
    semiAwakeO: 'resources/----/TO_awake.png',
    semiCharge: 'resources/----/T_charge.png',
    semiChargeV: 'resources/----/TV_charge.png',
    semiChargeR: 'resources/----/TR_charge.png',
    semiChargeI: 'resources/----/TI_charge.png',
    semiChargeO: 'resources/----/TO_charge.png',
    semiFlow: 'resources/----/T_flow.png',
    semiFlowV: 'resources/----/TV_flow.png',
    semiFlowR: 'resources/----/TR_flow.png',
    semiFlowI: 'resources/----/TI_flow.png',
    semiFlowO: 'resources/----/TO_flow.png',
    trigger: 'resources/----/M.png',
    triggerV: 'resources/----/MV.png',
    triggerR: 'resources/----/MR.png',
    triggerI: 'resources/----/MI.png',
    triggerO: 'resources/----/MO.png',
    sleepAwake: 'resources/----/W_awake.png',
    sleepAwakeV: 'resources/----/WV_awake.png',
    sleepAwakeR: 'resources/----/WR_awake.png',
    sleepAwakeI: 'resources/----/WI_awake.png',
    sleepAwakeO: 'resources/----/WO_awake.png',
    sleepCharge: 'resources/----/W_charge.png',
    sleepChargeV: 'resources/----/WV_charge.png',
    sleepChargeR: 'resources/----/WR_charge.png',
    sleepChargeI: 'resources/----/WI_charge.png',
    sleepChargeO: 'resources/----/WO_charge.png',
    sleepFlow: 'resources/----/W_flow.png',
    sleepFlowV: 'resources/----/WV_flow.png',
    sleepFlowR: 'resources/----/WR_flow.png',
    sleepFlowI: 'resources/----/WI_flow.png',
    sleepFlowO: 'resources/----/WO_flow.png',
    sleepFlowTurn: 'resources/----/WT_flow.png',
    sleepFlowVTurn: 'resources/----/WVT_flow.png',
    sleepFlowRTurn: 'resources/----/WRT_flow.png',
    sleepFlowITurn: 'resources/----/WIT_flow.png',
    sleepFlowOTurn: 'resources/----/WOT_flow.png',
    speed: 'resources/----/F.png',
    speedV: 'resources/----/FV.png',
    speedR: 'resources/----/FR.png',
    speedI: 'resources/----/FI.png',
    speedO: 'resources/----/FO.png',
    border: 'resources/----/border.png',
    borderCorner: 'resources/----/border_corner.png',
    switcher: 'resources/----/road_switcher.png',
    smile: 'resources/----/smile.png',
}

// @ts-ignore
if (!window.tpConst) {
// @ts-ignore
    textureTrick.changeSize(32);
}

// @ts-ignore
export let TT = window.tpConst;