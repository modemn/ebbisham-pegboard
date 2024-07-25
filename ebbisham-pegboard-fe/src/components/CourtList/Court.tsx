import { TCourt, TPlayer } from '@utils/types';
import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, ListGroup, ListGroupItem, OverlayTrigger, Placeholder, Tooltip } from 'react-bootstrap';
import styles from './court.module.css';
import { useGlobalStore } from '@utils/store';
import { startCourt } from '@utils/firestore_utils';

type Props = {
    court: TCourt;
    canStartMatch: boolean;
};

const Court = ({ court, canStartMatch }: Props) => {
    const [setIsEndMatchModalOpen] = useGlobalStore((state) => [state.setIsEndMatchModalOpen]);
    const [movePlayersToCourt] = useGlobalStore((state) => [state.movePlayersToCourt]);
    const [players, setPlayers] = useState<{ [key: number]: TPlayer }>();

    useEffect(() => {
        if (court.players[0].length > 0) {
            const allPlayers = useGlobalStore.getState().players;
            const playersOnCourt = {
                0: allPlayers.get(court.players[0]) as TPlayer,
                1: allPlayers.get(court.players[1]) as TPlayer,
                2: allPlayers.get(court.players[2]) as TPlayer,
                3: allPlayers.get(court.players[3]) as TPlayer,
            };

            setPlayers(playersOnCourt);
        }
    }, [court.players]);

    const handleStartMatch = () => {
        const nextOnPlayers = useGlobalStore.getState().nextOnPlayers;
        const startedCourt: TCourt = {
            ...court,
            matchStartTime: Date.now(),
            players: {
                0: nextOnPlayers.get(0)?.id as string,
                1: nextOnPlayers.get(1)?.id as string,
                2: nextOnPlayers.get(2)?.id as string,
                3: nextOnPlayers.get(3)?.id as string,
            },
        };

        movePlayersToCourt(startedCourt);
        setPlayers(Object.fromEntries(nextOnPlayers));
    };

    return (
        <Card style={{ marginBottom: '1rem' }}>
            <CardBody>
                <ListGroup className='text-center'>
                    <ListGroupItem>{players ? players[0].name : <Placeholder xs={6} />}</ListGroupItem>
                    <ListGroupItem>{players ? players[1].name : <Placeholder xs={6} />}</ListGroupItem>
                </ListGroup>
                <h4 className={styles.vs}>Court {court.courtNumber}</h4>
                <ListGroup className='text-center'>
                    <ListGroupItem>{players ? players[2].name : <Placeholder xs={6} />}</ListGroupItem>
                    <ListGroupItem>{players ? players[3].name : <Placeholder xs={6} />}</ListGroupItem>
                </ListGroup>
            </CardBody>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', marginInline: '1rem' }}>
                <Button disabled={!canStartMatch} onClick={handleStartMatch}>
                    Start Match
                </Button>
                <OverlayTrigger overlay={<Tooltip id='finish-match'>End Match</Tooltip>}>
                    <Button
                        variant='success'
                        disabled={court.matchStartTime == 0}
                        onClick={() => {
                            const playerValues = Object.values(players ?? {});
                            setIsEndMatchModalOpen({
                                ...court,
                                players: {
                                    0: playerValues[0].id,
                                    1: playerValues[1].id,
                                    2: playerValues[2].id,
                                    3: playerValues[3].id,
                                },
                            });
                        }}
                    >
                        <i className='bi bi-check-lg' />
                    </Button>
                </OverlayTrigger>
            </div>
        </Card>
    );
};

export default Court;
