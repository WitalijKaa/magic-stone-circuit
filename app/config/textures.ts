export let textureTrick = {

    changeSize(size: number) {
        if (8 == size) { size = 16; }
        let sizeKey = 32 == size ? 'size32' : 'size16';

        let constanta = {};

        for (const baseName in ALL_TEXTURES[sizeKey]) {
            constanta[baseName] = ALL_TEXTURES[sizeKey][baseName];
        }
        // @ts-ignore
        window.tpConst = constanta;
    },

    getAll() {
        let response = {};
        for (const baseName in ALL_TEXTURES.size32) {
            response[baseName + '32'] = ALL_TEXTURES.size32[baseName];
        }
        for (const baseName in ALL_TEXTURES.size16) {
            response[baseName + '16'] = ALL_TEXTURES.size16[baseName];
        }
        return response;
    },
};

export const ALL_TEXTURES = {
    size32: {
        zoneCenter: 'resources/32/cursor.png',
        zoneSide: 'resources/32/cursor_side.png',
        stoneV: 'resources/32/SV.png',
        stoneR: 'resources/32/SR.png',
        stoneI: 'resources/32/SI.png',
        stoneO: 'resources/32/SO.png',
        cell: 'resources/32/cell.png',
        roadL: 'resources/32/R_left.png',
        roadR: 'resources/32/R_right.png',
        roadH: 'resources/32/R_heavy.png',
        roadLV: 'resources/32/RV_left.png',
        roadRV: 'resources/32/RV_right.png',
        roadHV: 'resources/32/RV_heavy.png',
        roadLR: 'resources/32/RR_left.png',
        roadRR: 'resources/32/RR_right.png',
        roadHR: 'resources/32/RR_heavy.png',
        roadLI: 'resources/32/RI_left.png',
        roadRI: 'resources/32/RI_right.png',
        roadHI: 'resources/32/RI_heavy.png',
        roadLO: 'resources/32/RO_left.png',
        roadRO: 'resources/32/RO_right.png',
        roadHO: 'resources/32/RO_heavy.png',
        semiAwake: 'resources/32/T_awake.png',
        semiAwakeV: 'resources/32/TV_awake.png',
        semiAwakeR: 'resources/32/TR_awake.png',
        semiAwakeI: 'resources/32/TI_awake.png',
        semiAwakeO: 'resources/32/TO_awake.png',
        semiCharge: 'resources/32/T_charge.png',
        semiChargeV: 'resources/32/TV_charge.png',
        semiChargeR: 'resources/32/TR_charge.png',
        semiChargeI: 'resources/32/TI_charge.png',
        semiChargeO: 'resources/32/TO_charge.png',
        semiFlow: 'resources/32/T_flow.png',
        semiFlowV: 'resources/32/TV_flow.png',
        semiFlowR: 'resources/32/TR_flow.png',
        semiFlowI: 'resources/32/TI_flow.png',
        semiFlowO: 'resources/32/TO_flow.png',
        trigger: 'resources/32/M.png',
        triggerV: 'resources/32/MV.png',
        triggerR: 'resources/32/MR.png',
        triggerI: 'resources/32/MI.png',
        triggerO: 'resources/32/MO.png',
        sleepAwake: 'resources/32/W_awake.png',
        sleepAwakeV: 'resources/32/WV_awake.png',
        sleepAwakeR: 'resources/32/WR_awake.png',
        sleepAwakeI: 'resources/32/WI_awake.png',
        sleepAwakeO: 'resources/32/WO_awake.png',
        sleepCharge: 'resources/32/W_charge.png',
        sleepChargeV: 'resources/32/WV_charge.png',
        sleepChargeR: 'resources/32/WR_charge.png',
        sleepChargeI: 'resources/32/WI_charge.png',
        sleepChargeO: 'resources/32/WO_charge.png',
        sleepFlow: 'resources/32/W_flow.png',
        sleepFlowV: 'resources/32/WV_flow.png',
        sleepFlowR: 'resources/32/WR_flow.png',
        sleepFlowI: 'resources/32/WI_flow.png',
        sleepFlowO: 'resources/32/WO_flow.png',
        sleepFlowTurn: 'resources/32/WT_flow.png',
        sleepFlowVTurn: 'resources/32/WVT_flow.png',
        sleepFlowRTurn: 'resources/32/WRT_flow.png',
        sleepFlowITurn: 'resources/32/WIT_flow.png',
        sleepFlowOTurn: 'resources/32/WOT_flow.png',
        switcher: 'resources/32/road_switcher.png',
        smile: 'resources/32/smile.png',
    },
    size16: {
        zoneCenter: 'resources/16/cursor.png',
        zoneSide: 'resources/16/cursor_side.png',
        stoneV: 'resources/16/SV.png',
        stoneR: 'resources/16/SR.png',
        stoneI: 'resources/16/SI.png',
        stoneO: 'resources/16/SO.png',
        cell: 'resources/16/cell.png',
        roadL: 'resources/16/R_left.png',
        roadR: 'resources/16/R_right.png',
        roadH: 'resources/16/R_heavy.png',
        roadLV: 'resources/16/RV_left.png',
        roadRV: 'resources/16/RV_right.png',
        roadHV: 'resources/16/RV_heavy.png',
        roadLR: 'resources/16/RR_left.png',
        roadRR: 'resources/16/RR_right.png',
        roadHR: 'resources/16/RR_heavy.png',
        roadLI: 'resources/16/RI_left.png',
        roadRI: 'resources/16/RI_right.png',
        roadHI: 'resources/16/RI_heavy.png',
        roadLO: 'resources/16/RO_left.png',
        roadRO: 'resources/16/RO_right.png',
        roadHO: 'resources/16/RO_heavy.png',
        semiAwake: 'resources/16/T_awake.png',
        semiAwakeV: 'resources/16/TV_awake.png',
        semiAwakeR: 'resources/16/TR_awake.png',
        semiAwakeI: 'resources/16/TI_awake.png',
        semiAwakeO: 'resources/16/TO_awake.png',
        semiCharge: 'resources/16/T_charge.png',
        semiChargeV: 'resources/16/TV_charge.png',
        semiChargeR: 'resources/16/TR_charge.png',
        semiChargeI: 'resources/16/TI_charge.png',
        semiChargeO: 'resources/16/TO_charge.png',
        semiFlow: 'resources/16/T_flow.png',
        semiFlowV: 'resources/16/TV_flow.png',
        semiFlowR: 'resources/16/TR_flow.png',
        semiFlowI: 'resources/16/TI_flow.png',
        semiFlowO: 'resources/16/TO_flow.png',
        trigger: 'resources/16/M.png',
        triggerV: 'resources/16/MV.png',
        triggerR: 'resources/16/MR.png',
        triggerI: 'resources/16/MI.png',
        triggerO: 'resources/16/MO.png',
        sleepAwake: 'resources/16/W_awake.png',
        sleepAwakeV: 'resources/16/WV_awake.png',
        sleepAwakeR: 'resources/16/WR_awake.png',
        sleepAwakeI: 'resources/16/WI_awake.png',
        sleepAwakeO: 'resources/16/WO_awake.png',
        sleepCharge: 'resources/16/W_charge.png',
        sleepChargeV: 'resources/16/WV_charge.png',
        sleepChargeR: 'resources/16/WR_charge.png',
        sleepChargeI: 'resources/16/WI_charge.png',
        sleepChargeO: 'resources/16/WO_charge.png',
        sleepFlow: 'resources/16/W_flow.png',
        sleepFlowV: 'resources/16/WV_flow.png',
        sleepFlowR: 'resources/16/WR_flow.png',
        sleepFlowI: 'resources/16/WI_flow.png',
        sleepFlowO: 'resources/16/WO_flow.png',
        sleepFlowTurn: 'resources/16/WT_flow.png',
        sleepFlowVTurn: 'resources/16/WVT_flow.png',
        sleepFlowRTurn: 'resources/16/WRT_flow.png',
        sleepFlowITurn: 'resources/16/WIT_flow.png',
        sleepFlowOTurn: 'resources/16/WOT_flow.png',
        switcher: 'resources/16/road_switcher.png',
        smile: 'resources/16/smile.png',
    },
} as const;

// @ts-ignore
if (!window.tpConst) {
// @ts-ignore
    textureTrick.changeSize(32);
}

// @ts-ignore
export let TT = window.tpConst;