import { useGlobalStore } from '@utils/store';
import React, { useEffect, useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap';
import { createPortal } from 'react-dom';
import { Combobox } from 'react-widgets/cjs';

import styles from './swap-player-modal.module.css';
import { TPlayer } from '@utils/types';

const SwapPlayerModal = () => {
    const [isSwapPlayerModalOpen] = useGlobalStore((state) => [state.isSwapPlayerModalOpen]);
    const [setIsSwapPlayerModalOpen] = useGlobalStore((state) => [state.setIsSwapPlayerModalOpen]);
    const [playersInQueue] = useGlobalStore((state) => [state.playersInQueue]);
    const [swapPlayers] = useGlobalStore((state) => [state.swapPlayers]);

    const [playerToSwapWith, setPlayerToSwapWith] = useState<TPlayer>();

    const [mounted, setMounted] = useState(false);

    const handleClose = () => {
        setIsSwapPlayerModalOpen(null);
        setPlayerToSwapWith(undefined);
    };

    const handleSwap = () => {
        if (isSwapPlayerModalOpen && playerToSwapWith) {
            console.log('swapping', isSwapPlayerModalOpen.name, 'with', playerToSwapWith.name);
            swapPlayers(isSwapPlayerModalOpen, playerToSwapWith);
            handleClose();
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            {mounted &&
                !!isSwapPlayerModalOpen &&
                createPortal(
                    <Modal show={!!isSwapPlayerModalOpen} onHide={handleClose} centered>
                        <ModalHeader closeButton>
                            <ModalTitle>Swap Player</ModalTitle>
                        </ModalHeader>
                        <ModalBody>
                            <p className={styles.swapText}>Swap</p>
                            <Combobox data={[]} dataKey='id' value={isSwapPlayerModalOpen.name} className={styles.combobox} disabled />
                            <p className={styles.swapText}>With</p>
                            <Combobox
                                data={Array.from(playersInQueue.values()).sort((a, b) => {
                                    const nameA = a.name.toLowerCase();
                                    const nameB = b.name.toLowerCase();
                                    if (nameA < nameB) return -1;
                                    if (nameA > nameB) return 1;
                                    return 0;
                                })}
                                dataKey='id'
                                textField='name'
                                renderListItem={({ item }) => <span>{item?.name}</span>}
                                placeholder='Select player to swap'
                                onChange={(value) => {
                                    setPlayerToSwapWith(value as TPlayer);
                                }}
                                value={playerToSwapWith}
                                className={styles.combobox}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant='secondary' onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSwap} disabled={!playerToSwapWith}>
                                Swap Player
                            </Button>
                        </ModalFooter>
                    </Modal>,
                    document.body
                )}
        </>
    );
};

export default SwapPlayerModal;
