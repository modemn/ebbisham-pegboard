import { canPick, pickNextGame } from '@utils/match-pick-utils';
import { useGlobalStore } from '@utils/store';
import { TPlayer } from '@utils/types';
import React, { useEffect, useState } from 'react';
import { Button, Card, CardBody, ListGroup, ListGroupItem, Spinner, Placeholder } from 'react-bootstrap';
import styles from './next-on.module.css';
import { collection } from 'firebase/firestore';
import { db } from '@ebb-firebase/clientApp';
import { useCollection } from 'react-firebase-hooks/firestore';

const NextOn: React.FC = () => {
    const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification]);
    const [loading, setLoading] = useState(false);
    const [nextOnPlayers] = useGlobalStore((state) => [state.nextOnPlayers]);
    const [setNextOnPlayers] = useGlobalStore((state) => [state.setNextOnPlayers]);
    const [addPlayersToNextOn] = useGlobalStore((state) => [state.addPlayersToNextOn]);
    const [returnNextOnPlayersToQueue] = useGlobalStore((state) => [state.returnNextOnPlayersToQueue]);
    const [sessionId] = useGlobalStore((state) => [state.sessionId]);
    const [players] = useGlobalStore((state) => [state.players]);
    const [playersInQueue] = useGlobalStore((state) => [state.playersInQueue]);

    const [nextOn, nextOnLoading, nextOnError] = useCollection(collection(db, 'sessions', sessionId, 'nextOn'), {});

    useEffect(() => {
        if (!nextOnLoading && !nextOnError && nextOn) {
            const nextOnPlayerMap = new Map<number, TPlayer>();
            nextOn.docs.forEach((doc) => {
                const playerId = doc.data().playerId;
                if (playerId.length > 0) {
                    const player = players.get(doc.data().playerId);
                    if (player) {
                        nextOnPlayerMap.set(Number(doc.id), player);
                    }
                }
            });
            if (nextOnPlayerMap.size == 4) {
                setNextOnPlayers(nextOnPlayerMap);
            }
        }
    }, [nextOn, nextOnError, nextOnLoading, players, setNextOnPlayers]);

    const handlePickNext = () => {
        const { pickable, reason } = canPick();
        if (pickable) {
            setLoading(true);
            const players = pickNextGame();
            addPlayersToNextOn(players);
            setLoading(false);
        } else {
            setToastNotification(true, reason, 'Error', 'danger');
        }
    };

    const handleReturnToQueue = () => {
        setLoading(true);
        returnNextOnPlayersToQueue();
        setLoading(false);
    };

    return (
        <div>
            <h3 className='mb-3'>Next On</h3>
            <Button className='w-100 mb-3' onClick={handlePickNext} disabled={playersInQueue.size < 4}>
                Pick Next Match
                <i className='bi bi-arrow-right-square mx-2' />
            </Button>
            <Button className='w-100 mb-3' onClick={handleReturnToQueue} variant='secondary' disabled={nextOnPlayers.size === 0}>
                Return to Queue
                <i className='bi bi-arrow-left-square mx-2' />
            </Button>
            {/* TODO: add in a checkbox for autopicking the next match so user doesn't have to keep clicking the button */}
            {/* Initial state - user hasn't clicked the button yet */}
            {nextOnPlayers.size === 0 && !loading && (
                <Card>
                    <CardBody>
                        <ListGroup className='text-center'>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                        </ListGroup>
                        <h4 className='my-3 text-center'>VS</h4>
                        <ListGroup className='text-center'>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                        </ListGroup>
                    </CardBody>
                </Card>
            )}
            {/* Loading state - user has clicked the button */}
            {loading && (
                <Card>
                    <CardBody>
                        <ListGroup className='text-center'>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                        </ListGroup>
                        <h4 className='my-3 text-center'>
                            <Spinner />
                        </h4>
                        <ListGroup className='text-center'>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                            <ListGroupItem>
                                <Placeholder xs={6} />
                            </ListGroupItem>
                        </ListGroup>
                    </CardBody>
                </Card>
            )}
            {/* Final state - user has clicked the button and the game has been picked */}
            {!loading && nextOnPlayers.size > 0 && (
                <Card>
                    <CardBody>
                        <ListGroup className='text-center'>
                            <ListGroupItem>{(nextOnPlayers.get(0) as TPlayer).name}</ListGroupItem>
                            <ListGroupItem>{(nextOnPlayers.get(1) as TPlayer).name}</ListGroupItem>
                        </ListGroup>
                        <h4 className={styles.vs}>VS</h4>
                        <ListGroup className='text-center'>
                            <ListGroupItem>{(nextOnPlayers.get(2) as TPlayer).name}</ListGroupItem>
                            <ListGroupItem>{(nextOnPlayers.get(3) as TPlayer).name}</ListGroupItem>
                        </ListGroup>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default NextOn;
