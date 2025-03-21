"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Slider from "@/components/ui/slider";

type MixBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

interface SkryrLayerPanelProps {
    showLayerPanel: boolean;
    setShowLayerPanel: React.Dispatch<React.SetStateAction<boolean>>;
    milkdropBlendMode: MixBlendMode;
    setMilkdropBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    matrixBlendMode: MixBlendMode;
    setMatrixBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    asciiBlendMode: MixBlendMode;
    setAsciiBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    allMediaBlendMode: MixBlendMode;
    setAllMediaBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
    milkdropOpacity: number;
    setMilkdropOpacity: React.Dispatch<React.SetStateAction<number>>;
    matrixOpacity: number;
    setMatrixOpacity: React.Dispatch<React.SetStateAction<number>>;
    asciiOpacity: number;
    setAsciiOpacity: React.Dispatch<React.SetStateAction<number>>;
    allMediaOpacity: number;
    setAllMediaOpacity: React.Dispatch<React.SetStateAction<number>>;
    milkdropGamma: number;
    setMilkdropGamma: React.Dispatch<React.SetStateAction<number>>;
    matrixGamma: number;
    setMatrixGamma: React.Dispatch<React.SetStateAction<number>>;
    asciiGamma: number;
    setAsciiGamma: React.Dispatch<React.SetStateAction<number>>;
    allMediaGamma: number;
    setAllMediaGamma: React.Dispatch<React.SetStateAction<number>>;
    milkdropSaturation: number;
    setMilkdropSaturation: React.Dispatch<React.SetStateAction<number>>;
    matrixSaturation: number;
    setMatrixSaturation: React.Dispatch<React.SetStateAction<number>>;
    asciiSaturation: number;
    setAsciiSaturation: React.Dispatch<React.SetStateAction<number>>;
    allMediaSaturation: number;
    setAllMediaSaturation: React.Dispatch<React.SetStateAction<number>>;
    layerOrder: string[];
    setLayerOrder: React.Dispatch<React.SetStateAction<string[]>>;
    backgroundEnabled: boolean;
    setBackgroundEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    matrixEnabled: boolean;
    setMatrixEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    asciiEnabled: boolean;
    setAsciiEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const SkryrLayerPanel: React.FC<SkryrLayerPanelProps> = ({
    showLayerPanel,
    setShowLayerPanel,
    milkdropBlendMode,
    setMilkdropBlendMode,
    matrixBlendMode,
    setMatrixBlendMode,
    asciiBlendMode,
    setAsciiBlendMode,
    allMediaBlendMode,
    setAllMediaBlendMode,
    milkdropOpacity,
    setMilkdropOpacity,
    matrixOpacity,
    setMatrixOpacity,
    asciiOpacity,
    setAsciiOpacity,
    allMediaOpacity,
    setAllMediaOpacity,
    milkdropGamma,
    setMilkdropGamma,
    matrixGamma,
    setMatrixGamma,
    asciiGamma,
    setAsciiGamma,
    allMediaGamma,
    setAllMediaGamma,
    milkdropSaturation,
    setMilkdropSaturation,
    matrixSaturation,
    setMatrixSaturation,
    asciiSaturation,
    setAsciiSaturation,
    allMediaSaturation,
    setAllMediaSaturation,
    layerOrder,
    setLayerOrder,
    backgroundEnabled,
    setBackgroundEnabled,
    matrixEnabled,
    setMatrixEnabled,
    asciiEnabled,
    setAsciiEnabled,
}) => {
    const blendModeOptions: MixBlendMode[] = [
        'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
        'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
        'exclusion', 'hue', 'saturation', 'color', 'luminosity'
    ];

    const moveLayerUp = (layer: string) => {
        setLayerOrder((prev) => {
            const index = prev.indexOf(layer);
            if (index > 0) {
                const newOrder = [...prev];
                [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                return newOrder;
            }
            return prev;
        });
    };

    const moveLayerDown = (layer: string) => {
        setLayerOrder((prev) => {
            const index = prev.indexOf(layer);
            if (index < prev.length - 1) {
                const newOrder = [...prev];
                [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                return newOrder;
            }
            return prev;
        });
    };

    const LayerControls = ({ layer, blendMode, setBlendMode, opacity, setOpacity, gamma, setGamma, saturation, setSaturation }: {
        layer: string;
        blendMode: MixBlendMode;
        setBlendMode: React.Dispatch<React.SetStateAction<MixBlendMode>>;
        opacity: number;
        setOpacity: React.Dispatch<React.SetStateAction<number>>;
        gamma: number;
        setGamma: React.Dispatch<React.SetStateAction<number>>;
        saturation: number;
        setSaturation: React.Dispatch<React.SetStateAction<number>>;
    }) => (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span>{layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
                <div className="flex gap-1">
                    <Button
                        onClick={() => moveLayerUp(layer)}
                        disabled={layerOrder.indexOf(layer) === 0}
                        className="w-6 h-6 text-sm border-2 border-current text-gray-500 hover:bg-gray-700 disabled:opacity-50"
                        title="Move Up"
                    >
                        <i className="fa-solid fa-arrow-up" />
                    </Button>
                    <Button
                        onClick={() => moveLayerDown(layer)}
                        disabled={layerOrder.indexOf(layer) === layerOrder.length - 1}
                        className="w-6 h-6 text-sm border-2 border-current text-gray-500 hover:bg-gray-700 disabled:opacity-50"
                        title="Move Down"
                    >
                        <i className="fa-solid fa-arrow-down" />
                    </Button>
                </div>
            </div>
            <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as MixBlendMode)}
                className="w-full p-1 text-xs bg-gray-800 text-white border border-gray-600 rounded"
            >
                {blendModeOptions.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                ))}
            </select>
            <div className="flex items-center gap-1">
                <i className="fa-solid fa-eye-slash text-xs" />
                <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[opacity]}
                    onValueChange={(value) => setOpacity(value[0])}
                    className="w-full h-4"
                />
            </div>
            <div className="flex items-center gap-1">
                <i className="fa-solid fa-sun text-xs" />
                <Slider
                    min={0}
                    max={2}
                    step={0.01}
                    value={[gamma]}
                    onValueChange={(value) => setGamma(value[0])}
                    className="w-full h-4"
                />
            </div>
            <div className="flex items-center gap-1">
                <i className="fa-solid fa-droplet text-xs" />
                <Slider
                    min={0}
                    max={2}
                    step={0.01}
                    value={[saturation]}
                    onValueChange={(value) => setSaturation(value[0])}
                    className="w-full h-4"
                />
            </div>
        </div>
    );

    return (
        <div
            className={`fixed top-0 right-0 w-64 h-full bg-gray-900 p-4 z-[100] transition-transform duration-300 ${showLayerPanel ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Layer & Effects</h2>
                <Button
                    onClick={() => setShowLayerPanel(false)}
                    className="w-8 h-8 text-xl text-gray-500 hover:bg-gray-700"
                    title="Close Layer Panel"
                >
                    <i className="fa-solid fa-times" />
                </Button>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto h-[calc(100%-4rem)]">
                {/* Effect Toggles */}
                <div className="flex flex-col gap-2">
                    <Button
                        onClick={() => setBackgroundEnabled((prev) => !prev)}
                        className={`w-full h-8 text-sm ${backgroundEnabled ? "border-2 border-green-500 text-green-500" : "border-0 text-gray-500"} hover:bg-gray-700`}
                        title="Toggle Visualizer (F9)"
                    >
                        <i className="fa-solid fa-music mr-2" /> Visualizer
                    </Button>
                    <Button
                        onClick={() => setMatrixEnabled((prev) => !prev)}
                        className={`w-full h-8 text-sm ${matrixEnabled ? "border-2 border-green-500 text-green-500" : "border-0 text-gray-500"} hover:bg-gray-700`}
                        title="Toggle Matrix Mode (F8)"
                    >
                        <i className="fa-solid fa-globe mr-2" /> Matrix
                    </Button>
                    <Button
                        onClick={() => setAsciiEnabled((prev) => !prev)}
                        className={`w-full h-8 text-sm ${asciiEnabled ? "border-2 border-green-500 text-green-500" : "border-0 text-gray-500"} hover:bg-gray-700`}
                        title="Toggle ASCII Mode (F7)"
                    >
                        <i className="fa-solid fa-theater-masks mr-2" /> ASCII
                    </Button>
                </div>
                {/* Layer Controls */}
                <LayerControls
                    layer="milkdrop"
                    blendMode={milkdropBlendMode}
                    setBlendMode={setMilkdropBlendMode}
                    opacity={milkdropOpacity}
                    setOpacity={setMilkdropOpacity}
                    gamma={milkdropGamma}
                    setGamma={setMilkdropGamma}
                    saturation={milkdropSaturation}
                    setSaturation={setMilkdropSaturation}
                />
                <LayerControls
                    layer="matrix"
                    blendMode={matrixBlendMode}
                    setBlendMode={setMatrixBlendMode}
                    opacity={matrixOpacity}
                    setOpacity={setMatrixOpacity}
                    gamma={matrixGamma}
                    setGamma={setMatrixGamma}
                    saturation={matrixSaturation}
                    setSaturation={setMatrixSaturation}
                />
                <LayerControls
                    layer="ascii"
                    blendMode={asciiBlendMode}
                    setBlendMode={setAsciiBlendMode}
                    opacity={asciiOpacity}
                    setOpacity={setAsciiOpacity}
                    gamma={asciiGamma}
                    setGamma={setAsciiGamma}
                    saturation={asciiSaturation}
                    setSaturation={setAsciiSaturation}
                />
                <LayerControls
                    layer="allMedia"
                    blendMode={allMediaBlendMode}
                    setBlendMode={setAllMediaBlendMode}
                    opacity={allMediaOpacity}
                    setOpacity={setAllMediaOpacity}
                    gamma={allMediaGamma}
                    setGamma={setAllMediaGamma}
                    saturation={allMediaSaturation}
                    setSaturation={setAllMediaSaturation}
                />
            </div>
        </div>
    );
};

export default SkryrLayerPanel;