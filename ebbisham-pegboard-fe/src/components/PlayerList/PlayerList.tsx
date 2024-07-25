import React, { useEffect, useState } from 'react';
import { Button, ListGroup, OverlayTrigger, Tooltip } from 'react-bootstrap';
import 'react-widgets/styles.css';
import Combobox from 'react-widgets/Combobox';

import styles from './player-list.module.css';
import { EPlayStatus, TPlayer } from '@utils/types';
import { useGlobalStore } from '@utils/store';
import PlayerListItem from './PlayerListItem/PlayerListItem';
import { collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@ebb-firebase/clientApp';

const PlayerList = () => {
    const [players] = useGlobalStore((state) => [state.players]);
    const [playersInQueue] = useGlobalStore((state) => [state.playersInQueue]);
    const [pausedPlayers] = useGlobalStore((state) => [state.pausedPlayers]);
    const [setPlayers] = useGlobalStore((state) => [state.setPlayers]);
    const [setPlayersInQueue] = useGlobalStore((state) => [state.setPlayersInQueue]);
    const [setPausedPlayers] = useGlobalStore((state) => [state.setPausedPlayers]);
    const [addPlayerToQueue] = useGlobalStore((state) => [state.addPlayerToQueue]);
    const [setIsAddNewPlayerModalOpen] = useGlobalStore((state) => [state.setIsAddNewPlayerModalOpen]);

    const [comboBoxInput, setComboBoxInput] = useState('');

    const [playersFromDB, playersFromDBLoading, playersFromDBError] = useCollection(collection(db, 'players'), {});

    useEffect(() => {
        if (!playersFromDBLoading && !playersFromDBError && playersFromDB) {
            const allPlayersFromDB = playersFromDB.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TPlayer));
            setPlayers(allPlayersFromDB);
            const playersInQueueFromDB = allPlayersFromDB.filter((player) => {
                return Number(player.playStatus) > Number(EPlayStatus.PLAYING);
            });
            setPlayersInQueue(playersInQueueFromDB);
            const pausedPlayerFromDB = allPlayersFromDB.filter((player) => {
                return player.playStatus === EPlayStatus.PAUSED;
            });
            setPausedPlayers(pausedPlayerFromDB);
        }
    }, [playersFromDB, playersFromDBLoading, playersFromDBError, setPlayers, setPlayersInQueue, setPausedPlayers]);

    if (playersFromDBLoading) {
        return <p>Loading...</p>;
    }

    if (playersFromDBError) {
        return <p>Error: {playersFromDBError.message}</p>;
    }

    return (
        <div>
            <h3 className='mx-2 mb-3'>Players Queue</h3>
            <div className={styles.inputRow}>
                <Combobox
                    data={Array.from(players.values()).filter((player) => {
                        return Number(player.playStatus) === Number(EPlayStatus.NOT_PLAYING);
                    })}
                    dataKey='id'
                    textField='name'
                    renderListItem={({ item }) => <span>{item.name}</span>}
                    placeholder='Add Player to Queue'
                    onChange={(value) => {
                        setComboBoxInput(value as string);
                    }}
                    onSelect={(player) => addPlayerToQueue(player as TPlayer)}
                    value={comboBoxInput}
                    onBlur={() => {
                        setComboBoxInput('');
                    }}
                    busy={playersFromDBLoading}
                    className={styles.combobox}
                />
                <OverlayTrigger overlay={<Tooltip id='add-new-player-tooltip'>Add New Player</Tooltip>}>
                    <Button onClick={() => setIsAddNewPlayerModalOpen(true)}>
                        <i className='bi bi-person-fill-add' />
                    </Button>
                </OverlayTrigger>
            </div>

            {/* TODO: add button to stop all players */}
            {/* {Array.from(playersInQueue.values()).length > 0 && (
                <Button variant='secondary' className='w-100 mt-3' onClick={stopAllPlayers}>
                    Stop All Players
                </Button>
            )} */}

            {Array.from(playersInQueue.values()).length === 0 && Array.from(pausedPlayers.values()).length === 0 && <p className={styles.noPlayers}>No players in queue.</p>}
            {Array.from(playersInQueue.values()).length > 0 && (
                <>
                    <h4 className={styles.playersTitle}>Playing</h4>
                    <ListGroup className={styles.playerQueue}>
                        {Array.from(playersInQueue.values()).map((player: TPlayer, index: number) => {
                            return <PlayerListItem key={player.id} player={player} isChair={index === 0} />;
                        })}
                    </ListGroup>
                </>
            )}
            {Array.from(pausedPlayers.values()).length > 0 && <h4 className={styles.playersTitle}>Paused</h4>}
            {Array.from(pausedPlayers.values()).length > 0 && (
                <ListGroup className={styles.playerQueue}>
                    {Array.from(pausedPlayers.values()).map((player: TPlayer) => {
                        return <PlayerListItem key={player.id} player={player} />;
                    })}
                </ListGroup>
            )}
        </div>
    );
};

export default PlayerList;
