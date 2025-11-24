import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../components/Modal';
import { AppProvider } from '../../context/AppContext';

describe('Modal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should render modal with title and message', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <AppProvider>
                <Modal
                    title="Test Title"
                    message="Test Message"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            </AppProvider>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Test Message')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <AppProvider>
                <Modal
                    title="Test"
                    message="Test"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            </AppProvider>
        );

        const confirmButton = screen.getByText('확인');
        fireEvent.click(confirmButton);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <AppProvider>
                <Modal
                    title="Test"
                    message="Test"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            </AppProvider>
        );

        const cancelButton = screen.getByText('취소');
        fireEvent.click(cancelButton);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Escape key is pressed', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();

        render(
            <AppProvider>
                <Modal
                    title="Test"
                    message="Test"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                />
            </AppProvider>
        );

        fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
        expect(onCancel).toHaveBeenCalledTimes(1);
    });
});

