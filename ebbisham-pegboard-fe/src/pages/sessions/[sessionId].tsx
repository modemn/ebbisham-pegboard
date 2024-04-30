import { Col, Container, Row, Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap';

import styles from '@/styles/Home.module.css';
import PlayerList from '@/components/PlayerList/PlayerList';
import CourtList from '@/components/CourtList/CourtList';
import NextOn from '@/components/NextOn/NextOn';
import { useGlobalStore } from '@utils/store';
import { useCollection } from 'react-firebase-hooks/firestore';
import { doc, collection, getDoc } from 'firebase/firestore';
import { EPlayStatus, TPlayer } from '@utils/types';
import { useEffect } from 'react';
import { db } from '@ebb-firebase/clientApp';
import AddNewPlayerModal from '@/components/AddNewPlayerModal/AddNewPlayerModal';
import StopPlayerModal from '@/components/StopPlayerModal/StopPlayerModal';
import { InferGetServerSidePropsType } from 'next';

export const getServerSideProps = async (context: any) => {
    const sessionsRef = doc(db, 'sessions', context.query.sessionId);
    const sessionSnapshot = await getDoc(sessionsRef);
    if (!sessionSnapshot) {
        return { notFound: true };
    } else {
        return { props: { sessionId: context.query.sessionId } };
    }
};

export default function Page({ sessionId }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [setSessionId] = useGlobalStore((state) => [state.setSessionId]);
    const [setPlayers] = useGlobalStore((state) => [state.setPlayers]);
    const [setPlayersInQueue] = useGlobalStore((state) => [state.setPlayersInQueue]);
    const [setPausedPlayers] = useGlobalStore((state) => [state.setPausedPlayers]);
    const [toastNotification] = useGlobalStore((state) => [state.toastNotification]);
    const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification]);

    useEffect(() => {
        setSessionId(sessionId);
    }, [sessionId, setSessionId]);

    const [players, playersLoading, playersError] = useCollection(collection(db, 'players'), {});

    useEffect(() => {
        if (!playersLoading && !playersError && players) {
            const allPlayersFromDB = players.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TPlayer));
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
    }, [playersLoading, playersError, setPlayers, setPlayersInQueue, setPausedPlayers, players]);

    return (
        <>
            <AddNewPlayerModal />
            <StopPlayerModal />
            <ToastContainer className='p-3' position={'top-end'} style={{ zIndex: 1 }}>
                <Toast bg={toastNotification.variant} onClose={() => setToastNotification(false, '', '', undefined)} show={toastNotification.isOpen} delay={3000} autohide>
                    <ToastHeader closeButton={false}>
                        <strong className='me-auto'>{toastNotification.title}</strong>
                    </ToastHeader>
                    <ToastBody className={toastNotification.variant === 'danger' ? 'text-white' : 'text-dark'}>{toastNotification.message}</ToastBody>
                </Toast>
            </ToastContainer>
            <Container fluid className={styles.pageContainer}>
                <Row>
                    <Col className={styles.pageCol}>
                        <PlayerList playersError={playersError} playersLoading={playersLoading} />
                    </Col>
                    <Col className={styles.pageCol}>
                        <NextOn />
                    </Col>
                    <Col className={styles.pageCol} xs={5}>
                        <CourtList />
                    </Col>
                </Row>
            </Container>
        </>
    );
}
