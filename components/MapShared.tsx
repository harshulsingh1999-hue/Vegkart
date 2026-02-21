
import React from 'react';

export const MAP_STYLES = {
    water: '#aadaff',
    land: '#eef0f3',
    park: '#c5e8c5',
    building: '#e1e3e6',
    buildingStroke: '#d6d6d6',
    roadOutline: '#ffffff',
    roadFill: '#ffffff', 
    roadStroke: '#dadce0',
    mainRoadFill: '#f8c967',
    routeLine: '#4285F4',
    routeHalo: 'rgba(66, 133, 244, 0.25)',
    textRoad: '#5f6368',
    textLabel: '#202124',
    textColony: '#9aa0a6'
};

interface CityBlockProps {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'park' | 'building' | string;
    label?: string;
}

export const CityBlock: React.FC<CityBlockProps> = React.memo(({ x, y, width, height, type, label }) => {
    const isPark = type === 'park';
    const fill = isPark ? MAP_STYLES.park : MAP_STYLES.building;
    const stroke = isPark ? 'none' : MAP_STYLES.buildingStroke;
    const depth = isPark ? 0 : (width * 0.05);

    return (
        <g>
            {!isPark && depth > 0 && (
                <path d={`M ${x} ${y+height} L ${x+width} ${y+height} L ${x+width} ${y+height+depth} L ${x} ${y+height+depth} Z`} fill="#c8c8c8" />
            )}
            <rect x={x} y={y} width={width} height={height} rx={isPark ? 2 : 0.5} fill={fill} stroke={stroke} strokeWidth={isPark ? 0 : 0.2} />
            {label && !isPark && width > 10 && (
                <text x={x + width/2} y={y + height/2} fontSize="2.5" fill="#70757a" textAnchor="middle" dominantBaseline="middle" fontWeight="500" style={{ pointerEvents: 'none', userSelect: 'none' }}>{label}</text>
            )}
        </g>
    );
});

// --- SHARED GENERATOR LOGIC ---
export interface GeneratedCity {
    blocks: { id?: string, x: number, y: number, w: number, h: number, type: string, label?: string }[];
    roads: { x1: number, y1: number, x2: number, y2: number, width: number, isMain?: boolean, name?: string, isVertical?: boolean }[];
}

export const generateCityLayout = (pincode: string, options: { cols?: number, rows?: number, gap?: number } = {}): GeneratedCity => {
    const { cols = 5, rows = 5, gap = 8 } = options;
    
    // Deterministic RNG based on pincode
    let seed = 0;
    for (let i = 0; i < pincode.length; i++) seed += pincode.charCodeAt(i);
    const rng = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };

    const blocks = [];
    const roads = [];
    
    const roadNamesH = ["MG Road", "Station Rd", "Market St", "High St", "Link Rd", "Temple Ln"];
    const roadNamesV = ["1st Ave", "Park Ave", "Central Ave", "North Ave", "5th Cross", "Main St"];
    const bldNames = ["Mall", "Hosp", "School", "Lib", "Plaza"];

    const cellW = (100 - (cols + 1) * gap) / cols;
    const cellH = (100 - (rows + 1) * gap) / rows;

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const x = gap + c * (cellW + gap);
            const y = gap + r * (cellH + gap);
            const isPark = rng() > 0.8;
            
            // 90% chance to exist (some empty lots)
            if (rng() > 0.1) {
                let label = '';
                if (!isPark && rng() > 0.7) label = bldNames[Math.floor(rng() * bldNames.length)];
                blocks.push({ id: `b-${c}-${r}`, x, y, w: cellW, h: cellH, type: isPark ? 'park' : 'building', label });
            }
        }
    }
    
    for(let r=0; r<=rows; r++) {
        const isMain = r === Math.floor(rows/2);
        roads.push({ 
            x1: 0, y1: r*(cellH+gap) + gap/2, x2: 100, y2: r*(cellH+gap) + gap/2, 
            width: isMain ? gap * 1.2 : gap, 
            isMain, 
            name: roadNamesH[r % roadNamesH.length] 
        });
    }
    for(let c=0; c<=cols; c++) {
        const isMain = c === Math.floor(cols/2);
        roads.push({ 
            x1: c*(cellW+gap) + gap/2, y1: 0, x2: c*(cellW+gap) + gap/2, y2: 100, 
            width: isMain ? gap * 1.2 : gap, 
            isMain, 
            name: roadNamesV[c % roadNamesV.length], 
            isVertical: true 
        });
    }

    return { blocks, roads };
};
