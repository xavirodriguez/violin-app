/**
 * SettingsDialog
 * A dialog component for managing application-wide settings like audio input and sensitivity.
 */
import { FC } from 'react';
/**
 * Props for the SettingsDialog component.
 */
interface SettingsDialogProps {
    /** Controls whether the dialog is visible. */
    isOpen: boolean;
    /** Callback function to close the dialog. */
    onClose: () => void;
}
/**
 * Renders a settings modal that allows users to configure their audio environment.
 *
 * @param props - Component properties.
 * @returns A JSX element containing the dialog with device and sensitivity controls.
 */
declare const SettingsDialog: FC<SettingsDialogProps>;
export default SettingsDialog;
