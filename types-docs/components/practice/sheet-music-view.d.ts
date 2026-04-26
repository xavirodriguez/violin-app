/**
 * Display for musical notation using OpenSheetMusicDisplay.
 */
export declare function SheetMusicView({ musicXML, isReady, error, containerRef, }: {
    musicXML?: string;
    isReady: boolean;
    error: string | undefined;
    containerRef: React.RefObject<HTMLDivElement | null>;
}): import("react/jsx-runtime").JSX.Element;
