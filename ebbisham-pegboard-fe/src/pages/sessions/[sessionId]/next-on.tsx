import { db } from '@ebb-firebase/clientApp';
import { TPlayer } from '@utils/types';
import { collection, doc, getDoc } from 'firebase/firestore';
import { Card, CardBody, ListGroup, ListGroupItem, Placeholder } from 'react-bootstrap';
import styles from './next-on-page.module.css';
import { InferGetServerSidePropsType } from 'next';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useEffect, useState } from 'react';

export const getServerSideProps = async (context: any) => {
    const sessionsRef = doc(db, 'sessions', context.query.sessionId);
    const sessionSnapshot = await getDoc(sessionsRef);
    if (!sessionSnapshot) {
        return { notFound: true };
    } else {
        return { props: { sessionId: context.query.sessionId } };
    }
};

export default function NextOnPage({ sessionId }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [nextOn, nextOnLoading, nextOnError] = useCollection(collection(db, 'sessions', sessionId, 'nextOn'), {});
    const [playersFromDB, playersFromDBLoading, playersFromDBError] = useCollection(collection(db, 'players'), {});

    const [nextOnPlayers, setNextOnPlayers] = useState<Map<number, TPlayer>>(new Map());
    const [players, setPlayers] = useState<Map<string, TPlayer>>(new Map());

    useEffect(() => {
        if (!playersFromDBLoading && !playersFromDBError && playersFromDB) {
            const allPlayersFromDB = playersFromDB.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TPlayer));
            setPlayers(new Map(allPlayersFromDB.map((p) => [p.id, p])));
        }
    }, [playersFromDB, playersFromDBError, playersFromDBLoading]);

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
                } else {
                    setNextOnPlayers(new Map());
                }
            });
            if (nextOnPlayerMap.size == 4) {
                setNextOnPlayers(nextOnPlayerMap);
            }
        }
    }, [nextOn, nextOnError, nextOnLoading, playersFromDB, playersFromDBLoading, playersFromDBError, players]);

    return (
        <div>
            <h3 className={styles.title}>Next On</h3>
            {nextOnPlayers.size === 0 && (
                <>
                    <ListGroup className={styles.playerGroups}>
                        <ListGroupItem variant='primary'>
                            <h1 className={styles.playerName}>???</h1>
                        </ListGroupItem>
                        <ListGroupItem variant='primary'>
                            <h1 className={styles.playerName}>???</h1>
                        </ListGroupItem>
                    </ListGroup>
                    <ListGroup className={styles.playerGroups}>
                        <ListGroupItem variant='danger'>
                            <h1 className={styles.playerName}>???</h1>
                        </ListGroupItem>
                        <ListGroupItem variant='danger'>
                            <h1 className={styles.playerName}>???</h1>
                        </ListGroupItem>
                    </ListGroup>
                </>
            )}
            {nextOnPlayers.size > 0 && (
                <>
                    <ListGroup className={styles.playerGroups}>
                        <ListGroupItem variant='primary'>
                            <h1 className={styles.playerName}>{(nextOnPlayers.get(0) as TPlayer).name}</h1>
                        </ListGroupItem>
                        <ListGroupItem variant='primary'>
                            <h1 className={styles.playerName}>{(nextOnPlayers.get(1) as TPlayer).name}</h1>
                        </ListGroupItem>
                    </ListGroup>
                    <ListGroup className={styles.playerGroups}>
                        <ListGroupItem variant='danger'>
                            <h1 className={styles.playerName}>{(nextOnPlayers.get(2) as TPlayer).name}</h1>
                        </ListGroupItem>
                        <ListGroupItem variant='danger'>
                            <h1 className={styles.playerName}>{(nextOnPlayers.get(3) as TPlayer).name}</h1>
                        </ListGroupItem>
                    </ListGroup>
                </>
            )}
        </div>
    );
}
