import { Col, Container, Row, Toast, ToastBody, ToastContainer, ToastHeader } from 'react-bootstrap';

import styles from '@/styles/Home.module.css';
import PlayerList from '@/components/PlayerList/PlayerList';
import CourtList from '@/components/CourtList/CourtList';
import NextOn from '@/components/NextOn/NextOn';
import { useGlobalStore } from '@utils/store';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import { db } from '@ebb-firebase/clientApp';
import AddNewPlayerModal from '@/components/AddNewPlayerModal/AddNewPlayerModal';
import StopPlayerModal from '@/components/StopPlayerModal/StopPlayerModal';
import { InferGetServerSidePropsType } from 'next';
import EndMatchModal from '@/components/EndMatchModal/EndMatchModal';

export const getServerSideProps = async (context: any) => {
    const sessionsRef = doc(db, 'sessions', context.query.sessionId);
    const sessionSnapshot = await getDoc(sessionsRef);
    if (!sessionSnapshot) {
        return { notFound: true };
    } else {
        return { props: { sessionId: context.query.sessionId } };
    }
};

export default function SessionPage({ sessionId }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const [setSessionId] = useGlobalStore((state) => [state.setSessionId]);
    const [toastNotification] = useGlobalStore((state) => [state.toastNotification]);
    const [setToastNotification] = useGlobalStore((state) => [state.setToastNotification]);

    useEffect(() => {
        setSessionId(sessionId);
    }, [sessionId, setSessionId]);

    return (
        <>
            <AddNewPlayerModal />
            <StopPlayerModal />
            <EndMatchModal />
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
                        <PlayerList />
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
